import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AskSpendStop, installSpendGuard, reserveUsd, SpendGuard } from "../scripts/ask-spend-guard";

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
    } finally { run.close(); rmSync(directory, { recursive: true }); }
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
    } finally { run.close(); rmSync(directory, { recursive: true }); }
  });
});
