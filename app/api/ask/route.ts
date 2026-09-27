import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";

// The automatic answer pipeline (plan section 7) plugs in here in phase 3,
// once the trusted-source library exists. Until then Bayan never guesses.
// The question text is never logged or stored.

const MAX = 500;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "bad_request" }, { status: 400 });
  }

  const { question, lang } = (body ?? {}) as { question?: unknown; lang?: unknown };
  if (typeof question !== "string" || !question.trim() || typeof lang !== "string" || !isLocale(lang)) {
    return NextResponse.json({ status: "bad_request" }, { status: 400 });
  }
  if (question.length > MAX) {
    return NextResponse.json({ status: "too_long" }, { status: 413 });
  }

  return NextResponse.json({ status: "not_ready" }, { headers: { "Cache-Control": "no-store" } });
}
