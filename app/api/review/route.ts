import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";
import { setReviewDecision } from "@/lib/content";
import { TOPIC_ANSWERS } from "@/data/topic-answers";

// Stores a review decision from the review tab (Mo, 2026-09-29: public until launch) and refreshes the
// topic page so an approved answer appears at once. Only known answer ids and fixed statuses are accepted.
const MAX_BODY = 2048;

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ status: "forbidden" }, { status: 403 });
  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return NextResponse.json({ status: "too_long" }, { status: 413 });
  let body: { kind?: unknown; id?: unknown; status?: unknown; note?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const id = typeof body?.id === "string" && Object.hasOwn(TOPIC_ANSWERS, body.id) ? body.id : null;
  const status = body?.status === "approved" || body?.status === "rejected" || body?.status === "draft" ? body.status : null;
  const note = typeof body?.note === "string" ? body.note.slice(0, 1000) : "";
  if (body?.kind !== "topic" || !id || !status) return NextResponse.json({ status: "bad_request" }, { status: 400 });
  if (!(await setReviewDecision("topic", id, status, note))) return NextResponse.json({ status: "error" }, { status: 502 });
  for (const lang of locales) revalidatePath(`/${lang}/topics/${id}`);
  return NextResponse.json({ status: "ok" });
}
