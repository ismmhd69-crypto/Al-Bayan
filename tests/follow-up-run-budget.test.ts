import { expect, it, vi } from "vitest";
import { plannerRunBudget, type RunLedger } from "../scripts/follow-up-run-budget";
const url = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.1-flash-lite:generateContent";
const request = { method: "POST", body: JSON.stringify({ systemInstruction: { parts: [{ text: "You create a safe search plan" }] }, contents: [{ parts: [{ text: JSON.stringify({ visitor_text: "Synthetic fixture" }) }] }], generationConfig: { maxOutputTokens: 4000 } }) };
const ledger = (): RunLedger => ({ calls: 0, spentUsd: 0, reservedUsd: 0, held: false, receipts: [] });
it("reserves before dispatch, settles token charges, and stops before ten cents or 32 sends", async () => {
  const state = ledger(), save = vi.fn(async () => {}), send = vi.fn(async () => {
    expect(state.reservedUsd).toBeGreaterThan(0); expect(save).toHaveBeenCalled();
    return Response.json({ usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 10 } });
  });
  const guarded = plannerRunBudget(state, save, send);
  await guarded(url, request); expect(state.spentUsd).toBeCloseTo(0.00007); expect(state.reservedUsd).toBe(0);
  state.spentUsd = 0.099;
  await expect(guarded(url, request)).rejects.toThrow("run_allowance"); expect(send).toHaveBeenCalledTimes(1);
  state.spentUsd = 0; state.calls = 32;
  await expect(guarded(url, request)).rejects.toThrow("run_allowance"); expect(send).toHaveBeenCalledTimes(1);
});
it("holds an unknown bill and permits no retry or other endpoint", async () => {
  const state = ledger(), send = vi.fn(async () => Response.json({}));
  const guarded = plannerRunBudget(state, async () => {}, send);
  await expect(guarded("https://example.com", request)).rejects.toThrow("planner_contract"); expect(send).not.toHaveBeenCalled();
  await expect(guarded(url, request)).rejects.toThrow("billing_uncertain");
  expect(state.reservedUsd).toBeGreaterThan(0);
  await expect(guarded(url, request)).rejects.toThrow("billing_uncertain"); expect(send).toHaveBeenCalledTimes(1);
});
