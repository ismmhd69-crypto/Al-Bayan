import "server-only";

// Abuse and cost limits (plan section 11). Kept in memory only: nothing about the
// visitor is written to disk, logs or the database.

const PER_VISITOR = Number(process.env.ASK_LIMIT_PER_10_MIN ?? 8);
const PER_DAY = Number(process.env.ASK_DAILY_LIMIT ?? 200);
const WINDOW_MS = 10 * 60 * 1000;

const recent = new Map<string, number[]>();
let day = { date: "", count: 0 };

export function askEnabled(): boolean {
  // Global off switch. Off unless explicitly turned on.
  return process.env.ASK_ENABLED === "true";
}

export function takeSlot(visitor: string): "ok" | "visitor_limit" | "daily_limit" {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  if (day.count >= PER_DAY) return "daily_limit";

  const times = (recent.get(visitor) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_VISITOR) return "visitor_limit";
  times.push(now);
  recent.set(visitor, times);
  day.count++;

  // Keep the map small.
  if (recent.size > 5000) for (const [k, v] of recent) if (v.every((t) => now - t >= WINDOW_MS)) recent.delete(k);
  return "ok";
}
