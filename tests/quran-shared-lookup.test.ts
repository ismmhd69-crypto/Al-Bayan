import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

// Reliability plan Phase 1: verse lookups must not fail together.
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("QURAN_FOUNDATION_CLIENT_ID", "fake"); vi.stubEnv("QURAN_FOUNDATION_CLIENT_SECRET", "fake");
  vi.stubEnv("QURAN_API_ENV", "production"); vi.stubEnv("QURAN_CHAPTERS", ""); vi.stubEnv("ASK_LOCAL_TRACE", "false");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const verse = (key: string) => ({ verse: { verse_key: key, text_uthmani: "نص", text_imlaei_simple: "نص", translations: [] } });

it("one visitor's Stop does not cancel another visitor's shared lookup of the same verse", async () => {
  let release!: () => void; const gate = new Promise<void>(r => { release = r; });
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    await gate; init?.signal?.throwIfAborted();
    return Response.json(verse("2:255"));
  }));
  const { getVerse } = await import("@/lib/sources/quran"), { withResearchCancellation } = await import("@/lib/ask/research-runtime");
  const first = new AbortController(), second = new AbortController();
  const a = withResearchCancellation(first.signal, () => getVerse("2:255")).catch(e => e);
  const b = withResearchCancellation(second.signal, () => getVerse("2:255"));
  first.abort(new Error("answer_stopped"));
  release();
  expect(await a).toMatchObject({ message: "answer_stopped" });
  expect((await b)?.key).toBe("2:255");
  expect((fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.filter(c => String(c[0]).includes("by_key")).length).toBe(1);
});

it("cancels the shared request once every waiting visitor has stopped", async () => {
  const seen: AbortSignal[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    seen.push(init!.signal!); return new Promise<Response>(() => {});
  }));
  const { getVerse } = await import("@/lib/sources/quran"), { withResearchCancellation } = await import("@/lib/ask/research-runtime");
  const first = new AbortController(), second = new AbortController();
  const a = withResearchCancellation(first.signal, () => getVerse("2:255")).catch(() => {});
  const b = withResearchCancellation(second.signal, () => getVerse("2:255")).catch(() => {});
  await vi.waitFor(() => expect(seen).toHaveLength(1));
  first.abort(new Error("stop")); expect(seen[0].aborted).toBe(false);
  second.abort(new Error("stop")); expect(seen[0].aborted).toBe(true);
  await Promise.all([a, b]);
});

it("retries a failed neighbour once, so one transient failure does not drop the verse", async () => {
  let failures = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    const key = /by_key\/([\d:]+)/.exec(url)![1];
    if (key === "2:256" && failures++ === 0) return new Response("busy", { status: 503 });
    return Response.json(verse(key));
  }));
  const { neighbours } = await import("@/lib/sources/quran");
  expect((await neighbours("2:255")).map(v => v.key)).toEqual(["2:254", "2:256"]);
  expect(failures).toBe(2);
});

it("still rejects when a neighbour fails twice: Quran context is never guessed", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("oauth2/token")) return Response.json({ access_token: "fake-token", expires_in: 3600 });
    return url.includes("2:256") ? new Response("busy", { status: 503 }) : Response.json(verse(/by_key\/([\d:]+)/.exec(url)![1]));
  }));
  const { neighbours } = await import("@/lib/sources/quran");
  await expect(neighbours("2:255")).rejects.toThrow();
});
