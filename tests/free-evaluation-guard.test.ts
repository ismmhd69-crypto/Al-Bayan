import { describe, expect, it } from "vitest";
import { freeRequest, freeTransport } from "../scripts/ask-free-guard";
const model = "test/model:free", allowed = new Set([model]);
const body = { model, stream: false, messages: [{ role: "user", content: "synthetic" }], provider: { zdr: true, data_collection: "deny" } };
describe("free-only evaluation", () => {
  it("pins zero pricing and prohibits paid fallback, tools, multimodal and weaker privacy", () => {
    expect(freeRequest(body, allowed).provider).toMatchObject({ max_price: { prompt: 0, completion: 0, request: 0 }, allow_fallbacks: false, zdr: true });
    for (const patch of [{ model: "test/paid" }, { models: ["test/paid"] }, { tools: [] }, { plugins: [] }, { provider: {} }, { stream: true }, { messages: [{ content: [] }] }])
      expect(() => freeRequest({ ...body, ...patch }, allowed)).toThrow();
  });
  it("halts every later call when cost is missing or nonzero", async () => {
    for (const cost of [undefined, 0.001]) {
      let calls = 0;
      const dispatch = freeTransport(allowed, () => {}, 5, async () => { calls++; return Response.json({ id: "gen-test", usage: { cost } }); });
      const init = { method: "POST", body: JSON.stringify(body) };
      await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", init)).rejects.toThrow("cost_not_verified_zero");
      await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", init)).rejects.toThrow("stopped");
      expect(calls).toBe(1);
    }
  });
  it("journals an uncertain response and never retries it", async () => {
    const outcomes: string[] = [];
    const dispatch = freeTransport(allowed, r => outcomes.push(r.outcome), 5, async () => { throw new Error("disconnect"); });
    await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify(body) })).rejects.toThrow("uncertain");
    expect(outcomes).toEqual(["started", "uncertain_no_automatic_retry"]);
  });
  it("records zero-cost completions and enforces a hard call allowance", async () => {
    const receipts: any[] = [];
    let sent: any;
    const dispatch = freeTransport(allowed, r => receipts.push(r), 1, async (_url, init) => {
      sent = JSON.parse(String(init.body));
      return Response.json({ id: "gen-zero", usage: { cost: 0, prompt_tokens: 10, completion_tokens: 3 }, choices: [] });
    });
    const init = { method: "POST", body: JSON.stringify(body) };
    await dispatch("https://openrouter.ai/api/v1/chat/completions", init);
    expect(sent.provider.max_price).toEqual({ prompt: 0, completion: 0, request: 0 });
    expect(receipts.at(-1)).toMatchObject({ outcome: "verified_zero_cost", cost: 0, generationId: "gen-zero" });
    await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", init)).rejects.toThrow("stopped");
  });
  it("distinguishes a rejected route from a generated answer", async () => {
    const receipts: any[] = [];
    const dispatch = freeTransport(allowed, r => receipts.push(r), 1, async () => Response.json({ error: { message: "No endpoints meet data policy" } }, { status: 404 }));
    await dispatch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify(body) });
    expect(receipts.at(-1)).toMatchObject({ outcome: "rejected_before_generation", rejection: "privacy_route_unavailable" });
    expect(receipts.at(-1).cost).toBeUndefined();
  });
});
