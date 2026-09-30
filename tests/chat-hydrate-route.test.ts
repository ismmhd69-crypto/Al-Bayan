// The route that opens saved chats: signed-in only, same-origin, strict body. No network.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/sources/quran", () => ({ getVerse: vi.fn(), ATTRIBUTION: { text: "q", url: "https://quran.foundation" } }));
vi.mock("@/lib/sources/hadith", () => ({ getHadith: vi.fn(), HADITH_ATTRIBUTION: { text: "h", url: "https://hadeethenc.com" } }));

const { handleHydrate, hydrateAllowed } = await import("@/app/api/chats/hydrate/route");

const TOKEN = "a".repeat(40);
const deps = (ok = true) => ({
  verifyUser: vi.fn(async (t: string) => ok && t === TOKEN),
  hydrate: vi.fn(async (a: unknown) => (a === "bad" ? { ok: false as const, reason: "shape" } : { ok: true as const, answer: a as never })),
});
const request = (body: unknown, extra: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/chats/hydrate", {
    method: "POST",
    headers: { origin: "http://localhost:3000", "content-type": "application/json", authorization: `Bearer ${TOKEN}`, ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const status = async (r: Response) => ({ code: r.status, body: await r.json() });

describe("handleHydrate", () => {
  it("returns one result per stored answer, in order", async () => {
    const d = deps();
    const out = await status(await handleHydrate(request({ answers: ["one", "bad", "three"] }, { "x-forwarded-for": "1.1.1.1" }), d));
    expect(out.code).toBe(200);
    expect(out.body.results.map((r: { ok: boolean }) => r.ok)).toEqual([true, false, true]);
    expect(d.hydrate).toHaveBeenCalledTimes(3);
  });

  it("only serves signed-in people from this site", async () => {
    const d = deps();
    expect((await status(await handleHydrate(request({ answers: ["x"] }, { origin: "https://evil.example" }), d))).code).toBe(403);
    expect((await status(await handleHydrate(request({ answers: ["x"] }, { authorization: "" }), d))).code).toBe(401);
    expect((await status(await handleHydrate(request({ answers: ["x"] }, { authorization: `Bearer ${"b".repeat(40)}` }), d))).code).toBe(401);
    expect((await status(await handleHydrate(request({ answers: ["x"] }), deps(false)))).code).toBe(401);
    expect((await status(await handleHydrate(request({ answers: ["x"] }, { "content-type": "text/plain" }), d))).code).toBe(415);
    expect(d.hydrate).not.toHaveBeenCalled();
  });

  it("refuses odd bodies: not JSON, extra fields, empty, or more than 50 answers", async () => {
    const d = deps();
    const ip = { "x-forwarded-for": "2.2.2.2" };
    expect((await status(await handleHydrate(request("not json", ip), d))).code).toBe(400);
    expect((await status(await handleHydrate(request({ answers: ["x"], extra: 1 }, ip), d))).code).toBe(400);
    expect((await status(await handleHydrate(request({ answers: [] }, ip), d))).code).toBe(400);
    expect((await status(await handleHydrate(request({ answers: Array(51).fill("x") }, ip), d))).code).toBe(400);
    expect((await status(await handleHydrate(request([1], ip), d))).code).toBe(400);
  });

  it("limits how often one visitor can open chats", () => {
    const now = 1_000_000;
    for (let i = 0; i < 40; i++) expect(hydrateAllowed("visitor-a", now + i)).toBe(true);
    expect(hydrateAllowed("visitor-a", now + 50)).toBe(false);
    expect(hydrateAllowed("visitor-b", now + 50)).toBe(true);
    expect(hydrateAllowed("visitor-a", now + 11 * 60 * 1000)).toBe(true);
  });
});
