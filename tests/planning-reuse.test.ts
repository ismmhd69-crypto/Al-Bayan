import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { settledPlanningResponses, reuseSettledPlanning } from "../scripts/ask-planning-reuse";
import { digest, type CampaignCall } from "../scripts/ask-arabic-campaign-guard";

const url = "https://openrouter.ai/api/v1/chat/completions";
function fixture() {
  const bodies = ["first exact request", "second exact request"];
  const receipts: CampaignCall[] = bodies.map((body, i) => ({ fingerprint: digest(body), model: "test/model", reserved: .1,
    at: "test", cost: .001 + i * .001, httpStatus: 200, finishReason: "stop", generationId: `gen-${i}`, promptTokens: 20 + i, completionTokens: 5 }));
  const events = receipts.flatMap((r, i) => {
    const value = { text: `Complete response ${i}` }, common = { call_id: `call-${i}` };
    return [
      { event: "model_request", data: { ...common, role: "writer", phase: "frame", schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } } },
      { event: "model_response", data: { ...common, value } },
      { event: "model_transport", data: { ...common, code: "provider_visible_output", details: { model: r.model, finish_reason: "stop", content: JSON.stringify(value) } } },
      { event: "model_transport", data: { ...common, code: "model_usage", details: { model: r.model, cost_usd: r.cost, prompt_tokens: r.promptTokens, completion_tokens: r.completionTokens } } },
    ];
  });
  return { bodies, receipts, events };
}
it("reuses each complete receipt-bound response once, then guards genuinely new calls", async () => {
  const { bodies, receipts, events } = fixture(), guarded = vi.fn(async () => Response.json({ new: true })), reused = vi.fn();
  const transport = reuseSettledPlanning(settledPlanningResponses(events, receipts), guarded, reused);
  for (const body of bodies) {
    const data = await (await transport(url, { body })).json();
    expect(data.usage.cost).toBe(0); expect(data.evaluation_cache_replay).toBe(true);
  }
  expect(guarded).not.toHaveBeenCalled(); expect(reused).toHaveBeenCalledTimes(2);
  await expect(transport(url, { body: bodies[0] })).rejects.toThrow("already_consumed");
  await transport(url, { body: "new eligible request" }); expect(guarded).toHaveBeenCalledTimes(1);
});
it("rejects changed request identity before spending", async () => {
  const f = fixture(), guarded = vi.fn(), transport = reuseSettledPlanning(settledPlanningResponses(f.events, f.receipts), guarded, () => {});
  await expect(transport(url, { body: "changed privacy, model, wording or allowance" })).rejects.toThrow("changed_no_paid_repeat");
  expect(guarded).not.toHaveBeenCalled();
});
it("honors cancellation without consuming a response", async () => {
  const f = fixture(), reused = vi.fn(), transport = reuseSettledPlanning(settledPlanningResponses(f.events, f.receipts), vi.fn(), reused);
  await expect(transport(url, { body: f.bodies[0], signal: AbortSignal.abort() })).rejects.toThrow();
  expect(reused).not.toHaveBeenCalled(); await expect(transport(url, { body: f.bodies[0] })).resolves.toBeInstanceOf(Response);
});
it.each(["uncertain", "duplicate", "broken JSON", "extra field", "different parsed value", "wrong phase", "wrong cost"])("refuses invalid planning recovery: %s", mode => {
  const f = fixture();
  if (mode === "uncertain") delete f.receipts[0].cost;
  if (mode === "duplicate") f.events.push(f.events[2]);
  if (mode === "broken JSON") (f.events[2].data as any).details.content = '{"text":"child"';
  if (mode === "extra field") (f.events[2].data as any).details.content = '{"text":"child","extra":true}';
  if (mode === "different parsed value") (f.events[1].data as any).value.text = "changed";
  if (mode === "wrong phase") (f.events[0].data as any).phase = "answer";
  if (mode === "wrong cost") f.receipts[0].cost = .09;
  expect(() => settledPlanningResponses(f.events, f.receipts)).toThrow();
});
it("binds the explicit transport prefix to the same receipt model only", () => {
  const f = fixture();
  for (const event of f.events) if (event.event === "model_transport") (event.data as any).details.model = "openrouter/test/model";
  expect(settledPlanningResponses(f.events, f.receipts)).toHaveLength(2);
});
