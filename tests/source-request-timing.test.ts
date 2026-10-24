import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { askTimeout, sourceRequestTimeout } from "@/lib/ask/timing";
import { withResearchRuntime } from "@/lib/ask/research-runtime";
import { askDeadlineMs } from "@/lib/ask/settings";

beforeEach(() => {
  vi.resetModules();
  delete (globalThis as any).__bayanHadithCatalogues;
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", "");
  vi.stubEnv("ASK_LOCAL_UNHURRIED", "true"); vi.stubEnv("ASK_LOCAL_TRACE", "false");
  vi.useFakeTimers();
  // Node's native AbortSignal timer is independent of fake timers. This adapter
  // lets us advance the unchanged requested duration without real network waits.
  vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => {
    const stop = new AbortController();
    setTimeout(() => stop.abort(new DOMException("Source request timed out", "TimeoutError")), ms);
    return stop.signal;
  });
});
afterEach(() => {
  vi.doUnmock("@/lib/ask/timing"); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers();
});

it("keeps an unhurried answer alive while bounding one source connection", async () => {
  const owner = new AbortController(), wholeAnswer = askTimeout(owner.signal, 5, "pipeline");
  const connection = sourceRequestTimeout(owner.signal, 10_000, "hadith_transport");
  expect(askDeadlineMs()).toBe(Infinity);
  await vi.advanceTimersByTimeAsync(10_001);
  expect(connection.aborted).toBe(true); expect(connection.reason.name).toBe("TimeoutError");
  expect(wholeAnswer.aborted).toBe(false); expect(owner.signal.aborted).toBe(false);
});

it("does not turn an unlimited leased job into unlimited source connections", async () => {
  const owner = new AbortController();
  const request = withResearchRuntime(Infinity, () => sourceRequestTimeout(owner.signal, 10_000, "quran_transport"));
  await vi.advanceTimersByTimeAsync(10_001);
  expect(request.aborted).toBe(true); expect(owner.signal.aborted).toBe(false);
  expect(withResearchRuntime(Infinity, () => askDeadlineMs())).toBe(Infinity);
});

it("still observes a finite worker remainder and owner cancellation", async () => {
  const request = withResearchRuntime(1000, () => sourceRequestTimeout(undefined, 10_000, "scholar_transport"));
  await vi.advanceTimersByTimeAsync(1001); expect(request.aborted).toBe(true);
  const owner = new AbortController(), other = sourceRequestTimeout(owner.signal, 10_000, "hadith_transport");
  owner.abort(new DOMException("Visitor stopped", "AbortError"));
  expect(other.aborted).toBe(true); expect(other.reason.name).toBe("AbortError");
});

it.each([true, false])("reproduces the hadith source wait and repairs its failure classification (legacy waiting: %s)", async legacy => {
  vi.doMock("@/lib/ask/timing", async importOriginal => {
    const actual = await importOriginal<typeof import("@/lib/ask/timing")>();
    return { ...actual, runSourceRequest: legacy
      ? <T>(parent: AbortSignal | undefined, ms: number, stage: string, work: (signal: AbortSignal) => Promise<T>) => work(actual.askTimeout(parent, ms, stage))
      : actual.runSourceRequest };
  });
  const cleanup: (() => void)[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/categories/roots/")) return Response.json([{ id: "1" }]);
    if (u.pathname.endsWith("/hadeeths/list/")) return Response.json({ data: [{ id: "9876", title: "حقوق الناس" }], meta: { last_page: 1 } });
    if (u.searchParams.get("language") !== "ar") return Response.json({ id: "9876", hadeeth: "Invented display text" });
    // A stalled Arabic detail response must reject as a source failure, never
    // resolve as an empty successful evidence search.
    return new Promise<Response>((_, reject) => {
      const signal = init.signal!;
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      cleanup.push(() => reject(new DOMException("Test cleanup", "AbortError")));
    });
  }));
  const { searchHadithMulti } = await import("@/lib/sources/hadith");
  const failure = vi.fn();
  let state = "pending", reason: unknown;
  const job = searchHadithMulti({ ar: ["حقوق الناس"] }, 4, failure).then(
    () => { state = "resolved"; }, error => { state = "rejected"; reason = error; });
  try {
    await vi.advanceTimersByTimeAsync(10_001);
    expect(state).toBe(legacy ? "pending" : "rejected");
    if (!legacy) { expect(reason).toMatchObject({ name: "TimeoutError" }); expect(failure).toHaveBeenCalled(); }
  } finally { cleanup.forEach(close => close()); await job; }
});

it.each(["headers", "body"])("bounds the actual hadith reader when %s consumption ignores cancellation", async stalledPart => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/categories/roots/")) return Response.json([{ id: "1" }]);
    if (u.pathname.endsWith("/hadeeths/list/")) return Response.json({ data: [{ id: "9876", title: "حقوق الناس" }], meta: { last_page: 1 } });
    if (u.searchParams.get("language") !== "ar") return Response.json({ id: "9876", hadeeth: "Invented display text" });
    if (stalledPart === "headers") return new Promise<Response>(() => {});
    return { ok: true, json: () => new Promise(() => {}) } as unknown as Response;
  }));
  const { searchHadithMulti } = await import("@/lib/sources/hadith"), failure = vi.fn();
  const result = searchHadithMulti({ ar: ["حقوق الناس"] }, 4, failure).catch(error => error);
  await vi.advanceTimersByTimeAsync(10_001);
  expect(await result).toMatchObject({ name: "TimeoutError" });
  expect(failure).toHaveBeenCalled();
});
