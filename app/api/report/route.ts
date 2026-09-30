import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/lib/i18n";
import { takeSlot, visitorKey } from "@/lib/ask/limits";
import { sameOrigin } from "@/lib/same-origin";

const MAX_BODY_BYTES = 2048;
const MAX_COMMENT = 500;
const REASONS = new Set(["wrong_source", "misquoted", "not_answering", "unclear", "offensive", "other"]);
const SOURCE_ID = /^(?:Q\d{1,3}:\d{1,3}|HE\d{1,12}|S[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i;
const noStore = { "Cache-Control": "no-store" };

export type ReportInput = { lang: Locale; reason: string; source_ids: string[] | null; comment: string | null };
type ReportStore = { insert: (report: ReportInput) => Promise<{ error?: { message: string } | null }> };

const reply = (status: string, code = 200) => NextResponse.json({ status }, { status: code, headers: noStore });

export function validateReport(body: unknown): ReportInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const allowed = new Set(["lang", "reason", "source_ids", "comment"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return null;
  if (typeof value.lang !== "string" || !isLocale(value.lang) || typeof value.reason !== "string" || !REASONS.has(value.reason)) return null;
  let sourceIds: string[] | null = null;
  if (value.source_ids !== undefined) {
    if (!Array.isArray(value.source_ids) || value.source_ids.length > 12 || value.source_ids.some((id) => typeof id !== "string" || !SOURCE_ID.test(id))) return null;
    sourceIds = [...new Set(value.source_ids)];
  }
  let comment: string | null = null;
  if (value.comment !== undefined) {
    if (typeof value.comment !== "string" || value.comment.length > MAX_COMMENT) return null;
    comment = value.comment.trim() || null;
  }
  return { lang: value.lang, reason: value.reason, source_ids: sourceIds, comment };
}

export async function handleReport(request: Request, store: ReportStore): Promise<Response> {
  if (!sameOrigin(request)) return reply("forbidden", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply("bad_request", 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply("too_long", 413);
  if (takeSlot(visitorKey(request.headers.get("x-forwarded-for"))) !== "ok") return reply("rate_limited", 429);
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply("too_long", 413);
    body = JSON.parse(raw);
  } catch { return reply("bad_request", 400); }
  const report = validateReport(body);
  if (!report) return reply("bad_request", 400);
  const result = await store.insert(report);
  return result.error ? reply("error", 502) : reply("received", 201);
}

function serverStore(): ReportStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Report storage is not configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async insert(report) {
      // The editorial schema is private; a server-only database function stores the report.
      const { error } = await db.rpc("submit_answer_report", {
        report_lang: report.lang,
        report_reason: report.reason,
        report_source_ids: report.source_ids,
        report_comment: report.comment,
      });
      return { error };
    },
  };
}

export async function POST(request: Request) {
  try { return await handleReport(request, serverStore()); } catch { return reply("error", 502); }
}
