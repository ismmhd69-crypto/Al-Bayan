import "server-only";
import type { AIProvider, JsonRequest, JsonSchema } from "./types";

// Google Gemini over plain HTTPS. Free tier is for Mo's private testing only (plan section 5).
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30_000;

// Gemini's response schema uses upper-case type names.
function toGeminiSchema(s: JsonSchema): Record<string, unknown> {
  switch (s.type) {
    case "object":
      return {
        type: "OBJECT",
        properties: Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)])),
        required: s.required,
      };
    case "array":
      return { type: "ARRAY", items: toGeminiSchema(s.items) };
    case "string":
      return s.enum ? { type: "STRING", enum: s.enum } : { type: "STRING" };
    default:
      return { type: s.type.toUpperCase() };
  }
}

// One retry after a short pause when Google is busy (503) or briefly rate limited (429).
async function withRetry(call: () => Promise<Response>, signal?: AbortSignal): Promise<Response> {
  const res = await call();
  if ((res.status !== 503 && res.status !== 429) || signal?.aborted) return res;
  await new Promise((r) => setTimeout(r, 1500));
  return call();
}

export function createGemini(apiKey: string, model: string): AIProvider {
  return {
    id: `gemini/${model}`,
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, signal }: JsonRequest) {
      const res = await withRetry(() => fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens,
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(schema),
          },
        }),
      }), signal);
      if (!res.ok) throw new Error(`Gemini request failed with status ${res.status}`);
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      try {
        return JSON.parse(text);
      } catch {
        return null; // malformed output is refused by the caller
      }
    },
  };
}
