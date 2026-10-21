import { describe, expect, it, vi } from "vitest";
import { buildAccountExport } from "@/lib/chat/account-export";
describe("account download identity", () => {
  const original = { user: { id: "account-a" }, access_token: "never-export-token-a" };
  const deps = () => ({ session: vi.fn(async () => original), userFor: vi.fn(async () => ({ id: "account-a", email: "a@fixture.invalid", user_metadata: { consent_lang: "en", unrelated_secret: "never-export" } })),
    chats: vi.fn(async () => ({ exported_at: "2026-10-21T00:00:00Z", chats: [] })), research: vi.fn(async () => ({ status: "included", jobs: [] })) });
  it("pins both reads and excludes credentials and unrelated metadata", async () => {
    const d = deps(), file = await buildAccountExport(d);
    expect(d.chats).toHaveBeenCalledWith(original.access_token); expect(d.research).toHaveBeenCalledWith(original.access_token);
    expect(file.account.email).toBe("a@fixture.invalid"); expect(JSON.stringify(file)).not.toContain("never-export");
  });
  it("does not release a download if the active account changes while reads finish", async () => {
    const d = deps(); d.session.mockResolvedValueOnce(original).mockResolvedValueOnce({ user: { id: "account-b" }, access_token: "token-b" });
    await expect(buildAccountExport(d)).rejects.toThrow("account_changed");
  });
  it("does not read data using an unverified session", async () => {
    const d = deps(); d.userFor.mockResolvedValueOnce({ id: "account-b", email: "b@fixture.invalid", user_metadata: { consent_lang: "en", unrelated_secret: "" } });
    await expect(buildAccountExport(d)).rejects.toThrow("account_changed"); expect(d.chats).not.toHaveBeenCalled(); expect(d.research).not.toHaveBeenCalled();
  });
});
