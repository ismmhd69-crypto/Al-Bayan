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

describe("Gemini busy handling and output caps (2026-11-12)", () => {
  const schema = { type: "object" as const, properties: {}, required: [] };
  const ok = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{}" }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } }), { status: 200 });
  it("keeps a hard output cap exactly, while ordinary large steps still get more room", async () => {
    const sent: number[] = [];
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => { sent.push(JSON.parse(String(init.body)).generationConfig.maxOutputTokens); return ok(); });
    await createGemini("test", "test-model").generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 9000, hardOutputCap: true });
    await createGemini("test", "test-model").generateJson({ system: "s", prompt: "p", schema, maxOutputTokens: 9000 });
    expect(sent).toEqual([9000, 16000]);
  });
  it("in a guarded research session, waits and retries the same door twice before reporting busy", async () => {
    vi.useFakeTimers();
    const { withModelTransport } = await import("@/lib/ai/transport");
    const send = vi.fn(async () => new Response("", { status: 429 }));
    const job = withModelTransport(send, () => createGemini("test", "test-model", "vertex").generateJson({ system: "s", prompt: "p", schema }));
    const settled = job.then(() => "answered", (error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(7_500);
    expect(await settled).toMatch(/busy \(429\)/); expect(send).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
  it("stops waiting at once when the visitor stops the answer", async () => {
    vi.useFakeTimers();
    const { withModelTransport } = await import("@/lib/ai/transport");
    const send = vi.fn(async () => new Response("", { status: 429 })), stop = new AbortController();
    const job = withModelTransport(send, () => createGemini("test", "test-model", "vertex").generateJson({ system: "s", prompt: "p", schema, signal: stop.signal }));
    const settled = job.then(() => "answered", () => "stopped");
    await vi.advanceTimersByTimeAsync(500); stop.abort(new Error("answer_stopped"));
    expect(await settled).toBe("stopped"); expect(send).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
