import { randomUUID } from "node:crypto";
import { diagnosticLogger } from "@/lib/ask/diagnostics";
import { withAskRequest, errorCategory } from "@/lib/ask/trace-context";
import { askClaimAudit, askLibraryFlow, askTiered } from "@/lib/ask/settings";
import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { ask } from "@/lib/ask/pipeline";
import { askEnabled, takeSlot, visitorKey, withSlot } from "@/lib/ask/limits";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { sameOrigin } from "@/lib/same-origin";
import { attachScholarTranslations } from "@/lib/ask/display-translations";
import { MAX_ASK_BODY_BYTES, parseUserHistory } from "@/lib/ask/conversation";
import { getDictionary } from "@/lib/i18n";

// Privacy (plan section 10): the question text is never logged, stored or put in a URL.
// Errors are logged without the question.

export const maxDuration = 60;

const MAX_QUESTION = 500;
const MAX_BODY_BYTES = MAX_ASK_BODY_BYTES;
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const started = Date.now(), requestId = randomUUID();
  const log = diagnosticLogger(process.env.ASK_DEBUG === "true", {
    requestId, revision: process.env.VERCEL_GIT_COMMIT_SHA, writerChain: "unknown", verifierChain: "unknown",
    claimAudit: askClaimAudit(), tiered: askTiered(), lean: process.env.ASK_LEAN === "true", libraryFlow: askLibraryFlow(),
  }, (line) => console.info(line));
  const headers = { ...noStore, "X-Ask-Request-Id": requestId };
  const reply = (status: string, code = 200) => {
    log("response", "request_finished", Date.now() - started, { status, http_status: code });
    return NextResponse.json({ status }, { status: code, headers });
  };
  log("request", "request_received", 0);
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

  const { question, lang, previous_user_messages, supports_clarification } = (body ?? {}) as { question?: unknown; lang?: unknown; previous_user_messages?: unknown; supports_clarification?: unknown };
  if (typeof question !== "string" || !question.trim() || typeof lang !== "string" || !isLocale(lang)) {
    return reply("bad_request", 400);
  }
  if (question.length > MAX_QUESTION) return reply("too_long", 413);
  const history = parseUserHistory(previous_user_messages);
  if (history === null) return reply("bad_request", 400);

  try {
    log("request", "request_validated", Date.now() - started, { question_chars: question.trim().length, history_count: history.length, language: lang });
    const result = await withAskRequest(requestId, () => withSlot(() => history.length ? ask(question.trim(), lang, undefined, history) : ask(question.trim(), lang)), started);
    if (result.status === "answer" && result.answer.v2) {
      const displayStarted = Date.now();
      log("display", "display_translation_started", Date.now() - started);
      result.answer.v2 = await attachScholarTranslations(result.answer.v2);
      log("display", "display_translation_finished", Date.now() - started, { duration_ms: Date.now() - displayStarted });
    }
    // Older clients understand no_summary. They retain a safe readable response instead of an
    // unknown-status error; new clients advertise support and receive clarification controls.
    log("response", "request_finished", Date.now() - started, { status: result.status === "clarify" && supports_clarification !== true ? "no_summary" : result.status, http_status: 200 });
    return NextResponse.json(result.status === "clarify" ? { ...result, status: supports_clarification === true ? "clarify" : "no_summary", text: getDictionary(result.language).ask.clarify,
      clarification: { ...result.clarification, prompt: getDictionary(result.language).ask.clarify } } : result, { headers });
  } catch (err) {
    log("response", "request_failed", Date.now() - started, { outcome: errorCategory(err) });
    // Google busy on every door: say so, so the visitor knows it is not their question.
    // A deadline hit (slow AI) is shown the same way.
    if (err instanceof GoogleBusyError || (err instanceof Error && err.name === "TimeoutError")) {
      console.warn("ask: AI busy");
      return reply("busy", 503);
    }
    console.error("ask pipeline failed:", errorCategory(err));
    return reply("error", 502);
  }
}
