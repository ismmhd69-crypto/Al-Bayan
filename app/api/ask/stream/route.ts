import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ask } from "@/lib/ask/pipeline";
import { askRich, askStreaming } from "@/lib/ask/settings";
import { askEnabled, takeSlot, visitorKey, withSlot } from "@/lib/ask/limits";
import { sameOrigin } from "@/lib/same-origin";
import { isLocale } from "@/lib/i18n";
import { parseUserHistory, MAX_ASK_BODY_BYTES } from "@/lib/ask/conversation";
import { withAskRequest } from "@/lib/ask/trace-context";
import type { RichCallbacks, RichEvent, RichSection } from "@/lib/ask/rich-answer";
import { askTimeout } from "@/lib/ask/timing";
import { abortable } from "@/lib/ask/abort";

export const maxDuration = 60;
export async function POST(request: Request) {
  const started = Date.now(), requestId = randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Ask-Request-Id": requestId };
  const reply = (status: string, code = 200) => NextResponse.json({ status }, { status: code, headers });
  if (!sameOrigin(request)) return reply("forbidden", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply("bad_request", 415);
  if (!askEnabled() || !askRich()) return reply("not_ready", 404);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_ASK_BODY_BYTES) return reply("too_long", 413);
  const slot = takeSlot(visitorKey(request.headers.get("x-forwarded-for")));
  if (slot !== "ok") return reply("rate_limited", 429);
  let body: Record<string, unknown>;
  try { const text = await request.text(); if (new TextEncoder().encode(text).length > MAX_ASK_BODY_BYTES) return reply("too_long", 413); body = JSON.parse(text); }
  catch { return reply("bad_request", 400); }
  if (!body || typeof body.question !== "string" || !body.question.trim() || typeof body.lang !== "string" || !isLocale(body.lang)) return reply("bad_request", 400);
  if (body.question.length > 500) return reply("too_long", 413);
  const history = parseUserHistory(body.previous_user_messages); if (!history) return reply("bad_request", 400);
  const question = body.question.trim(), lang = body.lang;
  const cancel = new AbortController(), signal = askTimeout(AbortSignal.any([request.signal, cancel.signal]), 55_000, "stream_route");
  let delivered: RichSection[] = [], withdrawn = false;
  const incomplete = () => ({ status: "incomplete", language: lang, withdraw: withdrawn, sections: delivered });
  const run = (callbacks: RichCallbacks) => withAskRequest(requestId, () => withSlot(() => abortable(ask(question, lang, undefined, history, { rich: {
    onProgress: callbacks.onProgress,
    onSection: section => { delivered.push(section); callbacks.onSection?.(section); },
    onWithdraw: () => { delivered = []; withdrawn = true; callbacks.onWithdraw?.(); },
  }, signal }), signal)), started);
  if (!askStreaming()) {
    try { return NextResponse.json(await run({}), { headers }); } catch { return delivered.length || withdrawn ? NextResponse.json(incomplete(), { headers }) : reply(signal.aborted ? "busy" : "error", 503); }
    finally { cancel.abort(); }
  }
  let sequence = 0, ended = false, partial = false;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: Omit<RichEvent, "request_id" | "sequence"> | Record<string, unknown>) => {
        if (ended || request.signal.aborted || cancel.signal.aborted) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...event, request_id: requestId, sequence: ++sequence })}\n\n`)); }
        catch { cancel.abort(); ended = true; }
      };
      void run({ onProgress: stage => send({ type: "progress", stage }), onSection: section => { partial ||= section.outcome === "ready"; send({ type: "section", section }); }, onWithdraw: () => send({ type: "withdraw" }) })
        .then(result => send({ type: "terminal", result }))
        .catch(() => send({ type: "terminal", result: partial || delivered.length || withdrawn ? incomplete() : { status: signal.aborted ? "busy" : "error" } }))
        .finally(() => { if (!ended) { ended = true; try { controller.close(); } catch { /* reader cancelled */ } } cancel.abort(); });
    },
    cancel() { ended = true; cancel.abort(); },
  });
  return new Response(stream, { headers: { ...headers, "Content-Type": "text/event-stream; charset=utf-8", "X-Accel-Buffering": "no", "X-Ask-Request-Id": requestId } });
}
