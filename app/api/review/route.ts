import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { locales } from "@/lib/i18n";
import { setReviewDecision } from "@/lib/content";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { preparedContentHash } from "@/lib/prepared";

import { sameOrigin } from "@/lib/same-origin";
// Stores a review decision from the review tab (Mo, 2026-09-29: public until launch) and refreshes the
// topic page so an approved answer appears at once. Only known answer ids and fixed statuses are accepted.
const MAX_BODY = 2048;

function authorized(request: Request): boolean {
  const expected = process.env.BAYAN_REVIEW_KEY;
  const supplied = request.headers.get("x-bayan-review-key");
  if (!expected || expected.length < 32 || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (process.env.BAYAN_REVIEW_ENABLED !== "true") return NextResponse.json({ status: "not_found" }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ status: "forbidden" }, { status: 403 });
  if (!authorized(request)) return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return NextResponse.json({ status: "too_long" }, { status: 413 });
  let body: { kind?: unknown; id?: unknown; status?: unknown; note?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const kind = body?.kind === "topic" || body?.kind === "prepared" ? body.kind : null;
  const known = kind === "topic" ? TOPIC_ANSWERS : PREPARED_ANSWERS;
  const id = kind && typeof body?.id === "string" && Object.hasOwn(known, body.id) ? body.id : null;
  const status = body?.status === "approved" || body?.status === "rejected" || body?.status === "draft" ? body.status : null;
  const note = typeof body?.note === "string" ? body.note.slice(0, 1000) : "";
  if (!kind || !id || !status) return NextResponse.json({ status: "bad_request" }, { status: 400 });
  if (!(await setReviewDecision(kind, id, status, note, preparedContentHash(known[id])))) return NextResponse.json({ status: "error" }, { status: 502 });
  if (kind === "topic") for (const lang of locales) revalidatePath(`/${lang}/topics/${id}`);
  return NextResponse.json({ status: "ok" });
}
