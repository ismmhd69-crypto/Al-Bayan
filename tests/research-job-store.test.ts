import { describe, expect, it, vi } from "vitest";
import { researchJobStore, ResearchStorageError, type ResearchRpc } from "@/lib/ask/search-engine/job-store";
import { researchJobEncryption } from "@/lib/ask/search-engine/job-encryption";
import { ModelReconciliationRequired } from "@/lib/ask/search-engine/transport-journal";

const id = "00000000-0000-4000-8000-000000000001", leaseId = "00000000-0000-4000-8000-000000000002";
const codec = researchJobEncryption("test", Buffer.alloc(32, 9).toString("base64"));
const owner = "a".repeat(64), key = `${"b".repeat(64)}:1`;
const expires = "2026-10-21T00:00:00Z";
const lease = { id, lease: leaseId, sequence: 0, request: {}, expiresAt: expires };
const storedView = (extra: Record<string, unknown> = {}) => ({ status: "ok", id, state: "running", language: "en", sequence: 0, events: [], expires_at: expires, ...extra });

describe("encrypted research job repository", () => {
  it("never sends a plaintext question to the storage RPC", async () => {
    const rpc = vi.fn<ResearchRpc>(async () => storedView({ state: "queued" })), store = researchJobStore(rpc, codec);
    const request = { question: "private question", lang: "en" };
    await store.enqueue({ id, owner, rate: "c".repeat(64), dedupe: "d".repeat(64), requestHash: "e".repeat(64), request, maxCostUsd: 0.2 });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("private question");
    expect(codec.open(id, "request", rpc.mock.calls[0][1].request_cipher as ReturnType<typeof codec.seal>)).toEqual(request);
  });
  it("does not confuse a missing owned job with an empty answer", async () => {
    const store = researchJobStore(async () => ({ status: "not_found" }), codec);
    await expect(store.read(id, owner)).rejects.toMatchObject({ code: "not_found" });
  });
  it("rejects another job's event ciphertext and skipped event sequences", async () => {
    const wrongCipher = codec.seal(leaseId, "event:1", { type: "section" });
    const store = researchJobStore(async () => storedView({ sequence: 1, events: [{ sequence: 1, payload_cipher: wrongCipher }] }), codec);
    await expect(store.read(id, owner)).rejects.toThrow();
    const skipped = researchJobStore(async () => storedView({ sequence: 2, events: [{ sequence: 2, payload_cipher: codec.seal(id, "event:2", {}) }] }), codec);
    await expect(skipped.read(id, owner)).rejects.toThrow("invalid_research_event_order");
  });
  it("rejects a truncated replay rather than declaring it up to date", async () => {
    const store = researchJobStore(async () => storedView({ sequence: 1 }), codec);
    await expect(store.read(id, owner)).rejects.toThrow("incomplete_research_event_history");
  });
  it("decrypts a claimed request only for its bound job", async () => {
    const request = { question: "synthetic", lang: "ar" };
    const store = researchJobStore(async () => ({ status: "ok", id, lease: leaseId, sequence: 0, request_cipher: codec.seal(id, "request", request), expires_at: expires }), codec);
    expect(await store.claim()).toMatchObject({ id, lease: leaseId, request });
  });
  it("binds an appended event to its compare-and-swap sequence", async () => {
    const rpc = vi.fn<ResearchRpc>(async () => ({ status: "ok", sequence: 3 })), store = researchJobStore(rpc, codec);
    const event = { type: "progress", stage: "searching" };
    expect(await store.append(lease, 2, event)).toBe(3);
    expect(rpc.mock.calls[0][1]).toMatchObject({ expected_sequence: 2, lease: leaseId });
    expect(codec.open(id, "event:3", rpc.mock.calls[0][1].payload_cipher as ReturnType<typeof codec.seal>)).toEqual(event);
    expect(() => codec.open(id, "event:2", rpc.mock.calls[0][1].payload_cipher as ReturnType<typeof codec.seal>)).toThrow();
  });
  it("propagates lost leases and reconciliation instead of retryable model errors", async () => {
    const gone = researchJobStore(async () => ({ status: "lease_lost" }), codec);
    await expect(gone.pulse(lease)).rejects.toBeInstanceOf(ResearchStorageError);
    const held = researchJobStore(async () => ({ status: "reconciliation_required" }), codec);
    await expect(held.attempts(lease, 0.05).record(key, { status: 200, body: "{}", contentType: "application/json" }, null)).rejects.toBeInstanceOf(ModelReconciliationRequired);
  });
  it("rejects malformed settled receipts and invalid ownership before an RPC", async () => {
    const cipher = codec.seal(id, `model:${key}`, { status: 200, body: "{}", contentType: "application/json" });
    const rpc = vi.fn<ResearchRpc>(async () => ({ status: "ok", acquired: false, state: "settled", response_cipher: cipher, cost_usd: null }));
    const store = researchJobStore(rpc, codec);
    await expect(store.attempts(lease, 0.05).reserve(key)).rejects.toThrow("invalid_recorded_model_cost");
    rpc.mockClear();
    await expect(store.read(id, "not-a-hash")).rejects.toThrow("invalid_research_owner");
    expect(rpc).not.toHaveBeenCalled();
  });
});
