import "server-only";
import type { AIProvider, JsonRequest } from "./types";
import { GoogleBusyError } from "./gemini";
import { nvidiaLimiter, waitForSlot, type RateLimiter } from "./limits";

// NVIDIA's hosted models (build.nvidia.com), OpenAI-compatible chat API. The same "busy" error class
// as Gemini is reused, so the model chain (lib/ai/index.ts) moves on the same way for every provider.
// NVIDIA's terms: the free hosted endpoint is for development, testing and research, about 40
// requests a minute per model, with unpredictable queues.
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
// Short by default: a model stuck in the free queue must not use up the whole answer deadline.
const timeoutMs = () => Number(process.env.NVIDIA_TIMEOUT_MS) || 20_000;
// How long a call may wait for a free slot under the per-minute limit before counting as busy.
const SLOT_WAIT_MS = 1_000;
const BUSY_STATUSES = new Set([429, 502, 503, 504]);
// No access, or the model is not offered to this key or has been retired: try the next model.
const UNAVAILABLE_STATUSES = new Set([401, 403, 404, 410]);

/**
 * The first complete JSON object in a model's reply, tolerating code fences, reasoning text or
 * <think> blocks around it. Malformed output gives null, which every caller refuses (fail closed).
 */
export function extractJsonObject(text: string): unknown {
  const visible = text.replace(/<think>[\s\S]*?<\/think>/gi, " ").replace(/<think>[\s\S]*$/i, " ");
  for (let start = visible.indexOf("{"); start !== -1; start = visible.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < visible.length; i += 1) {
      const c = visible[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') inString = false;
      } else if (c === '"') inString = true;
      else if (c === "{") depth += 1;
      else if (c === "}" && --depth === 0) {
        try {
          const value: unknown = JSON.parse(visible.slice(start, i + 1));
          if (value && typeof value === "object" && !Array.isArray(value)) return value;
        } catch {
          // not valid JSON from this "{": try the next one
        }
        break;
      }
    }
  }
  return null;
}

// Less hidden reasoning means faster answers. NVIDIA_REASONING=low (default) asks gpt-oss models
// for low effort; =off also switches thinking off for the Nemotron models; =default sends nothing.
function reasoningOptions(model: string): Record<string, unknown> {
  const mode = process.env.NVIDIA_REASONING ?? "low";
  if (mode === "default") return {};
  if (model.startsWith("openai/gpt-oss")) return { reasoning_effort: "low" };
  if (mode === "off" && model.startsWith("nvidia/nemotron")) return { chat_template_kwargs: { enable_thinking: false } };
  return {};
}

const debug = (message: string) => {
  if (process.env.ASK_DEBUG === "true") console.info(message);
};

export function createNvidia(apiKey: string, model: string, limiter: RateLimiter = nvidiaLimiter): AIProvider {
  const id = `nvidia/${model}`;
  return {
    id,
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, signal }: JsonRequest) {
      const call = async (): Promise<Response> => {
        if (!(await waitForSlot(limiter, model, SLOT_WAIT_MS, signal))) {
          if (signal?.aborted) throw signal.reason ?? new Error("aborted");
          throw new GoogleBusyError("nvidia busy (local limit)");
        }
        try {
          return await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs())]) : AbortSignal.timeout(timeoutMs()),
            cache: "no-store",
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: `${system}\n\nReply with ONLY one JSON object that matches this JSON schema, with no other text:\n${JSON.stringify(schema)}` },
                { role: "user", content: prompt },
              ],
              temperature: 0,
              max_tokens: maxOutputTokens,
              stream: false,
              response_format: { type: "json_object" },
              ...reasoningOptions(model),
            }),
          });
        } catch (err) {
          // A model stuck in NVIDIA's free queue counts as busy so the chain can try the next one;
          // the caller's own deadline still ends the whole answer.
          if (!signal?.aborted && (err as Error).name === "TimeoutError") throw new GoogleBusyError("nvidia slow (timeout)");
          throw err;
        }
      };

      let res = await call();
      // One short, jittered retry for a brief overload; then the chain moves on instead of waiting.
      if (BUSY_STATUSES.has(res.status) && !signal?.aborted) {
        debug(`${id} busy (${res.status}), retrying once`);
        await new Promise((r) => setTimeout(r, 500 + Math.floor(Math.random() * 1000)));
        if (!signal?.aborted) res = await call();
      }
      if (BUSY_STATUSES.has(res.status)) throw new GoogleBusyError(`nvidia busy (${res.status})`);
      if (UNAVAILABLE_STATUSES.has(res.status)) throw new GoogleBusyError(`nvidia unavailable (${res.status})`);
      if (!res.ok) throw new Error(`nvidia request failed with status ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
      return extractJsonObject(data.choices?.[0]?.message?.content ?? "");
    },
  };
}
