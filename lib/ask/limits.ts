import "server-only";
import { createHmac, randomBytes } from "node:crypto";

// Abuse and cost limits (plan section 11). Kept in memory only: nothing about the visitor
// is written to disk, logs or the database, and raw IP addresses are never kept.
// NOTE: memory is per server instance. Before any public launch this must move to a shared
// store (Codex review, finding 8). Until then Ask stays off outside local testing.

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const PER_VISITOR = positiveInt(process.env.ASK_LIMIT_PER_10_MIN, 8);
const PER_DAY = positiveInt(process.env.ASK_DAILY_LIMIT, 200);
const MAX_CONCURRENT = positiveInt(process.env.ASK_MAX_CONCURRENT, 4);
const WINDOW_MS = 10 * 60 * 1000;

// A random key made at start-up and never stored: the same visitor maps to the same short code
// for a while, but the code cannot be turned back into an IP address.
const SALT = randomBytes(32);

export function visitorKey(forwardedFor: string | null): string {
  const ip = forwardedFor?.split(",")[0]?.trim() || "local";
  return createHmac("sha256", SALT).update(ip).digest("base64url").slice(0, 16);
}

export function askEnabled(): boolean {
  // Global off switch. Off unless explicitly turned on.
  return process.env.ASK_ENABLED === "true";
}

const recent = new Map<string, number[]>();
let day = { date: "", count: 0 };
let lastSweep = 0;
let running = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of recent) {
    const live = v.filter((t) => now - t < WINDOW_MS);
    if (live.length) recent.set(k, live);
    else recent.delete(k);
  }
}

export function takeSlot(visitor: string): "ok" | "visitor_limit" | "daily_limit" | "busy" {
  const now = Date.now();
  sweep(now);
  const today = new Date(now).toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  if (day.count >= PER_DAY) return "daily_limit";
  if (running >= MAX_CONCURRENT) return "busy";

  const times = (recent.get(visitor) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_VISITOR) return "visitor_limit";
  times.push(now);
  recent.set(visitor, times);
  day.count++;
  return "ok";
}

// Wraps one answer so parallel answers are counted.
export async function withSlot<T>(work: () => Promise<T>): Promise<T> {
  running++;
  try {
    return await work();
  } finally {
    running--;
  }
}
