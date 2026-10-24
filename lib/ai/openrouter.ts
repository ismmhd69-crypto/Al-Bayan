import { askTimeout } from "@/lib/ask/timing";
import { modelFetch } from "./transport";
import "server-only";
import { emitAiTrace, errorCategory } from "@/lib/ask/trace-context";
import type { AIProvider, JsonRequest } from "./types";
import { GoogleBusyError } from "./gemini";
import { extractJsonObject } from "./nvidia";
import { openrouterLimiter, waitForSlot, type RateLimiter } from "./limits";
import { structuredOutputContract, providerShapeSchema } from "./structured-output";

// OpenRouter (openrouter.ai), OpenAI-compatible chat API in front of many hosted models. Same "busy"
// error class as the other providers, so the model chain (lib/ai/index.ts) moves on the same way.
// Every request carries provider preferences so prompts only go to providers that do not keep or
// train on them (see providerPreferences below); that can make a model unavailable, which counts as
// busy and moves the chain on.
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const timeoutMs = () => Number(process.env.OPENROUTER_TIMEOUT_MS) || 25_000;
const SLOT_WAIT_MS = 1_000;
const BUSY_STATUSES = new Set([429, 502, 503, 504]);
// No access, no provider that meets our privacy preferences, or the model is retired: try the next model.
const UNAVAILABLE_STATUSES = new Set([401, 403, 404, 410]);

// OPENROUTER_PRIVACY=zdr (default): only providers with zero data retention that do not train.
// =deny: providers that do not log or train, retention allowed to run its short course. =off: send nothing
// (never use for visitors' questions).
export function providerPreferences(): Record<string, unknown> {
  const mode = process.env.OPENROUTER_PRIVACY ?? "zdr";
  if (mode === "off") return {};
  const privacy = mode === "deny" ? { data_collection: "deny" } : { data_collection: "deny", zdr: true };
  // OPENROUTER_SORT=throughput|latency|price: try the matching providers in that order instead of
  // OpenRouter's default load balancing (a slow provider can otherwise get picked, even for a fast model).
  const sort = process.env.OPENROUTER_SORT;
  return sort === "throughput" || sort === "latency" || sort === "price" ? { ...privacy, sort } : privacy;
}

// A thinking model must not spend the output budget on hidden reasoning. OPENROUTER_REASONING=low
// (default) asks for low effort: Gemini 3.5 Flash-Lite cannot switch thinking off (OpenRouter answers
// 400 "Reasoning is mandatory for this endpoint"), and low effort worked on every Gemini model tested
// (2026-10-04). off switches it off where the model allows it, medium/high ask for that effort,
// default sends nothing. "exclude" is always set so any reasoning text that is still produced never
// ends up in the reply.
export function reasoningOptions(model?: string): Record<string, unknown> {
  // This pinned non-reasoning model's advertised parameters (including ZDR
  // endpoints) omit reasoning. require_parameters must remain enabled: do not
  // exclude every eligible endpoint by attaching an unsupported optional knob.
  if (model === "mistralai/mistral-small-3.2-24b-instruct") return {};
  const mode = process.env.OPENROUTER_REASONING ?? "low";
  if (mode === "default") return {};
  if (mode === "low" || mode === "medium" || mode === "high") return { reasoning: { effort: mode, exclude: true } };
  return { reasoning: { enabled: false, exclude: true } };
}

const debug = (message: string) => {
  if (process.env.ASK_DEBUG === "true") console.info(message);
};

