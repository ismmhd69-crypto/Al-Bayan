import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/chat/hydrate", () => ({ hydrateAnswer: vi.fn() }));
import { handleSavedHydrate, savedHydrateAllowed } from "@/lib/saved/hydrate-route";

const request = (body: string, headers: Record<string, string> = {}) => new Request("https://askbayan.org/api/saved/hydrate", {
  method: "POST", body, headers: { "content-type": "application/json", origin: "https://askbayan.org", host: "askbayan.org", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
});

describe("opening a saved answer", () => {
  it("refuses requests from other websites", async () => {
    const hydrate = vi.fn();
    const res = await handleSavedHydrate(request(JSON.stringify({ answer: {} }), { origin: "https://evil.example" }), { hydrate });
    expect(res.status).toBe(403);
    expect(hydrate).not.toHaveBeenCalled();
  });
  it("refuses oversized and malformed bodies", async () => {
    const hydrate = vi.fn();
    expect((await handleSavedHydrate(request("x".repeat(300_001)), { hydrate })).status).toBe(413);
    expect((await handleSavedHydrate(request("{"), { hydrate })).status).toBe(400);
    expect((await handleSavedHydrate(request(JSON.stringify({ answer: {}, extra: 1 })), { hydrate })).status).toBe(400);
    expect(hydrate).not.toHaveBeenCalled();
  });
  it("returns nothing for an answer that fails validation", async () => {
    const res = await handleSavedHydrate(request(JSON.stringify({ answer: { version: 4 } })), { hydrate: async () => ({ ok: false, reason: "shape" }) });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ status: "unavailable" });
  });
  it("returns the reloaded answer", async () => {
    const res = await handleSavedHydrate(request(JSON.stringify({ answer: { version: 4 } })), { hydrate: async () => ({ ok: true, answer: { version: 4 } as never }) });
    expect(res.status).toBe(200);
    expect((await res.json()).answer).toEqual({ version: 4 });
  });
  it("limits each visitor to 20 openings per 10 minutes", () => {
    const now = 1_000_000;
    for (let i = 0; i < 20; i++) expect(savedHydrateAllowed("visitor-x", now + i)).toBe(true);
    expect(savedHydrateAllowed("visitor-x", now + 21)).toBe(false);
    expect(savedHydrateAllowed("visitor-x", now + 10 * 60 * 1000 + 30)).toBe(true);
  });
});
