import { describe, expect, it } from "vitest";
import { ArabicCampaignGuard, type CampaignLedger } from "../scripts/ask-arabic-campaign-guard";
import { ARABIC_CASES, orderedArabicCases } from "../scripts/ask-arabic-quality-cases";
import { matchingTopicHints } from "../data/topic-source-hints";
const model = "google/gemini-3.5-flash-lite";
const ledger = (): CampaignLedger => ({ version: 1, cap: .5, priorExposure: .113472, originalLedgerHash: "hash", prices: { [model]: { prompt: 1, completion: 2, request: 0 } }, calls: [] });
const body = () => ({ model, stream: false, messages: [{ role: "user", content: "سؤال تجريبي" }], max_tokens: 1000, provider: { zdr: true, data_collection: "deny" } });
const init = () => ({ method: "POST", body: JSON.stringify(body()) });
const endpoint = "https://openrouter.ai/api/v1/chat/completions";
describe("Arabic campaign preparation", () => {
 it("requires explicit matching limits for a separately authorized allowance and counts inherited exposure", () => {
  const data = ledger(); data.priorExposure = .40098868125; data.cap = data.priorExposure + .5;
  expect(() => new ArabicCampaignGuard(data)).toThrow("invalid_campaign");
  const guard = new ArabicCampaignGuard(data, () => {}, { cap: data.cap, priorExposure: data.priorExposure });
  expect(guard.exposure).toBe(.40098868125);
  expect(() => guard.reserve({ ...body(), max_tokens: 500000 })).toThrow("budget");
 });
 it("freezes fifty distinct Arabic cases with balanced categories and history", () => {
  expect(ARABIC_CASES).toHaveLength(50); expect(new Set(ARABIC_CASES.map(c => c.id)).size).toBe(50);
  expect(Object.fromEntries(["regression", "fresh", "boundary", "paraphrase", "followup"].map(g => [g, ARABIC_CASES.filter(c => c.group === g).length]))).toEqual({ regression: 10, fresh: 20, boundary: 10, paraphrase: 5, followup: 5 });
  expect(orderedArabicCases().slice(0, 5).map(c => c.id)).toEqual(["R01", "R03", "F01", "F08", "B01"]);
  expect(new Set(orderedArabicCases().map(c => c.id)).size).toBe(50);
  for (const item of orderedArabicCases().slice(0, 5)) expect(matchingTopicHints(item.question)).toEqual([]);
  for (const c of ARABIC_CASES) { expect(c.concerns.length).toBeGreaterThan(0); expect(c.qualification.length).toBeGreaterThan(0); expect(c.question).toMatch(/[\u0600-\u06ff]/); if (c.group === "followup") expect(c.history?.length).toBeGreaterThan(0); }
 });
 it("retains prior exposure and refuses reservations beyond the combined cap", () => {
  const data = ledger(), guard = new ArabicCampaignGuard(data);
  expect(guard.exposure).toBe(.113472);
  for (let i = 0; i < 10; i++) guard.reserve(body());
  expect(() => guard.reserve({ ...body(), max_tokens: 500000 })).toThrow("budget");
  expect(guard.exposure).toBeLessThanOrEqual(.5);
 });
 it("reserves simultaneous calls before network starts and never exceeds the cap", async () => {
  const data = ledger(); data.prices[model].request = .16;
  let sent = 0;
  const dispatch = new ArabicCampaignGuard(data).dispatch(async () => { sent++; await new Promise(r => setTimeout(r, 5)); return Response.json({ id: "gen-test", usage: { cost: .01 } }); });
  const results = await Promise.allSettled([dispatch(endpoint, init()), dispatch(endpoint, init()), dispatch(endpoint, init())]);
  expect(sent).toBe(3); expect(results.filter(r => r.status === "rejected")).toHaveLength(0);
  expect(data.calls.reduce((sum, c) => sum + c.cost!, data.priorExposure)).toBeLessThanOrEqual(data.cap);
 });
 it("waits for an overlapping reservation to settle instead of killing an affordable next call", async () => {
  const data = ledger(); data.cap = data.priorExposure + .13; data.prices[model].request = .06;
  const guard = new ArabicCampaignGuard(data, () => {}, { cap: data.cap, priorExposure: data.priorExposure });
  let release!: () => void; const gate = new Promise<void>(resolve => release = resolve); let sent = 0;
  const dispatch = guard.dispatch(async () => { sent++; if (sent === 1) await gate; return Response.json({ id: `gen-test${sent}`, usage: { cost: .002 } }); });
  const first = dispatch(endpoint, init()), second = dispatch(endpoint, init());
  const results = Promise.allSettled([first, second]);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(sent).toBe(1); expect(data.stopped).toBeUndefined();
  release();
  expect((await results).every(r => r.status === "fulfilled")).toBe(true);
  expect(sent).toBe(2); expect(guard.actual).toBe(.004); expect(guard.exposure).toBeLessThanOrEqual(data.cap);
 });
 it.each(["uncertain", "budget", "cancelled", "changed ledger"])("rechecks queued requests safely after %s", async condition => {
  const data = ledger(); data.cap = data.priorExposure + .13; data.prices[model].request = .06;
  const guard = new ArabicCampaignGuard(data, () => {}, { cap: data.cap, priorExposure: data.priorExposure });
  let release!: () => void; const gate = new Promise<void>(resolve => release = resolve); let sent = 0, unchanged = true;
  const dispatch = guard.dispatch(async () => {
    sent++; await gate;
    if (condition === "uncertain") throw Error("connection lost after dispatch");
    return Response.json({ id: "gen-test", usage: { cost: condition === "budget" ? .06 : .002 } });
  }, () => unchanged);
  const controller = new AbortController();
  const first = dispatch(endpoint, init()), second = dispatch(endpoint, { ...init(), signal: controller.signal });
  const results = Promise.allSettled([first, second]);
  await new Promise(resolve => setTimeout(resolve, 0)); expect(sent).toBe(1);
  if (condition === "cancelled") controller.abort();
  if (condition === "changed ledger") unchanged = false;
  release(); const settled = await results;
  expect(sent).toBe(1); expect(data.calls).toHaveLength(1); expect(settled[1].status).toBe("rejected");
  if (condition === "uncertain") { expect(data.calls[0].cost).toBeUndefined(); expect(data.stopped).toContain("uncertain"); }
  if (condition === "budget") expect(data.stopped).toContain("budget");
  if (condition === "cancelled") expect(data.stopped).toBeUndefined();
  expect(guard.exposure).toBeLessThanOrEqual(data.cap);
 });
 it("stops on an uncertain response and refuses restart without resolving it", async () => {
  const data = ledger(), guard = new ArabicCampaignGuard(data);
  const dispatch = guard.dispatch(async () => { throw new Error("disconnect"); });
  await expect(dispatch(endpoint, init())).rejects.toThrow("uncertain");
  await expect(dispatch(endpoint, init())).rejects.toThrow("uncertain");
  expect(() => new ArabicCampaignGuard(data)).toThrow("unresolved");
  expect(data.calls).toHaveLength(1);
 });
 it("rejects unknown cost and preserves its reservation", async () => {
  const data = ledger(), guard = new ArabicCampaignGuard(data);
  await expect(guard.dispatch(async () => Response.json({ id: "gen-test" }))(endpoint, init())).rejects.toThrow("unknown");
  expect(data.calls[0].cost).toBeUndefined(); expect(guard.exposure).toBeGreaterThan(.113472);
 });
 it("records actual costs, tokens and receipts and sets endpoint price ceilings", async () => {
  const data = ledger(), guard = new ArabicCampaignGuard(data);
  await guard.dispatch(async (_url, req) => { expect(JSON.parse(String(req.body)).provider.max_price).toEqual(data.prices[model]); return Response.json({ id: "gen-test", usage: { cost: .004, prompt_tokens: 100, completion_tokens: 20 } }); })(endpoint, init());
  expect(guard.actual).toBe(.004); expect(guard.exposure).toBeCloseTo(.117472); expect(data.calls[0].generationId).toBe("gen-test");
 });
 it("blocks other models, privacy changes, paid extras and changed original ledgers", async () => {
  for (const patch of [{ model: "other/model" }, { tools: [] }, { plugins: [] }, { provider: {} }, { models: [model] }]) expect(() => new ArabicCampaignGuard(ledger()).reserve({ ...body(), ...patch })).toThrow();
  await expect(new ArabicCampaignGuard(ledger()).dispatch(fetch, () => false)(endpoint, init())).rejects.toThrow("original_ledger_changed");
 });
 it("counts explicit pre-generation rejection separately, without inventing an answer", async () => {
  const data = ledger(), guard = new ArabicCampaignGuard(data);
  await guard.dispatch(async () => Response.json({ error: { code: 404 } }, { status: 404 }))(endpoint, init());
  expect(data.calls[0]).toMatchObject({ cost: 0, httpStatus: 404, rejection: "no_eligible_route" });
 });
 it("refuses all further requests after a material source review stop", async () => {
  const data = ledger(); data.stopped = "source_faithfulness_failure_review_required";
  let sent = 0;
  await expect(new ArabicCampaignGuard(data).dispatch(async () => { sent++; return Response.json({}); })(endpoint, init())).rejects.toThrow("source_faithfulness");
  expect(sent).toBe(0);
 });
 it("stops when a receipt exceeds its conservative reservation", async () => {
  const data = ledger();
  await expect(new ArabicCampaignGuard(data).dispatch(async () => Response.json({ id: "gen-test", usage: { cost: .49 } }))(endpoint, init())).rejects.toThrow("exceeds_reservation");
  expect(data.calls[0].cost).toBeUndefined();
 });
});
