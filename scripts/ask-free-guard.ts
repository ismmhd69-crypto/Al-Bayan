// Local, synthetic-question evaluations only. No changes to paid reservations or website defaults.
import { withModelTransport, type ModelTransport } from "../lib/ai/transport";

export type FreeReceipt = { model: string; status?: number; generationId?: string; cost?: number; promptTokens?: number; completionTokens?: number; outcome: string; rejection?: string; retryAfter?: string | null };
export function freeRequest(body: Record<string, any>, allowed: Set<string>): Record<string, any> {
  if (!allowed.has(body.model) || !body.model.endsWith(":free") || body.models || body.route || body.tools || body.plugins
    || body.stream !== false || !Array.isArray(body.messages) || body.messages.some((m: any) => typeof m.content !== "string"))
    throw new Error("free_test_request_not_allowed");
  if (body.provider?.data_collection !== "deny" || body.provider?.zdr !== true) throw new Error("free_test_privacy_required");
  return { ...body, provider: { ...body.provider, allow_fallbacks: false, max_price: { prompt: 0, completion: 0, request: 0 } } };
}

export function freeTransport(allowed: Set<string>, save: (receipt: FreeReceipt) => void, maxCalls = 160, network: ModelTransport = fetch) {
  let calls = 0, stopped = false;
  return async (url: string, init: RequestInit): Promise<Response> => {
    if (stopped || calls >= maxCalls) throw new Error("free_test_stopped");
    if (url !== "https://openrouter.ai/api/v1/chat/completions" || init.method !== "POST" || typeof init.body !== "string")
      throw new Error("free_test_transport_not_allowed");
    const body = freeRequest(JSON.parse(init.body), allowed);
    const receipt: FreeReceipt = { model: body.model, outcome: "started" };
    calls++; save({ ...receipt });
    let response: Response, data: any;
    try {
      response = await network(url, { ...init, body: JSON.stringify(body) });
      data = await response.clone().json();
    } catch {
      stopped = true; save({ ...receipt, outcome: "uncertain_no_automatic_retry" });
      throw new Error("free_test_uncertain_response");
    }
    receipt.status = response.status;
    receipt.retryAfter = response.headers.get("retry-after");
    if (!response.ok) {
      const message = `${String(data.error?.message ?? "")} ${String(data.error?.metadata?.raw ?? "")}`;
      receipt.rejection = /per.day|daily|day.*limit/i.test(message) ? "daily_limit"
        : /per.minute|minute.*limit|rate.limit|too many/i.test(message) ? "rate_limit"
        : /privacy|data.policy|data policy|retention/i.test(message) ? "privacy_route_unavailable"
        : /no endpoints|no.*provider/i.test(message) ? "no_eligible_endpoint" : "request_rejected";
    }
    receipt.generationId = typeof data.id === "string" ? data.id : undefined;
    receipt.cost = data.usage?.cost;
    receipt.promptTokens = data.usage?.prompt_tokens;
    receipt.completionTokens = data.usage?.completion_tokens;
    const rejectedBeforeGeneration = !response.ok && !data.id && !data.choices && data.error;
    if (!rejectedBeforeGeneration && receipt.cost !== 0) {
      stopped = true; save({ ...receipt, outcome: "unexpected_or_unknown_cost_stopped" });
      throw new Error("free_test_cost_not_verified_zero");
    }
    receipt.outcome = rejectedBeforeGeneration ? "rejected_before_generation" : "verified_zero_cost";
    save(receipt);
    return response;
  };
}
export const withFreeTransport = withModelTransport;
