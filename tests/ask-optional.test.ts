import { afterEach, describe, expect, it, vi } from "vitest";
import { optionalWithin } from "@/lib/ask/optional";
afterEach(() => vi.useRealTimers());
describe("optional content deadline", () => {
  it("returns the fallback even if optional work ignores cancellation", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const result = optionalWithin((s) => { signal = s; return new Promise<string>(() => {}); }, 100, new AbortController().signal, "checked answer");
    await vi.advanceTimersByTimeAsync(100);
    expect(await result).toBe("checked answer");
    expect(signal?.aborted).toBe(true);
  });
  it("returns promptly on parent cancellation and optional errors", async () => {
    const controller = new AbortController();
    const result = optionalWithin(() => new Promise<string>(() => {}), 10_000, controller.signal, "answer");
    controller.abort();
    expect(await result).toBe("answer");
    expect(await optionalWithin(async () => { throw new Error("video error"); }, 100, new AbortController().signal, "answer")).toBe("answer");
  });
  it("does not start optional work without remaining time", async () => {
    const work = vi.fn();
    expect(await optionalWithin(work, 0, new AbortController().signal, [])).toEqual([]);
    expect(work).not.toHaveBeenCalled();
  });
});
