import "server-only";
import type { AIProvider, JsonRequest, JsonSchema } from "./types";

// Google Gemini over plain HTTPS, through one of two doors with the same request format:
// - "gemini": the Gemini API (generativelanguage.googleapis.com), key from AI Studio.
// - "vertex": Vertex AI / Agent Platform (aiplatform.googleapis.com), Google Cloud business terms,
//   separate capacity, processed in the EU (europe-west4 seen 2026-09-28). Key bound to a service
//   account with the Vertex AI User role.
const ENDPOINTS = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  vertex: "https://aiplatform.googleapis.com/v1/publishers/google/models",
} as const;
// One call may take up to 45 s; the whole answer is still bounded by the 50 s pipeline deadline.
const TIMEOUT_MS = 45_000;

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

// A couple of spaced retries absorb short Gemini capacity bursts without weakening
// the fail-closed caller checks.
async function withRetry(call: () => Promise<Response>, signal?: AbortSignal): Promise<Response> {
  let res = await call();
  // One short retry: the model chain (lib/ai/index.ts) moves to the next model instead of waiting here.
  const delays = [1500];
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if ((res.status !== 503 && res.status !== 429) || signal?.aborted) return res;
    if (process.env.ASK_DEBUG === "true") console.info(`gemini busy (${res.status}), retrying in ${delays[attempt]}ms`);
    await new Promise((r) => setTimeout(r, delays[attempt]));
    res = await call();
  }
  return res;
}

/** Google said "busy", "slow down" or "no access" on this door, so another door may still work. */
export class GoogleBusyError extends Error {}

export function createGemini(apiKey: string, model: string, door: keyof typeof ENDPOINTS = "gemini"): AIProvider {
  const ENDPOINT = ENDPOINTS[door];
  return {
    id: `${door}/${model}`,
    async generateJson({ system, prompt, schema, maxOutputTokens = 2048, thinking, signal }: JsonRequest) {
      const res = await withRetry(() => fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens,
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(schema),
            ...(thinking ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
          },
        }),
      }), signal);
      if (res.status === 503 || res.status === 429) throw new GoogleBusyError(`${door} busy (${res.status})`);
      // Access problems on this door (billing switched off, key or permission removed): another
      // door with its own key may still work, so the caller may switch like for "busy".
      if (res.status === 401 || res.status === 403) throw new GoogleBusyError(`${door} unavailable (${res.status})`);
      if (!res.ok) throw new Error(`${door} request failed with status ${res.status}`);
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
