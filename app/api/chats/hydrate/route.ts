import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hydrateAnswer, type HydrateResult } from "@/lib/chat/hydrate";
import { visitorKey } from "@/lib/ask/limits";
import { sameOrigin } from "@/lib/same-origin";
import { attachScholarTranslations } from "@/lib/ask/display-translations";

// Opens saved chats: takes the stored answers (source texts removed) of a signed-in person and returns
// them with the Quran and hadith texts loaded fresh from their sources. Only signed-in people can use
// it, so it cannot be used to pull verses out of our Quran Foundation access.
const MAX_BODY_BYTES = 3_000_000;
const MAX_ANSWERS = 50;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;
const noStore = { "Cache-Control": "no-store" };

export type HydrateDeps = {
  verifyUser: (token: string) => Promise<boolean>;
  hydrate: (stored: unknown) => Promise<HydrateResult>;
};

const reply = (body: Record<string, unknown>, code = 200) => NextResponse.json(body, { status: code, headers: noStore });

// A small in-memory limit of its own, so opening chats never uses up the visitor's Ask questions.
const seen = new Map<string, number[]>();
let lastSweep = 0;
export function hydrateAllowed(key: string, now = Date.now()): boolean {
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of seen) {
      const live = v.filter((t) => now - t < WINDOW_MS);
      if (live.length) seen.set(k, live);
      else seen.delete(k);
    }
  }
  const times = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_REQUESTS) return false;
  times.push(now);
  seen.set(key, times);
  return true;
}

export async function handleHydrate(request: Request, deps: HydrateDeps): Promise<Response> {
  if (!sameOrigin(request)) return reply({ status: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply({ status: "bad_request" }, 415);
  // Limit first, so strangers cannot hammer the sign-in check either.
  if (!hydrateAllowed(visitorKey(request.headers.get("x-forwarded-for")))) return reply({ status: "rate_limited" }, 429);
  const token = request.headers.get("authorization")?.match(/^Bearer (\S{20,4000})$/)?.[1];
  if (!token || !(await deps.verifyUser(token))) return reply({ status: "unauthorized" }, 401);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply({ status: "too_long" }, 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply({ status: "too_long" }, 413);
    body = JSON.parse(raw);
  } catch { return reply({ status: "bad_request" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((k) => k !== "answers")) return reply({ status: "bad_request" }, 400);
  const answers = (body as { answers?: unknown }).answers;
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) return reply({ status: "bad_request" }, 400);

  const results = await Promise.all(answers.map((a) => deps.hydrate(a)));
  return reply({ status: "ok", results });
}

function serverDeps(): HydrateDeps {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async verifyUser(token) {
      const { data, error } = await db.auth.getUser(token);
      return !error && !!data.user;
    },
    hydrate: async (stored) => {
      const result = await hydrateAnswer(stored);
      return result.ok ? { ok: true, answer: await attachScholarTranslations(result.answer) } : result;
    },
  };
}

export async function POST(request: Request) {
  try { return await handleHydrate(request, serverDeps()); } catch { return reply({ status: "error" }, 502); }
}
