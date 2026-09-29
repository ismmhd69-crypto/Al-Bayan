import { afterEach, describe, expect, it, vi } from "vitest";
import { createGemini } from "@/lib/ai/gemini";

vi.mock("server-only", () => ({}));

afterEach(() => vi.unstubAllGlobals());

describe("Gemini output stability", () => {
  it("requests deterministic temperature for every JSON step", async () => {
    const holder: { sent?: { generationConfig: { temperature: number } } } = {};
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      holder.sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }), { status: 200 });
    });
    await createGemini("test", "test-model").generateJson({ system: "Test", prompt: "Test",
      schema: { type: "object", properties: {}, required: [] } });
    expect(holder.sent?.generationConfig.temperature).toBe(0);
  });
});
