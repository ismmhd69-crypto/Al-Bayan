// Request limits for a hosted model: a per-minute window (NVIDIA's free endpoint allows about 40
// requests a minute per model) and a daily cap so free credits are not burned. Pure and in memory,
// so each server instance counts on its own. Never stores anything about the request itself.

export type RateLimiter = {
  /** Takes a slot now, or returns false when the minute window or the daily cap is full. */
  take(model: string, now?: number): boolean;
};

const MINUTE_MS = 60_000;

export function createRateLimiter(perMinute: number, perDay: number): RateLimiter {
  const recent = new Map<string, number[]>();
  const daily = new Map<string, { day: string; count: number }>();
  return {
    take(model, now = Date.now()) {
      const day = new Date(now).toISOString().slice(0, 10); // UTC day
      const today = daily.get(model);
      const count = today?.day === day ? today.count : 0;
      if (count >= perDay) return false;
      const window = (recent.get(model) ?? []).filter((t) => now - t < MINUTE_MS);
      if (window.length >= perMinute) {
        recent.set(model, window);
        return false;
      }
      window.push(now);
      recent.set(model, window);
      daily.set(model, { day, count: count + 1 });
      return true;
    },
  };
}

/** Waits up to maxWaitMs (in short steps) for a slot; false if none came free or the call was cancelled. */
export async function waitForSlot(limiter: RateLimiter, model: string, maxWaitMs: number, signal?: AbortSignal): Promise<boolean> {
  const until = Date.now() + maxWaitMs;
  for (;;) {
    if (signal?.aborted) return false;
    if (limiter.take(model)) return true;
    if (Date.now() >= until) return false;
    await new Promise((r) => setTimeout(r, Math.min(250, Math.max(0, until - Date.now()))));
  }
}

const positive = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const nvidiaLimiter = createRateLimiter(
  positive(process.env.NVIDIA_RPM, 35),
  positive(process.env.NVIDIA_DAILY_LIMIT, 1000),
);
