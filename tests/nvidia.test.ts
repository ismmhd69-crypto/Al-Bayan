// NVIDIA adapter, request limits, model chains and the Ask deadline setting. No network: fetch is stubbed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createNvidia, extractJsonObject } from "@/lib/ai/nvidia";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { createRateLimiter, waitForSlot } from "@/lib/ai/limits";

const schema = { type: "object" as const, properties: {}, required: [] };
const reply = (content: string, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
const free = () => createRateLimiter(1000, 100_000);

const saved = { ...process.env };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  process.env = { ...saved };
});

describe("extractJsonObject", () => {
  it("reads JSON with text, code fences or thinking around it", () => {
    expect(extractJsonObject('Sure! Here it is:\n```json\n{"a":1}\n```\nDone.')).toEqual({ a: 1 });
    expect(extractJsonObject('<think>maybe {"a":2}</think>{"a":3}')).toEqual({ a: 3 });
    expect(extractJsonObject('{"text":"a } inside a string","b":{"c":[1,2]}} trailing {"x":1}')).toEqual({ text: "a } inside a string", b: { c: [1, 2] } });
  });
  it("returns null for malformed or missing JSON", () => {
    expect(extractJsonObject('{"a": 1,')).toBeNull();
    expect(extractJsonObject("no json here")).toBeNull();
    expect(extractJsonObject("<think>unfinished {\"a\":1}")).toBeNull();
    expect(extractJsonObject("[1,2,3]")).toBeNull();
  });
});

describe("createNvidia", () => {
  beforeEach(() => { delete process.env.ASK_DEBUG; });

  it("returns the parsed object and asks gpt-oss for low reasoning by default", async () => {
    let body: Record<string, unknown> = {};
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { body = JSON.parse(String(init.body)); return reply('ok {"ok":true}'); }));
    expect(await createNvidia("k", "openai/gpt-oss-20b", free()).generateJson({ system: "s", prompt: "p", schema })).toEqual({ ok: true });
    expect(body.reasoning_effort).toBe("low");
    expect(body.temperature).toBe(0);
  });

  it("turns Nemotron thinking off only when NVIDIA_REASONING=off", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { bodies.push(JSON.parse(String(init.body))); return reply("{}"); }));
    const m = createNvidia("k", "nvidia/nemotron-3-super-120b-a12b", free());
    await m.generateJson({ system: "s", prompt: "p", schema });
    process.env.NVIDIA_REASONING = "off";
    await m.generateJson({ system: "s", prompt: "p", schema });
    expect(bodies[0].chat_template_kwargs).toBeUndefined();
    expect(bodies[1].chat_template_kwargs).toEqual({ enable_thinking: false });
  });

  it("returns null for malformed output (the caller refuses)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply('{"broken": ')));
    expect(await createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema })).toBeNull();
  });

  it("retries once on 503 and succeeds", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(reply('{"a":1}'));
    vi.stubGlobal("fetch", fetcher);
    expect(await createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema })).toEqual({ a: 1 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("counts 429 twice in a row as busy", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 429 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema })).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("counts 404 as unavailable (busy) without retrying, and a 400 as a real error", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema })).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 400 })));
    const err = await createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(GoogleBusyError);
  });

  it("counts its own timeout as busy", async () => {
    process.env.NVIDIA_TIMEOUT_MS = "30";
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal!.addEventListener("abort", () => reject(Object.assign(new Error("t"), { name: "TimeoutError" })));
    })));
    await expect(createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema })).rejects.toBeInstanceOf(GoogleBusyError);
  });

  it("does not turn the caller's own cancel into busy", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => {
      const fail = () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      if (init.signal!.aborted) fail();
      init.signal!.addEventListener("abort", fail);
    })));
    const pending = createNvidia("k", "m", free()).generateJson({ system: "s", prompt: "p", schema, signal: controller.signal });
    controller.abort();
    const err = await pending.catch((e) => e);
    expect(err).not.toBeInstanceOf(GoogleBusyError);
  });

  it("is busy without calling NVIDIA when the local limit is full", async () => {
    const fetcher = vi.fn(async () => reply("{}"));
    vi.stubGlobal("fetch", fetcher);
    const limiter = createRateLimiter(0, 10);
    await expect(createNvidia("k", "m", limiter).generateJson({ system: "s", prompt: "p", schema })).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("rate limiter", () => {
  it("allows N a minute per model, then frees slots after a minute", () => {
    const l = createRateLimiter(2, 100);
    expect(l.take("a", 0)).toBe(true);
    expect(l.take("a", 1)).toBe(true);
    expect(l.take("a", 2)).toBe(false);
    expect(l.take("b", 2)).toBe(true); // separate per model
    expect(l.take("a", 60_001)).toBe(true);
  });
  it("stops at the daily cap until the next UTC day", () => {
    const l = createRateLimiter(100, 2);
    const day = Date.UTC(2026, 9, 2, 10);
    expect(l.take("a", day)).toBe(true);
    expect(l.take("a", day + 120_000)).toBe(true);
    expect(l.take("a", day + 240_000)).toBe(false);
    expect(l.take("a", Date.UTC(2026, 9, 3, 0, 1))).toBe(true);
  });
  it("waitForSlot gives up after the wait", async () => {
    expect(await waitForSlot(createRateLimiter(0, 1), "a", 50)).toBe(false);
    expect(await waitForSlot(createRateLimiter(1, 1), "a", 50)).toBe(true);
  });
});

describe("model chains (lib/ai/index.ts)", () => {
  const setEnv = (writer: string, verifier: string) => {
    process.env.NVIDIA_API_KEY = "k";
    process.env.GEMINI_API_KEY = "g";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODELS = writer;
    process.env.AI_VERIFIER_MODELS = verifier;
  };

  it("refuses a checker chain that shares a model with the writer chain", async () => {
    setEnv("nvidia:openai/gpt-oss-20b,gemini-3.7-flash", "nvidia:nvidia/nemotron-3-super-120b-a12b,gemini-3.7-flash");
    const { getVerifier } = await import("@/lib/ai");
    expect(() => getVerifier()).toThrow(/different model/);
  });

  it("moves to the next model on busy and reports who answered, and stops on a real error", async () => {
    setEnv("nvidia:openai/gpt-oss-20b,gemini-3.7-flash", "nvidia:nvidia/nemotron-3-super-120b-a12b,gemini-3.1-flash-lite");
    const { getProvider, getVerifier } = await import("@/lib/ai");
    expect(getVerifier().id).toContain("nemotron");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("nvidia")
      ? new Response("", { status: 404 })
      : new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"from":"gemini"}' }] } }] }), { status: 200 }))));
    expect(await getProvider().generateJson({ system: "s", prompt: "p", schema })).toEqual({ from: "gemini" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 400 })));
    await expect(getProvider().generateJson({ system: "s", prompt: "p", schema })).rejects.not.toBeInstanceOf(GoogleBusyError);
  });
});

describe("Ask deadline setting", () => {
  it("defaults to 50 s and stays between 10 s and 55 s", async () => {
    const { askDeadlineMs } = await import("@/lib/ask/settings");
    expect(askDeadlineMs(undefined)).toBe(50_000);
    expect(askDeadlineMs("abc")).toBe(50_000);
    expect(askDeadlineMs("40000")).toBe(40_000);
    expect(askDeadlineMs("90000")).toBe(55_000);
    expect(askDeadlineMs("1000")).toBe(10_000);
  });
});
