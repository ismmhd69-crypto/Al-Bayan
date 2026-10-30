import "server-only";
import { visitorKey } from "@/lib/ask/limits";

// Word search is cheap but reaches paid or shared services (Quran Foundation, the database), so it has
// its own limit, separate from Ask. In memory only, like the Ask limits: the visitor is a short code
// made from the address with a random key, never the address itself, and nothing is written to disk.
const WINDOW_MS = 60_000;
const PER_WINDOW = 40;

const recent = new Map<string, number[]>();
let lastSweep = 0;

export function allowSearch(forwardedFor: string | null, now = Date.now()): boolean {
  if (now - lastSweep > WINDOW_MS) {
    lastSweep = now;
    for (const [k, v] of recent) {
      const live = v.filter((t) => now - t < WINDOW_MS);
      if (live.length) recent.set(k, live);
      else recent.delete(k);
    }
  }
  const visitor = visitorKey(forwardedFor);
  const times = (recent.get(visitor) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW) return false;
  times.push(now);
  recent.set(visitor, times);
  return true;
}

/** The query as the search sees it: trimmed, one line, bounded. Null when it is too short to search. */
export function cleanQuery(raw: string | null, max = 100): string | null {
  const q = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return q.length >= 2 && /[\p{L}\p{N}]/u.test(q) ? q : null;
}

export function readPage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isInteger(n) ? Math.min(20, Math.max(1, n)) : 1;
}
