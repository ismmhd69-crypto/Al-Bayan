import "server-only";
import { NextResponse } from "next/server";
import { hydrateAnswer, type HydrateResult } from "@/lib/chat/hydrate";
import { visitorKey } from "@/lib/ask/limits";
import { sameOrigin } from "@/lib/same-origin";

// Opens one saved answer (Saved page), also for visitors who are not signed in and keep saves on their
// device. The stored answer has no Quran or hadith text; this loads those texts fresh from their sources
// and runs the same strict validators as every answer. It only returns texts a valid stored answer
// already cites, the same verses the public Quran pages show. Same-site only, small body, its own limit.
const MAX_BODY_BYTES = 300_000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const noStore = { "Cache-Control": "no-store" };
const reply = (body: Record<string, unknown>, code = 200) => NextResponse.json(body, { status: code, headers: noStore });

const seen = new Map<string, number[]>();
let lastSweep = 0;
export function savedHydrateAllowed(key: string, now = Date.now()): boolean {
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

export type SavedHydrateDeps = { hydrate: (stored: unknown) => Promise<HydrateResult> };

export async function handleSavedHydrate(request: Request, deps: SavedHydrateDeps): Promise<Response> {
  if (!sameOrigin(request)) return reply({ status: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply({ status: "bad_request" }, 415);
  if (!savedHydrateAllowed(visitorKey(request.headers.get("x-forwarded-for")))) return reply({ status: "rate_limited" }, 429);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply({ status: "too_long" }, 413);
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply({ status: "too_long" }, 413);
    body = JSON.parse(raw);
  } catch { return reply({ status: "bad_request" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((k) => k !== "answer")) return reply({ status: "bad_request" }, 400);
  const result = await deps.hydrate((body as { answer?: unknown }).answer);
  return result.ok ? reply({ status: "ok", answer: result.answer }) : reply({ status: "unavailable" }, 422);
}

