import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getMappedScholarQuote } from "@/lib/sources/scholars-live";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it("keeps owner cancellation on the bounded local scholar connection", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true");
  vi.useFakeTimers();
  const stop = new AbortController(); let received: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    received = init.signal;
    return new Promise((_resolve, reject) => received!.addEventListener("abort", () => reject(received!.reason), { once: true }));
  }));
  const pending = getMappedScholarQuote("https://binbaz.org.sa/fatwas/999999/unhurried-fixture", stop.signal);
  const cancelled = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(100);
  expect(received!.aborted).toBe(false);
  stop.abort(); await cancelled;
});
