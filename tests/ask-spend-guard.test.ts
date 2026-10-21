import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { AskSpendStop, installSpendGuard, reserveUsd, SpendGuard } from "../scripts/ask-spend-guard";
import { inspectAskSpend } from "../scripts/inspect-ask-spend";

function removeFixture(directory: string) {
  const rel = relative(resolve(tmpdir()), resolve(directory));
  if (!/^ask-spend-test-[A-Za-z0-9]+$/.test(rel)) throw new Error("unsafe_test_cleanup");
  rmSync(directory, { recursive: true });
}

afterEach(() => vi.unstubAllGlobals());

describe("paid evaluation budget", () => {
  it("counts reservations before requests and shares settled spend across rounds", () => {
    const ledger = { cap: 1.5, entries: [] };
    const first = new SpendGuard(ledger);
    const call = first.reserve("writer", 0.9);
    expect(() => first.reserve("checker", 0.7)).toThrow(AskSpendStop);
    first.settle(call, 0.2);
    const nextRound = new SpendGuard(ledger);
    expect(nextRound.actual).toBe(0.2);
    expect(nextRound.reserve("fallback", 0.7).reserved).toBe(0.7);
  });
  it.each([undefined, NaN, -1, 0.21])("stops on missing or excessive cost %s", (cost) => {
    const guard = new SpendGuard({ cap: 1.5, entries: [] });
    const entry = guard.reserve("m", 0.2);
    expect(() => guard.settle(entry, cost)).toThrow(AskSpendStop);
    expect(guard.exposure).toBe(0.2);
    expect(() => guard.reserve("retry", 0.1)).toThrow(AskSpendStop);
  });
  it("accepts zero cost and reserves for Arabic bytes and hidden output tokens", () => {
    expect(reserveUsd({ messages: ["صبر"], max_tokens: 2048 })).toBeGreaterThan(2048 * 10 / 1_000_000);
    const guard = new SpendGuard({ cap: 1.5, entries: [] });
    guard.settle(guard.reserve("m", 0.1), 0);
    expect(guard.actual).toBe(0);
  });
  it("cannot override the hard cap", () => {
    expect(() => new SpendGuard({ cap: 2, entries: [] })).toThrow(AskSpendStop);
  });
  it("persists each attempt before fetch, constrains price and never stores headers", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ask-spend-test-"));
    const path = join(directory, "ledger.json");
    const bodies: Record<string, any>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init: RequestInit) => {
      const persisted = JSON.parse(readFileSync(path, "utf8"));
      expect(persisted.entries).toHaveLength(bodies.length + 1);
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ usage: { cost: 0.001 } }));
    }));
    const run = installSpendGuard(path);
    try {
      const init = { method: "POST", headers: { Authorization: "Bearer test-only-secret" }, body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite", messages: [{ content: "fixed public question" }], max_tokens: 200,
      }) };
      await fetch("https://openrouter.ai/api/v1/chat/completions", init);
      await fetch("https://openrouter.ai/api/v1/chat/completions", init);
      expect(run.guard.actual).toBe(0.002);
      expect(bodies[0].provider.max_price).toEqual({ prompt: 2, completion: 10, request: 0 });
      expect(readFileSync(path, "utf8")).not.toContain("test-only-secret");
      expect(() => installSpendGuard(path)).toThrow();
    } finally { run.close(); removeFixture(directory); }
  });
  it("refuses a paid call before fetch when a preceding round used the allowance", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ask-spend-test-"));
    const path = join(directory, "ledger.json");
    writeFileSync(path, JSON.stringify({ cap: 1.5, entries: [{ model: "m", reserved: 1.49, cost: 1.49, at: "previous round" }] }));
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const run = installSpendGuard(path);
    try {
      await expect(fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite", messages: [{ content: "q" }], max_tokens: 1000,
      }) })).rejects.toBeInstanceOf(AskSpendStop);
      expect(fetcher).not.toHaveBeenCalled();
    } finally { run.close(); removeFixture(directory); }
  });
  it("retains a returned generation ID before a missing cost stops the experiment", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ask-spend-test-")), path = join(directory, "ledger.json");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "gen-invented-123", error: { message: "private content must not be stored" } }), { headers: { "x-request-id": "req-invented-456" } })));
    const run = installSpendGuard(path);
    try {
      await expect(fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer never-store-this" }, body: JSON.stringify({ model: "google/gemini-3.1-flash-lite", messages: [{ content: "private question never stored" }], max_tokens: 200 }) })).rejects.toBeInstanceOf(AskSpendStop);
      const raw = readFileSync(path, "utf8"), ledger = JSON.parse(raw), entry = ledger.entries[0];
      expect(entry).toMatchObject({ generationId: "gen-invented-123", providerRequestId: "req-invented-456", httpStatus: 200 });
      expect(entry.requestFingerprint).toMatch(/^[a-f0-9]{64}$/); expect(entry.cost).toBeUndefined();
      expect(raw).not.toContain("private question"); expect(raw).not.toContain("never-store-this"); expect(raw).not.toContain("private content");
      expect(inspectAskSpend(raw)).toMatchObject({ blocked: true, mayStartPaidEvaluation: false, unresolved: [{ hasRecordedGenerationId: true }] });
      expect(readdirSync(directory).some(n => n.includes(".pending-"))).toBe(false);
    } finally { run.close(); removeFixture(directory); }
  });
  it("retains header metadata and reservation when the response is not JSON", async () => {
    const directory = mkdtempSync(join(tmpdir(), "ask-spend-test-")), path = join(directory, "ledger.json");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("untrusted body", { status: 502, headers: { "x-request-id": "req-header" } })));
    const run = installSpendGuard(path);
    try {
      await expect(fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "google/gemini-3.1-flash-lite", messages: [{ content: "q" }], max_tokens: 200 }) })).rejects.toBeInstanceOf(AskSpendStop);
      const ledger = JSON.parse(readFileSync(path, "utf8"));
      expect(ledger.entries[0]).toMatchObject({ httpStatus: 502, providerRequestId: "req-header" });
      expect(ledger.entries[0].cost).toBeUndefined(); expect(ledger.stopped).toBeTruthy();
    } finally { run.close(); removeFixture(directory); }
  });
  it("does not turn negative, invalid or above-reservation charges into extra budget", () => {
    for (const cost of [-0.1, NaN, Infinity, 0.2]) expect(() => new SpendGuard({ cap: 1.5, entries: [{ model: "m", at: "fixture", reserved: 0.1, cost }] })).toThrow("invalid spending ledger");
  });
  it("reports the old missing-receipt condition without clearing or changing it", () => {
    const data = JSON.stringify({ cap: 1.5, stopped: "existing hold", entries: [{ model: "fixture/model", at: "2026-10-04T11:17:30.244Z", reserved: 0.113472 }] });
    const report = inspectAskSpend(data);
    expect(report).toMatchObject({ blocked: true, mayStartPaidEvaluation: false, unresolvedReservedUsd: 0.113472,
      unresolved: [{ hasRecordedGenerationId: false, hasRecordedRequestFingerprint: false }] });
    expect(data).toContain("existing hold");
  });
});
