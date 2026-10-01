import "server-only";
import type { AIProvider, JsonRequest } from "./types";
import { GoogleBusyError } from "./gemini";

// NVIDIA's hosted models (build.nvidia.com), OpenAI-compatible chat API. Used as a different company's
// door when Google is busy. The same "busy" error class is reused so the model chain moves on the
// same way for every provider.
const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
// Short on purpose: a model stuck in the free queue must not use up the whole 50 s answer deadline.
const TIMEOUT_MS = Number(process.env.NVIDIA_TIMEOUT_MS) || 20_000;

/** The first JSON object in the text, tolerating code fences or thinking text around it. */
function firstJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null; // malformed output is refused by the caller, like Gemini's
  }
}

export function createNvidia(apiKey: string, model: string): AIProvider {
  return {
    id: `nvidia/${model}`,
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, signal }: JsonRequest) {
      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
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
          }),
        });
      } catch (err) {
        // A model stuck in NVIDIA's free queue counts as busy so the chain can try the next one;
        // the caller's own deadline still ends the whole answer.
        if (!signal?.aborted && (err as Error).name === "TimeoutError") throw new GoogleBusyError("nvidia slow (timeout)");
        throw err;
      }
      if (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504) throw new GoogleBusyError(`nvidia busy (${res.status})`);
      // No access, or the model is not offered to this key or has been retired (404/410): try the next one.
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 410) throw new GoogleBusyError(`nvidia unavailable (${res.status})`);
      if (!res.ok) throw new Error(`nvidia request failed with status ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
      return firstJsonObject(data.choices?.[0]?.message?.content ?? "");
    },
  };
}
