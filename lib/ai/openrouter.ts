import "server-only";
import type { AIProvider, JsonRequest } from "./types";
import { GoogleBusyError } from "./gemini";
import { extractJsonObject } from "./nvidia";
import { openrouterLimiter, waitForSlot, type RateLimiter } from "./limits";

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

// A thinking model must not spend the output budget on hidden reasoning. OPENROUTER_REASONING=off
// (default) switches it off, low/medium/high asks for that effort, default sends nothing. "exclude"
// is always set so any reasoning text that is still produced never ends up in the reply.
export function reasoningOptions(): Record<string, unknown> {
  const mode = process.env.OPENROUTER_REASONING ?? "off";
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
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, signal }: JsonRequest) {
      // Some providers reject response_format (a 400); the reply is parsed tolerantly anyway, so one
      // retry without it is safe. Once a 400 shows it, the rest of this call goes without it.
      let jsonMode = true;
      const call = async (): Promise<Response> => {
        if (!(await waitForSlot(limiter, model, SLOT_WAIT_MS, signal))) {
          if (signal?.aborted) throw signal.reason ?? new Error("aborted");
          throw new GoogleBusyError("openrouter busy (local limit)");
        }
        try {
          return await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Title": "Al-Bayan" },
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
              ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
              provider: providerPreferences(),
              ...reasoningOptions(),
            }),
          });
        } catch (err) {
          if (!signal?.aborted && (err as Error).name === "TimeoutError") throw new GoogleBusyError("openrouter slow (timeout)");
          throw err;
        }
      };

      let res = await call();
      if (res.status === 400 && jsonMode && !signal?.aborted) {
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
      if (BUSY_STATUSES.has(res.status)) throw new GoogleBusyError(`openrouter busy (${res.status})`);
      if (UNAVAILABLE_STATUSES.has(res.status)) throw new GoogleBusyError(`openrouter unavailable (${res.status})`);
      if (!res.ok) throw new Error(`openrouter request failed with status ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[]; usage?: { cost?: number } };
      // Real money per call (dollars), logged as model id and number only, so a measurement can add it up.
      if (typeof data.usage?.cost === "number") debug(`ai cost: ${id} ${data.usage.cost}`);
      return extractJsonObject(data.choices?.[0]?.message?.content ?? "");
    },
  };
}
