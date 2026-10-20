import { describe, expect, it, vi } from "vitest";
import { modelFetch, withModelTransport } from "@/lib/ai/transport";
import { journalledModelTransport, ModelReconciliationRequired, type ModelAttempt, type ModelAttemptStore } from "@/lib/ask/search-engine/transport-journal";
import { researchJobEncryption } from "@/lib/ask/search-engine/job-encryption";

const url = "https://openrouter.ai/api/v1/chat/completions";
const request = { method: "POST", body: JSON.stringify({ model: "test", messages: [{ content: "private question" }] }), headers: { Authorization: "Bearer secret" } };
const answer = (cost: unknown = 0.01) => new Response(JSON.stringify({ id: "gen-receipt", choices: [{ message: { content: "checked response" } }], usage: { cost } }), { headers: { "content-type": "application/json", "set-cookie": "secret" } });
function memoryStore() {
  const records = new Map<string, ModelAttempt>();
  const store: ModelAttemptStore = {
    async startRun() {
      for (const [key, attempt] of records) {
        if (attempt.state !== "settled") throw new ModelReconciliationRequired(key);
      }
    },
    async reserve(key) {
      const attempt = records.get(key);
      if (attempt) return { acquired: false, attempt };
      records.set(key, { state: "reserved" });
      return { acquired: true };
    },
    async record(key, response, costUsd) {
      if (records.get(key)?.state !== "reserved") throw new Error("not_reserved");
      records.set(key, costUsd === null ? { state: "unsettled", response } : { state: "settled", response, costUsd });
    },
  };
  return { records, store };
}

describe("research model transport journal", () => {
  it("replays a receipted response after restart without another HTTP request", async () => {
    const { records, store } = memoryStore(), send = vi.fn(async () => answer());
    const first = await journalledModelTransport(store, send)(url, request);
    const replay = await journalledModelTransport(store, send)(url, request);
    expect(await replay.json()).toEqual(await first.json());
    expect(send).toHaveBeenCalledOnce();
    expect(replay.headers.get("set-cookie")).toBeNull();
    expect(JSON.stringify([...records.keys()])).not.toMatch(/private question|secret|openrouter/);
    expect([...records.values()][0]).toMatchObject({ state: "settled", costUsd: 0.01, response: { providerRequestId: "gen-receipt" } });
  });
  it("does not turn a timed-out uncertain send into a retryable Busy error", async () => {
    const { store } = memoryStore(), send = vi.fn(async () => { throw new DOMException("timed out", "TimeoutError"); });
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    expect(send).toHaveBeenCalledOnce();
  });
  it("blocks the whole restarted job even if changed research creates a different request", async () => {
    const { store } = memoryStore(), send = vi.fn(async () => { throw new Error("network_lost"); });
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    await expect(journalledModelTransport(store, send)(url, { ...request, body: JSON.stringify({ prompt: "different evidence" }) })).rejects.toBeInstanceOf(ModelReconciliationRequired);
    expect(send).toHaveBeenCalledOnce();
  });
  it.each([null, "0", -1])("keeps an absent or defective cost receipt unsettled: %s", async cost => {
    const { records, store } = memoryStore(), send = vi.fn(async () => answer(cost));
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    expect(send).toHaveBeenCalledOnce(); expect([...records.values()][0].state).toBe("unsettled");
  });
  it("accepts an explicit zero cost and preserves separate identical attempt ordinals", async () => {
    const { records, store } = memoryStore(), send = vi.fn(async () => answer(0));
    const dispatch = journalledModelTransport(store, send);
    await dispatch(url, request); await dispatch(url, request);
    expect(send).toHaveBeenCalledTimes(2); expect(records.size).toBe(2);
    const replay = journalledModelTransport(store, send);
    await replay(url, request); await replay(url, request);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("stops if durable reservation fails, before contacting a provider", async () => {
    const { store } = memoryStore(), send = vi.fn(async () => answer());
    store.reserve = async () => { throw new Error("spend_cap_or_lease"); };
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toThrow("spend_cap_or_lease");
    expect(send).not.toHaveBeenCalled();
  });
  it("does not resend if persisting the receipt failed after provider completion", async () => {
    const { store } = memoryStore(), send = vi.fn(async () => answer());
    store.record = async () => { throw new Error("storage_unavailable"); };
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    await expect(journalledModelTransport(store, send)(url, request)).rejects.toBeInstanceOf(ModelReconciliationRequired);
    expect(send).toHaveBeenCalledOnce();
  });
  it("does not send a request already cancelled by the visitor", async () => {
    const { store, records } = memoryStore(), send = vi.fn(async () => answer()), controller = new AbortController();
    controller.abort();
    await expect(journalledModelTransport(store, send)(url, { ...request, signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(send).not.toHaveBeenCalled(); expect(records.size).toBe(0);
  });
  it("isolates simultaneously running transport contexts", async () => {
    const a = vi.fn(async () => new Response("a")), b = vi.fn(async () => new Response("b"));
    const results = await Promise.all([withModelTransport(a, async () => { await Promise.resolve(); return (await modelFetch(url, request)).text(); }), withModelTransport(b, async () => (await modelFetch(url, request)).text())]);
    expect(results).toEqual(["a", "b"]); expect(a).toHaveBeenCalledOnce(); expect(b).toHaveBeenCalledOnce();
  });
});

describe("private research checkpoint encryption", () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  it("round-trips private state with random nonces", () => {
    const codec = researchJobEncryption("key1", key), value = { question: "private", language: "ar" };
    const a = codec.seal("job1", "request", value), b = codec.seal("job1", "request", value);
    expect(codec.open("job1", "request", a)).toEqual(value);
    expect(a.nonce).not.toBe(b.nonce); expect(JSON.stringify(a)).not.toContain("private");
  });
  it("rejects swapped jobs, purposes, keys and damaged ciphertext", () => {
    const codec = researchJobEncryption("key1", key), envelope = codec.seal("job1", "request", { value: 1 });
    expect(() => codec.open("job2", "request", envelope)).toThrow();
    expect(() => codec.open("job1", "response", envelope)).toThrow();
    expect(() => researchJobEncryption("key1", Buffer.alloc(32, 8).toString("base64")).open("job1", "request", envelope)).toThrow();
    expect(() => codec.open("job1", "request", { ...envelope, tag: Buffer.alloc(16).toString("base64") })).toThrow();
  });
  it("requires an explicit stable 256-bit key and bounded data", () => {
    expect(() => researchJobEncryption("key1", "")).toThrow("invalid_job_encryption_key");
    const codec = researchJobEncryption("key1", key);
    expect(() => codec.seal("job1", "request", "a".repeat(8 * 1024 * 1024))).toThrow("invalid_job_value");
    expect(() => codec.seal("job1", "request", undefined)).toThrow("invalid_job_value");
  });
});
