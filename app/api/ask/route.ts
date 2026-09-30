import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { ask } from "@/lib/ask/pipeline";
import { askEnabled, takeSlot, visitorKey, withSlot } from "@/lib/ask/limits";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { sameOrigin } from "@/lib/same-origin";

// Privacy (plan section 10): the question text is never logged, stored or put in a URL.
// Errors are logged without the question.

export const maxDuration = 60;

const MAX_QUESTION = 500;
const MAX_BODY_BYTES = 4096;
const noStore = { "Cache-Control": "no-store" };

const reply = (status: string, code = 200) => NextResponse.json({ status }, { status: code, headers: noStore });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply("forbidden", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply("bad_request", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply("too_long", 413);
  if (!askEnabled()) return reply("not_ready");

  // Count the request before reading or parsing anything, so floods cost as little as possible.
  const slot = takeSlot(visitorKey(request.headers.get("x-forwarded-for")));
  if (slot !== "ok") return reply("rate_limited", 429);

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply("too_long", 413);
    body = JSON.parse(raw);
  } catch {
    return reply("bad_request", 400);
  }

  const { question, lang } = (body ?? {}) as { question?: unknown; lang?: unknown };
  if (typeof question !== "string" || !question.trim() || typeof lang !== "string" || !isLocale(lang)) {
    return reply("bad_request", 400);
  }
  if (question.length > MAX_QUESTION) return reply("too_long", 413);

  try {
    return NextResponse.json(await withSlot(() => ask(question.trim(), lang)), { headers: noStore });
  } catch (err) {
    // Google busy on every door: say so, so the visitor knows it is not their question.
    // A deadline hit (slow AI) is shown the same way.
    if (err instanceof GoogleBusyError || (err instanceof Error && err.name === "TimeoutError")) {
      console.warn("ask: AI busy");
      return reply("busy", 503);
    }
    console.error("ask pipeline failed:", err instanceof Error ? err.message : "unknown error");
    return reply("error", 502);
  }
}
