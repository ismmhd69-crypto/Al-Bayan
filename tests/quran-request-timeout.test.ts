import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers();
  vi.stubEnv("QURAN_FOUNDATION_CLIENT_ID", "fake"); vi.stubEnv("QURAN_FOUNDATION_CLIENT_SECRET", "fake");
  vi.stubEnv("QURAN_API_ENV", "production"); vi.stubEnv("QURAN_CHAPTERS", ""); vi.stubEnv("ASK_LOCAL_TRACE", "false");
  vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => {
    const stop = new AbortController(); setTimeout(() => stop.abort(new DOMException("Timed out", "TimeoutError")), ms); return stop.signal;
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it.each(["auth_headers", "auth_body", "search_headers", "search_body", "content_headers", "content_body"])("settles a Quran operation when %s ignores cancellation", async stage => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const kind = url.includes("oauth2/token") ? "auth" : url.includes("/verses/by_key/") ? "content" : "search";
    if (stage === `${kind}_headers`) return new Promise<Response>(() => {});
    if (stage === `${kind}_body`) return { ok: true, status: 200, json: () => new Promise(() => {}) } as Response;
    return Response.json(kind === "auth" ? { access_token: "fake-token", expires_in: 3600 } : { result: { verses: [{ key: "2:183" }] } });
  }));
  const { searchQuran, getVerse } = await import("@/lib/sources/quran");
  const outcome = (stage.startsWith("content") ? getVerse("2:183") : searchQuran(["test"], 4)).catch(e => e);
  await vi.advanceTimersByTimeAsync(10_001);
  expect(await outcome).toMatchObject({ name: "TimeoutError" });
});

it("retains successful query results when another response body never settles", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    if (url.includes("stalled")) return { ok: true, json: () => new Promise(() => {}) } as Response;
    return Response.json({ result: { verses: [{ key: "2:183" }] } });
  }));
  const { searchQuran } = await import("@/lib/sources/quran"), failure = vi.fn();
  const result = searchQuran(["working", "stalled"], 4, undefined, failure);
  await vi.advanceTimersByTimeAsync(10_001);
  expect(await result).toEqual(["2:183"]); expect(failure).toHaveBeenCalledWith("timeout");
});

it("does not cache a late authentication response or dispatch a search after its deadline", async () => {
  let late!: (value: unknown) => void, authCalls = 0;
  const fetcher = vi.fn(async (url: string) => {
    if (url.includes("oauth2/token")) {
      authCalls++;
      return authCalls === 1 ? { ok: true, json: () => new Promise(resolve => { late = resolve; }) } as Response
        : Response.json({ access_token: "fresh-token", expires_in: 3600 });
    }
    return Response.json({ result: { verses: [{ key: "2:183" }] } });
  });
  vi.stubGlobal("fetch", fetcher);
  const { searchQuran } = await import("@/lib/sources/quran");
  const first = searchQuran(["old"], 4).catch(e => e);
  await vi.advanceTimersByTimeAsync(10_001); expect(await first).toMatchObject({ name: "TimeoutError" });
  late({ access_token: "expired-late-token", expires_in: 3600 });
  await vi.advanceTimersByTimeAsync(0); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(await searchQuran(["new"], 4)).toEqual(["2:183"]); expect(authCalls).toBe(2);
});

it("releases content slots and shared promises after a stalled cached transport", async () => {
  let recover = false;
  const fetcher = vi.fn(async (url: string) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    return recover ? new Response(null, { status: 404 }) : new Promise<Response>(() => {});
  });
  vi.stubGlobal("fetch", fetcher);
  const { getVerse } = await import("@/lib/sources/quran");
  const first = getVerse("2:1"); expect(getVerse("2:1")).toBe(first);
  const results = Promise.allSettled([first, ...Array.from({ length: 13 }, (_, i) => getVerse(`2:${i + 2}`))]);
  await vi.advanceTimersByTimeAsync(30_001);
  expect((await results).every(r => r.status === "rejected" && r.reason.name === "TimeoutError")).toBe(true);
  recover = true; expect(await getVerse("2:1")).toBeUndefined();
  expect(fetcher.mock.calls.filter(([url]) => url.includes("/verses/by_key/"))).toHaveLength(15);
});

it("observes visitor cancellation during shared authentication without dispatching late query work", async () => {
  let tokenReady!: (value: unknown) => void;
  const fetcher = vi.fn(async () => ({ ok: true, json: () => new Promise(resolve => { tokenReady = resolve; }) } as Response));
  vi.stubGlobal("fetch", fetcher);
  const { searchQuran } = await import("@/lib/sources/quran"), owner = new AbortController();
  const result = searchQuran(["test"], 4, owner.signal).catch(e => e);
  await vi.advanceTimersByTimeAsync(0); owner.abort(new DOMException("Stopped", "AbortError"));
  expect(await result).toMatchObject({ name: "AbortError" });
  tokenReady({ access_token: "shared-token", expires_in: 3600 });
  await vi.advanceTimersByTimeAsync(0); expect(fetcher).toHaveBeenCalledTimes(1);
});
