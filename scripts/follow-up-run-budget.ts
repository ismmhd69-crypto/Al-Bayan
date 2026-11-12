import { modelReservation, VERTEX_PRICES } from "../lib/ai/price-ceiling";
import type { ModelTransport } from "../lib/ai/transport";

export type RunLedger = { calls: number; spentUsd: number; reservedUsd: number; held: boolean; receipts: { call: number; reservedUsd: number; costUsd?: number; tokens?: unknown; milliseconds?: number }[] };
export class PlannerRunStop extends Error {}
export function plannerRunBudget(ledger: RunLedger, save: () => Promise<void>, send: ModelTransport = fetch, limits = { calls: 32, usd: 0.10 }): ModelTransport {
  return async (url, init) => {
    if (ledger.held) throw new PlannerRunStop("billing_uncertain");
    if (url !== "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.1-flash-lite:generateContent" || init.method !== "POST" || typeof init.body !== "string") throw new PlannerRunStop("planner_contract");
    const body = JSON.parse(init.body), prompt = JSON.parse(body.contents?.[0]?.parts?.[0]?.text ?? "null");
    if (!body.systemInstruction?.parts?.[0]?.text?.startsWith("You create a safe search plan") || !prompt?.visitor_text || prompt.sections_to_write || body.tools) throw new PlannerRunStop("planner_contract");
    const reservedUsd = modelReservation({ model: "vertex/gemini-3.1-flash-lite", messages: body, max_tokens: body.generationConfig.maxOutputTokens });
    if (!Number.isSafeInteger(body.generationConfig?.maxOutputTokens) || body.generationConfig.maxOutputTokens <= 0 || !Number.isFinite(reservedUsd)) throw new PlannerRunStop("planner_contract");
    if (ledger.calls >= limits.calls || ledger.spentUsd + ledger.reservedUsd + reservedUsd > limits.usd) throw new PlannerRunStop("run_allowance");
    const receipt: RunLedger["receipts"][number] = { call: ++ledger.calls, reservedUsd };
    ledger.receipts.push(receipt); ledger.reservedUsd += reservedUsd; await save();
    const started = Date.now();
    try {
      const response = await send(url, init), data = await response.clone().json(), usage = data.usageMetadata;
      const counts = [usage?.promptTokenCount, usage?.candidatesTokenCount ?? 0, usage?.thoughtsTokenCount ?? 0];
      if (!counts.every(n => Number.isSafeInteger(n) && n >= 0)) throw new PlannerRunStop("billing_uncertain");
      const price = VERTEX_PRICES["gemini-3.1-flash-lite"];
      receipt.costUsd = (counts[0] * price.prompt + (counts[1] + counts[2]) * price.completion) / 1_000_000;
      receipt.tokens = usage; receipt.milliseconds = Date.now() - started;
      ledger.spentUsd += receipt.costUsd; ledger.reservedUsd -= reservedUsd;
      if (receipt.costUsd > reservedUsd) throw new PlannerRunStop("reservation_exceeded");
      if (!response.ok) throw new PlannerRunStop("provider_failed");
      await save(); return response;
    } catch {
      ledger.held = true; await save(); throw new PlannerRunStop("billing_uncertain");
    }
  };
}
