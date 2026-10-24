// Owner-only evaluation recovery, never imported by web routes or workers.
import type { ModelTransport } from "../lib/ai/transport";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { recordLocalAskEvent } from "../lib/ask/local-trace";
import { digest, type CampaignCall } from "./ask-arabic-campaign-guard";

export type PlanningReplay = { receipt: CampaignCall; content: string };
export function settledPlanningResponses(events: any[], receipts: CampaignCall[]): PlanningReplay[] {
  if (receipts.length !== 2 || receipts.some(c => c.cost === undefined || c.httpStatus !== 200 || c.finishReason !== "stop" || !c.generationId))
    throw Error("planning_receipts_not_exactly_two_settled_successes");
  const requests = events.filter(e => e.event === "model_request");
  if (requests.length !== 2 || requests.some(e => e.data.role !== "writer" || e.data.phase !== "frame")) throw Error("planning_trace_not_eligible");
  const consumed = new Set<CampaignCall>();
  return requests.map(event => {
    const id = event.data.call_id;
    const responses = events.filter(e => e.event === "model_response" && e.data.call_id === id);
    const visible = events.filter(e => e.event === "model_transport" && e.data.call_id === id && e.data.code === "provider_visible_output");
    const usages = events.filter(e => e.event === "model_transport" && e.data.call_id === id && e.data.code === "model_usage");
    if (responses.length !== 1 || visible.length !== 1 || usages.length !== 1) throw Error("planning_response_ambiguous");
    const output = visible[0].data.details, usage = usages[0].data.details;
    const receiptModel = typeof usage.model === "string" ? usage.model.replace(/^openrouter\//, "") : undefined;
    const matches = receipts.filter(c => c.model === receiptModel && c.cost === usage.cost_usd
      && c.promptTokens === usage.prompt_tokens && c.completionTokens === usage.completion_tokens && !consumed.has(c));
    if (matches.length !== 1 || output.model !== usage.model || output.finish_reason !== "stop" || typeof output.content !== "string")
      throw Error("planning_receipt_binding_failed");
    const parsed = structuredOutputContract(event.data.schema).parse(output.content);
    if (!parsed || JSON.stringify(parsed) !== JSON.stringify(responses[0].data.value)) throw Error("planning_whole_response_invalid");
    consumed.add(matches[0]); return { receipt: matches[0], content: output.content };
  });
}

export function reuseSettledPlanning(rows: PlanningReplay[], guarded: ModelTransport, reused: (row: PlanningReplay) => void): ModelTransport {
  let next = 0;
  const fingerprints = new Set(rows.map(row => row.receipt.fingerprint));
  if (rows.length !== 2 || fingerprints.size !== 2) throw Error("planning_replay_identity_ambiguous");
  return async (url, init) => {
    if (url !== "https://openrouter.ai/api/v1/chat/completions" || typeof init.body !== "string") throw Error("planning_replay_request_invalid");
    const fingerprint = digest(init.body);
    if (next < rows.length) {
      const row = rows[next];
      // Complete transport body identity binds model, privacy, original messages,
      // schema and full output allowance. A changed frame cannot trigger new spend.
      if (fingerprint !== row.receipt.fingerprint) throw Error("planning_request_changed_no_paid_repeat");
      init.signal?.throwIfAborted(); next++; reused(row);
      recordLocalAskEvent("settled_planning_response_reused", { generation_id: row.receipt.generationId, paid_again: false });
      // A clearly recorded cache delivery, not another provider generation. The
      // original receipt retains its paid tokens/cost; this delivery costs zero.
      return Response.json({ id: row.receipt.generationId, choices: [{ finish_reason: "stop", message: { role: "assistant", content: row.content } }],
        usage: { prompt_tokens: 0, completion_tokens: 0, cost: 0 }, evaluation_cache_replay: true });
    }
    if (fingerprints.has(fingerprint)) throw Error("planning_response_already_consumed_no_repeat");
    return guarded(url, init);
  };
}
