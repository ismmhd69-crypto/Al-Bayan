// OpenRouter adapter: no network, fetch is stubbed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createOpenRouter } from "@/lib/ai/openrouter";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { createRateLimiter } from "@/lib/ai/limits";

const schema = { type: "object" as const, properties: {}, required: [] };
const reply = (content: string, extra: object = {}, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }], ...extra }), { status });
const free = () => createRateLimiter(1000, 100_000);
const KEY = "sk-or-test-secret-1234";
const make = (model = "m", limiter = free()) => createOpenRouter(KEY, model, limiter);
const run = (m = make()) => m.generateJson({ system: "s", prompt: "p", schema });

const saved = { ...process.env };
beforeEach(() => { delete process.env.ASK_DEBUG; });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...saved };
});

describe("createOpenRouter", () => {
  it("reads JSON with reasoning text or a think block around it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply('<think>hmm {"a":0}</think>Here: {"ok":true}')));
    expect(await run()).toEqual({ ok: true });
  });

  it("returns null for malformed output (the caller refuses)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply('{"broken": ')));
    expect(await run()).toBeNull();
  });

  it("sends the privacy preferences, reasoning off and the key only as a header", async () => {
    let init: RequestInit = {};
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { init = i; return reply("{}"); }));
    await run();
    const body = JSON.parse(String(init.body));
    expect(body.provider).toEqual({ data_collection: "deny", zdr: true });
    expect(body.reasoning).toEqual({ enabled: false, exclude: true });
    expect(body.temperature).toBe(0);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(String(init.body)).not.toContain(KEY);
  });

  it("honours OPENROUTER_PRIVACY and OPENROUTER_REASONING", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { bodies.push(JSON.parse(String(i.body))); return reply("{}"); }));
    process.env.OPENROUTER_PRIVACY = "deny";
    process.env.OPENROUTER_REASONING = "low";
    await run();
    process.env.OPENROUTER_REASONING = "default";
    await run();
    expect(bodies[0].provider).toEqual({ data_collection: "deny" });
    expect(bodies[0].reasoning).toEqual({ effort: "low", exclude: true });
    expect(bodies[1].reasoning).toBeUndefined();
  });

  it("adds a provider sort only for a known OPENROUTER_SORT value", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { bodies.push(JSON.parse(String(i.body))); return reply("{}"); }));
    process.env.OPENROUTER_SORT = "throughput";
    await run();
    process.env.OPENROUTER_SORT = "bogus";
    await run();
    expect(bodies[0].provider).toEqual({ data_collection: "deny", zdr: true, sort: "throughput" });
    expect(bodies[1].provider).toEqual({ data_collection: "deny", zdr: true });
  });

  it("retries once on 503 and succeeds", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(reply('{"a":1}'));
    vi.stubGlobal("fetch", fetcher);
    expect(await run()).toEqual({ a: 1 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("counts 429 twice in a row as busy", async () => {
    const fetcher = vi.fn(async () => new Response("", { status: 429 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("counts 503 twice in a row as busy", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
  });

  it.each([401, 403, 404, 410])("counts %i as unavailable (busy) without retrying", async (status) => {
    const fetcher = vi.fn(async () => new Response("", { status }));
    vi.stubGlobal("fetch", fetcher);
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries once without JSON mode when a provider rejects it with a 400", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => {
      bodies.push(JSON.parse(String(i.body)));
      return bodies.length === 1 ? new Response("", { status: 400 }) : reply('{"a":1}');
    }));
    expect(await run()).toEqual({ a: 1 });
    expect(bodies[0].response_format).toBeDefined();
    expect(bodies[1].response_format).toBeUndefined();
  });

  it("treats a 400 as a real error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 400 })));
    const err = await run().catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(GoogleBusyError);
  });

  it("counts its own timeout as busy", async () => {
    process.env.OPENROUTER_TIMEOUT_MS = "30";
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal!.addEventListener("abort", () => reject(Object.assign(new Error("t"), { name: "TimeoutError" })));
    })));
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
  });

  it("does not turn the callers own cancel into busy", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => {
      const fail = () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      if (init.signal!.aborted) fail();
      init.signal!.addEventListener("abort", fail);
    })));
    const pending = make().generateJson({ system: "s", prompt: "p", schema, signal: controller.signal });
    controller.abort();
    expect(await pending.catch((e) => e)).not.toBeInstanceOf(GoogleBusyError);
  });

  it("is busy without calling OpenRouter when the local limit is full", async () => {
    const fetcher = vi.fn(async () => reply("{}"));
    vi.stubGlobal("fetch", fetcher);
    await expect(run(make("m", createRateLimiter(0, 10)))).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("logs the real cost (model and number only) and never the key, prompt or answer", async () => {
    process.env.ASK_DEBUG = "true";
    const lines: string[] = [];
    for (const k of ["info", "log", "warn", "error"] as const) vi.spyOn(console, k).mockImplementation((...a: unknown[]) => { lines.push(a.map(String).join(" ")); });
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(reply('{"secret":"ANSWER-TEXT"}', { usage: { cost: 0.00042 } })));
    await make("qwen/x").generateJson({ system: "s", prompt: "PROMPT-TEXT", schema });
    expect(lines).toContain("ai cost: openrouter/qwen/x 0.00042");
    const all = lines.join("\n");
    expect(all).not.toContain(KEY);
    expect(all).not.toContain("PROMPT-TEXT");
    expect(all).not.toContain("ANSWER-TEXT");
  });
});

describe("model chains with openrouter (lib/ai/index.ts)", () => {
  const setEnv = (writer: string, verifier: string) => {
    process.env.OPENROUTER_API_KEY = KEY;
    process.env.GEMINI_API_KEY = "g";
    process.env.AI_MODELS = writer;
    process.env.AI_VERIFIER_MODELS = verifier;
  };

  it("builds the chains and refuses a shared model", async () => {
    const { getProvider, getVerifier } = await import("@/lib/ai");
    setEnv("openrouter:qwen/qwen3-235b-a22b-2507,gemini-3.7-flash", "openrouter:mistralai/mistral-small-3.2-24b-instruct");
    expect(getProvider().id).toBe("openrouter/qwen/qwen3-235b-a22b-2507|fallback:gemini/gemini-3.7-flash");
    expect(getVerifier().id).toBe("openrouter/mistralai/mistral-small-3.2-24b-instruct");
    setEnv("openrouter:qwen/qwen3-235b-a22b-2507", "openrouter:qwen/qwen3-235b-a22b-2507");
    expect(() => getVerifier()).toThrow(/different model/);
  });

  it("falls through to the next model when OpenRouter is unavailable, and skips it without a key", async () => {
    const { getProvider } = await import("@/lib/ai");
    setEnv("openrouter:qwen/x,gemini-3.7-flash", "openrouter:m/y");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("openrouter")
      ? new Response("", { status: 404 })
      : new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"from":"gemini"}' }] } }] }), { status: 200 }))));
    expect(await getProvider().generateJson({ system: "s", prompt: "p", schema })).toEqual({ from: "gemini" });
    delete process.env.OPENROUTER_API_KEY;
    expect(getProvider().id).toBe("gemini/gemini-3.7-flash");
  });
});
