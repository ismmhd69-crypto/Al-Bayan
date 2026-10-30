import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getProvider, getVerifier } from "@/lib/ai";

const schema = { type: "object" as const, properties: {}, required: [] };
let sent: { maxOutputTokens?: number; thinkingConfig?: { thinkingLevel?: string } }[] = [];
beforeEach(() => {
  sent = [];
  vi.stubEnv("VERTEX_API_KEY", "test-only");
  vi.stubEnv("OPENROUTER_API_KEY", "");
  vi.stubEnv("AI_MODELS", "vertex:gemini-3.1-flash-lite");
  vi.stubEnv("AI_VERIFIER_MODELS", "vertex:gemini-3.1-flash-lite");
  vi.stubEnv("AI_VERIFIER_THINKING_LEVEL", "high");
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)).generationConfig);
    return Response.json({ candidates: [{ content: { parts: [{ text: "{}" }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } });
  }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("gives high thinking only to the checker's large steps", async () => {
  const verifier = getVerifier();
  await verifier.generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 9000, thinking: "low" });
  expect(sent[0].thinkingConfig?.thinkingLevel).toBe("high");
  await verifier.generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 1600, thinking: "low" });
  expect(sent[1].thinkingConfig?.thinkingLevel).toBe("low");
});
it("leaves the writer at its own per-step level", async () => {
  await getProvider().generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 6600, thinking: "low" });
  expect(sent[0].thinkingConfig?.thinkingLevel).toBe("low");
});
it("changes nothing when the setting is absent", async () => {
  vi.stubEnv("AI_VERIFIER_THINKING_LEVEL", "");
  await getVerifier().generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 9000, thinking: "low" });
  expect(sent[0].thinkingConfig?.thinkingLevel).toBe("low");
});
it("gives Gemini steps more room, always as a number the spending guard can reserve", async () => {
  const verifier = getVerifier();
  for (const maxOutputTokens of [1600, 2000, 6600, 9000, 10000, 20000]) await verifier.generateJson({ system: "s", prompt: "p", schema, maxOutputTokens });
  expect(sent.map(c => c.maxOutputTokens)).toEqual([4000, 4000, 6600, 16000, 16000, 20000]);
});