export function createOpenRouter(apiKey: string, model: string, limiter: RateLimiter = openrouterLimiter): AIProvider {
  const id = `openrouter/${model}`;
  return {
    id,
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, signal, structuredOutput }: JsonRequest) {
      // Opt-in preview. Provider support varies by endpoint; local validation is still required.
      // Compile before any model transport or local request slot can be consumed.
      const contract = structuredOutput || process.env.OPENROUTER_STRUCTURED_OUTPUTS === "true" ? structuredOutputContract(schema) : null;
      // Recorded Google 400s depend on nested size constraints. Acceptance still uses
      // the untouched full local contract, including every count/length restriction.
      const transportSchema = contract && model.startsWith("google/") ? providerShapeSchema(contract.schema) : contract?.schema;
      // Legacy JSON-object mode retains its existing 400 fallback. Schema mode never downgrades.
      let jsonMode = true, attempt = 0;
      const call = async (): Promise<Response> => {
        const started = Date.now();
        emitAiTrace("http_attempt_started", { model: id, attempt: ++attempt, json_mode: jsonMode, output_contract: contract ? "schema" : "legacy" });
        if (!(await waitForSlot(limiter, model, SLOT_WAIT_MS, signal))) {
          if (signal?.aborted) throw signal.reason ?? new Error("aborted");
          emitAiTrace("http_attempt_failed", { model: id, attempt, duration_ms: Date.now() - started, outcome: "busy" });
          throw new GoogleBusyError("openrouter busy (local limit)");
        }
        try {
          const response = await modelFetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Title": "Al-Bayan" },
            signal: askTimeout(signal, timeoutMs(), "openrouter_http"),
            cache: "no-store",
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: `${system}\n\nReply with ONLY one JSON object that matches this JSON schema, with no other text:\n${JSON.stringify(schema)}` },
                { role: "user", content: prompt },
              ],
              // Strict routing requires support for EVERY supplied parameter.
              // The current Google Vertex endpoints support schema output but
              // not temperature; do not exclude them with an optional knob.
              ...(!contract ? { temperature: 0 } : {}),
              max_tokens: maxOutputTokens,
              stream: false,
              ...(contract ? { response_format: { type: "json_schema", json_schema: { name: "bayan_response", strict: true, schema: transportSchema } } }
                : jsonMode ? { response_format: { type: "json_object" } } : {}),
              provider: { ...providerPreferences(), ...(contract ? { require_parameters: true } : {}) },
              ...reasoningOptions(model),
            }),
          });
          emitAiTrace("http_attempt_finished", { model: id, attempt, http_status: response.status, duration_ms: Date.now() - started });
          return response;
        } catch (err) {
          emitAiTrace("http_attempt_failed", { model: id, attempt, duration_ms: Date.now() - started, outcome: errorCategory(err) });
          if (!signal?.aborted && (err as Error).name === "TimeoutError") throw new GoogleBusyError("openrouter slow (timeout)");
          throw err;
        }
      };

      let res = await call();
      if (res.status === 400 && jsonMode && !contract && !signal?.aborted) {
        debug(`${id} rejected JSON mode (400), retrying without it`);
        jsonMode = false;
        res = await call();
      }
      // One short, jittered retry for a brief overload; then the chain moves on instead of waiting.
      if (BUSY_STATUSES.has(res.status) && !signal?.aborted) {
        debug(`${id} busy (${res.status}), retrying once`);
        await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 1000)));
        if (!signal?.aborted) res = await call();
      }
      if (!res.ok) {
        // Classify provider errors without logging their message/body, which may
        // echo visitor input. Preserve privacy and strict-output requirements.
        const error = await res.clone().json().catch(() => null) as { error?: { code?: unknown; message?: unknown } } | null;
        const message = typeof error?.error?.message === "string" ? error.error.message : "";
        const outcome = /no endpoints|no (?:available )?providers|no route/i.test(message) ? "no_eligible_endpoint"
          : /parameter|schema/i.test(message) ? "parameter_or_schema_rejected"
          : [401, 403].includes(res.status) ? "authorization_rejected" : "provider_rejected";
        emitAiTrace("provider_request_rejected", { model: id, http_status: res.status, outcome,
          output_contract: contract ? "schema" : "legacy", temperature_sent: !contract });
      }
      if (BUSY_STATUSES.has(res.status)) throw new GoogleBusyError(`openrouter busy (${res.status})`);
      if (UNAVAILABLE_STATUSES.has(res.status)) throw new GoogleBusyError(`openrouter unavailable (${res.status})`);
      if (!res.ok) throw new Error(`openrouter request failed with status ${res.status}`);
      type Reply = { choices?: { finish_reason?: string; message?: { content?: string | null } }[]; usage?: { cost?: number; prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } };
      const read = async (response: Response): Promise<Reply> => {
        const data = await response.json() as Reply;
        emitAiTrace("provider_visible_output", { model: id, finish_reason: data.choices?.[0]?.finish_reason,
          content: (data.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "[reasoning omitted]").replace(/<think>[\s\S]*$/gi, "[reasoning omitted]") });
        emitAiTrace("model_usage", { model: id, attempt, cost_usd: data.usage?.cost, prompt_tokens: data.usage?.prompt_tokens, completion_tokens: data.usage?.completion_tokens, reasoning_tokens: data.usage?.completion_tokens_details?.reasoning_tokens, finish_reason: data.choices?.[0]?.finish_reason });
        // Count every successful HTTP call, including a cut-off first attempt.
        if (typeof data.usage?.cost === "number") debug(`ai cost: ${id} ${data.usage.cost}`);
        return data;
      };
      const data = await read(res);
      // Hidden reasoning shares max_tokens. Never salvage a nested object from cut-off JSON.
      // Let the existing chain try its next model without a costly same-model retry.
      if (data.choices?.[0]?.finish_reason === "length") throw new GoogleBusyError("openrouter output cut off");
      if (contract) {
        const parsed = contract.parse(data.choices?.[0]?.message?.content ?? "");
        if (parsed === null) emitAiTrace("structured_output_rejected", { model: id, outcome: "format_invalid" });
        return parsed;
      }
      const parsed = extractJsonObject(data.choices?.[0]?.message?.content ?? "");
      if (parsed === null) emitAiTrace("model_output_rejected", { model: id, outcome: "invalid_json_object",
        finish_reason: data.choices?.[0]?.finish_reason, visible_chars: (data.choices?.[0]?.message?.content ?? "").length });
      return parsed;
    },
  };
}
