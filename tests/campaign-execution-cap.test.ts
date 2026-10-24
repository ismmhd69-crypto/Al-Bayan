import { expect, it } from "vitest";
import { ArabicCampaignGuard, sameAllowanceContinuation, type CampaignLedger } from "../scripts/ask-arabic-campaign-guard";
const model = "google/gemini-3.1-flash-lite";
const body = { model, stream: false, messages: [{ role: "user", content: "test" }], max_tokens: 100,
  provider: { zdr: true, data_collection: "deny" } };
const ledger = (): CampaignLedger => ({ version: 1, cap: .5, executionCap: .12, priorExposure: .1, originalLedgerHash: "original",
  prices: { [model]: { prompt: .1, completion: .1, request: .015 } }, calls: [] });
it("enforces a smaller execution limit before dispatch while preserving the overall allowance", async () => {
  const l = ledger(), guard = new ArabicCampaignGuard(l, () => {}, { cap: l.cap, priorExposure: l.priorExposure }); let sent = 0;
  const dispatch = guard.dispatch(async () => { sent++; return Response.json({ id: "gen-test", usage: { cost: .008 } }); });
  const input = { method: "POST", body: JSON.stringify(body) };
  await dispatch("https://openrouter.ai/api/v1/chat/completions", input);
  await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", input)).rejects.toThrow("execution_limit");
  expect(sent).toBe(1); expect(l.cap).toBe(.5); expect(guard.actual).toBe(.008);
});
it("counts overlapping reservations against the execution limit", async () => {
  const l = ledger(), guard = new ArabicCampaignGuard(l, () => {}, { cap: l.cap, priorExposure: l.priorExposure }); let release!: () => void, sent = 0;
  const gate = new Promise<void>(r => { release = r; });
  const dispatch = guard.dispatch(async () => { sent++; await gate; return Response.json({ id: "gen-test", usage: { cost: .008 } }); });
  const input = { method: "POST", body: JSON.stringify(body) };
  const results = Promise.allSettled([dispatch("https://openrouter.ai/api/v1/chat/completions", input), dispatch("https://openrouter.ai/api/v1/chat/completions", input)]);
  await new Promise(r => setTimeout(r, 0)); expect(sent).toBe(1); release();
  expect((await results).filter(r => r.status === "rejected")).toHaveLength(1); expect(sent).toBe(1);
});
it.each([NaN, Infinity, -.1, .1, .6, null, "0.12", true])("rejects an invalid execution ceiling (%s)", executionCap => {
  const l = { ...ledger(), executionCap } as CampaignLedger;
  expect(() => new ArabicCampaignGuard(l, () => {}, { cap: l.cap, priorExposure: l.priorExposure })).toThrow("execution_cap");
});
it("does not reset the overall ceiling or inherit a completed task limit into separately authorized work", () => {
  const l = ledger(); l.stopped = "finished_and_reviewed";
  const next = sameAllowanceContinuation(JSON.stringify(l), "parent", "Explicit new scope decision, not an automatic retry");
  expect(next.cap).toBe(.5); expect(next.priorExposure).toBe(.1); expect(next.executionCap).toBeUndefined();
});
