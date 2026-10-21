import { describe, expect, it, vi } from "vitest";
import { handleAccountResearchExport } from "@/lib/ask/search-engine/account-export-api";
import { exportResearchRequests } from "@/lib/chat/research-export";
import { researchJobEncryption } from "@/lib/ask/search-engine/job-encryption";
import { researchJobStore } from "@/lib/ask/search-engine/job-store";
const account = "00000000-0000-4000-8000-000000000001", id = "00000000-0000-4000-8000-000000000002", second = "00000000-0000-4000-8000-000000000003";
const token = "invented-".repeat(5), snapshot = "2026-10-20T20:00:00.000Z";
const job = (key = id) => ({ id: key, state: "running" as const, language: "en" as const, question: "My invented question", previousUserMessages: [], createdAt: snapshot, expiresAt: "2026-10-21T20:00:00.000Z" });
const request = (body: unknown = {}, headers: Record<string, string> = {}, signal?: AbortSignal) => new Request("http://localhost:3000/api/account/research/export", {
  method: "POST", headers: { origin: "http://localhost:3000", authorization: `Bearer ${token}`, "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal,
});
describe("verified-account temporary research export", () => {
  it("uses only the verified account and returns private, uncached pages", async () => {
    const exportPage = vi.fn(async () => ({ asOf: snapshot, next: null, jobs: [job()] }));
    const response = await handleAccountResearchExport(request(), { enabled: true, verifyUser: async () => account, exportPage });
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
    expect(exportPage).toHaveBeenCalledWith(account, undefined, undefined);
    expect(await response.json()).toMatchObject({ status: "export", scope: "account_retained_user_requests", jobs: [{ question: "My invented question" }] });
  });
  it("rejects foreign origin, missing session, account overrides and oversized input before reading records", async () => {
    const exportPage = vi.fn(), deps = { enabled: true, verifyUser: async () => account, exportPage };
    expect((await handleAccountResearchExport(request({}, { origin: "https://other.invalid" }), deps)).status).toBe(403);
    expect((await handleAccountResearchExport(request({}, { authorization: "" }), deps)).status).toBe(401);
    expect((await handleAccountResearchExport(request({ account_id: account }), deps)).status).toBe(400);
    expect((await handleAccountResearchExport(request({ after: "x".repeat(600) }), deps)).status).toBe(413);
    expect(exportPage).not.toHaveBeenCalled();
  });
  it("distinguishes disabled storage from an unavailable export and stops on cancellation", async () => {
    const exportPage = vi.fn(async () => { throw new Error("database error with private text"); });
    const deps = { enabled: false, verifyUser: async () => account, exportPage };
    expect(await (await handleAccountResearchExport(request(), deps)).json()).toMatchObject({ status: "not_enabled" });
    expect(exportPage).not.toHaveBeenCalled();
    expect((await handleAccountResearchExport(request(), { ...deps, enabled: true })).status).toBe(503);
    const stop = new AbortController(); stop.abort();
    expect((await handleAccountResearchExport(request({}, {}, stop.signal), { ...deps, enabled: true })).status).toBe(503);
  });
});
describe("account export envelope and browser pagination", () => {
  it("pins the same bearer and cutoff across all pages and exports no model drafts", async () => {
    const send = vi.fn(async (_url: string, init: RequestInit) => {
      expect(new Headers(init.headers).get("authorization")).toBe(`Bearer ${token}`);
      const body = JSON.parse(init.body as string);
      return Response.json({ version: 1, status: "export", scope: "account_retained_user_requests", asOf: snapshot,
        next: body.after ? null : id, jobs: [{ ...job(body.after ? second : id), uncheckedModelDraft: "must not export" }] });
    });
    const result = await exportResearchRequests(token, send);
    expect(result.status).toBe("included"); expect(result.jobs).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain("must not export");
    expect(JSON.parse(send.mock.calls[1][1].body as string)).toEqual({ after: id, asOf: snapshot });
  });
  it("does not claim completion after duplicate pages, failed reads or a changed cutoff", async () => {
    const repeated = vi.fn(async () => Response.json({ version: 1, status: "export", scope: "account_retained_user_requests", asOf: snapshot, next: id, jobs: [job()] }));
    await expect(exportResearchRequests(token, repeated)).rejects.toThrow("invalid_research_export");
    await expect(exportResearchRequests(token, async () => new Response("private error", { status: 503 }))).rejects.toThrow("research_export_unavailable");
    let n = 0;
    await expect(exportResearchRequests(token, async () => Response.json({ version: 1, status: "export", scope: "account_retained_user_requests", asOf: n++ ? "2026-10-20T20:00:01.000Z" : snapshot, next: id, jobs: [job()] }))).rejects.toThrow("invalid_research_export");
  });
  it("decrypts only scoped user inputs and refuses account-aware enqueue on an older storage contract", async () => {
    const codec = researchJobEncryption("fixture", Buffer.alloc(32, 7).toString("base64"));
    const input = { version: 1, question: "My invented question", lang: "en", previous_user_messages: [], engineRevision: "private-build" };
    const rpc = vi.fn(async () => ({ status: "ok", as_of: snapshot, next: null, jobs: [{ id, state: "running", language: "en", created_at: snapshot, expires_at: snapshot, request_cipher: codec.seal(id, "request", input), draft: "not for export" }] }));
    const store = researchJobStore(rpc, codec), result = await store.exportAccount(account);
    expect(result.jobs[0].question).toBe(input.question); expect(JSON.stringify(result)).not.toContain("private-build");
    expect(rpc).toHaveBeenCalledWith("account_export", { account_id: account });
    const oldRpc = vi.fn(async (_operation: string, _payload: Record<string, unknown>) => ({ status: "ok" }));
    await expect(researchJobStore(oldRpc, codec).enqueue({ id, owner: "a".repeat(64), rate: "b".repeat(64), dedupe: "c".repeat(64), requestHash: "d".repeat(64), request: input, maxCostUsd: 0.1, accountId: account })).rejects.toThrow("research_account_lifecycle_unavailable");
    expect(oldRpc.mock.calls.map(row => row[0])).toEqual(["account_ready"]);
  });
});
