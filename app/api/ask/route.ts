import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { ask } from "@/lib/ask/pipeline";
import { askEnabled, takeSlot } from "@/lib/ask/limits";

// Privacy (plan section 10): the question text is never logged, stored or put in a URL.
// Errors are logged without the question.

const MAX = 500;
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "bad_request" }, { status: 400, headers: noStore });
  }

  const { question, lang } = (body ?? {}) as { question?: unknown; lang?: unknown };
  if (typeof question !== "string" || !question.trim() || typeof lang !== "string" || !isLocale(lang)) {
    return NextResponse.json({ status: "bad_request" }, { status: 400, headers: noStore });
  }
  if (question.length > MAX) {
    return NextResponse.json({ status: "too_long" }, { status: 413, headers: noStore });
  }
  if (!askEnabled()) {
    return NextResponse.json({ status: "not_ready" }, { headers: noStore });
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const slot = takeSlot(visitor);
  if (slot !== "ok") {
    return NextResponse.json({ status: "rate_limited" }, { status: 429, headers: noStore });
  }

  try {
    return NextResponse.json(await ask(question.trim()), { headers: noStore });
  } catch (err) {
    console.error("ask pipeline failed:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ status: "error" }, { status: 502, headers: noStore });
  }
}
