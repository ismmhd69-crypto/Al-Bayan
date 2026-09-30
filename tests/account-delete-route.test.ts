// The route that deletes an account: same-origin, own token only, limited. No network.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { handleDelete, deleteAllowed } = await import("@/app/api/account/delete/route");

const TOKEN = "t".repeat(40);
const deps = (id: string | null = "user-1", deleted = true) => ({
  userIdFor: vi.fn(async (t: string) => (t === TOKEN ? id : null)),
  deleteUser: vi.fn(async () => deleted),
});
const request = (extra: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/account/delete", {
    method: "POST",
    headers: { origin: "http://localhost:3000", authorization: `Bearer ${TOKEN}`, ...extra },
  });
const code = async (r: Response) => ({ code: r.status, body: await r.json() });

describe("handleDelete", () => {
  it("deletes only the person who proved who they are", async () => {
    const d = deps("user-42");
    const out = await code(await handleDelete(request({ "x-forwarded-for": "9.9.9.1" }), d));
    expect(out).toEqual({ code: 200, body: { status: "deleted" } });
    expect(d.deleteUser).toHaveBeenCalledWith("user-42");
  });

  it("refuses other sites, missing or wrong tokens, without deleting anything", async () => {
    const d = deps();
    expect((await code(await handleDelete(request({ origin: "https://evil.example" }), d))).code).toBe(403);
    expect((await code(await handleDelete(request({ authorization: "" }), d))).code).toBe(401);
    expect((await code(await handleDelete(request({ authorization: `Bearer ${"x".repeat(40)}`, "x-forwarded-for": "9.9.9.2" }), d))).code).toBe(401);
    expect((await code(await handleDelete(request({ "x-forwarded-for": "9.9.9.3" }), deps(null)))).code).toBe(401);
    expect(d.deleteUser).not.toHaveBeenCalled();
  });

  it("reports a failed delete as an error", async () => {
    expect((await code(await handleDelete(request({ "x-forwarded-for": "9.9.9.4" }), deps("user-1", false)))).code).toBe(502);
  });

  it("limits repeated attempts", () => {
    const now = 5_000_000;
    for (let i = 0; i < 5; i++) expect(deleteAllowed("v", now + i)).toBe(true);
    expect(deleteAllowed("v", now + 10)).toBe(false);
    expect(deleteAllowed("v", now + 61 * 60 * 1000)).toBe(true);
  });
});
