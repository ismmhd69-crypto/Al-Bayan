// OpenRouter adapter: no network, fetch is stubbed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createOpenRouter } from "@/lib/ai/openrouter";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { createRateLimiter } from "@/lib/ai/limits";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, dependencies, audit } from "./fixtures/rich";

const schema = { type: "object" as const, properties: {}, required: [] };
const reply = (content: string, extra: object = {}, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }], ...extra }), { status });
const free = () => createRateLimiter(1000, 100_000);
const KEY = "sk-or-test-secret-1234";
const make = (model = "m", limiter = free()) => createOpenRouter(KEY, model, limiter);
const run = (m = make()) => m.generateJson({ system: "s", prompt: "p", schema });

const saved = { ...process.env };
beforeEach(() => { delete process.env.ASK_DEBUG; delete process.env.OPENROUTER_STRUCTURED_OUTPUTS; });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...saved };
});

describe("createOpenRouter", () => {
  it.each([false, true])("partitions a wide Haiku audit without dropping fields or accepting partial checks (bad=%s)", async bad => {
    const properties = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`check_${i}`, { type: "boolean" as const }]));
    const requested: string[] = [];
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const names = Object.keys(body.response_format.json_schema.schema.properties);
      expect(names.length).toBeLessThanOrEqual(4);
      expect(body.provider).toMatchObject({ data_collection: "deny", zdr: true, require_parameters: true });
      expect(body.messages[1].content).toBe("unchanged originals and context");
      requested.push(...names);
      return reply(JSON.stringify(Object.fromEntries(names.map(name => [name, bad && name === "check_4" ? "not a verdict" : true]))));
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await make("anthropic/claude-haiku-5.5").generateJson({ system: "full review rules", prompt: "unchanged originals and context", structuredOutput: true,
      schema: { type: "object", properties, required: Object.keys(properties) } });
    if (bad) { expect(result).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(2); }
    else { expect(result).toEqual(Object.fromEntries(Object.keys(properties).map(k => [k, true]))); expect(requested).toEqual(Object.keys(properties)); }
  });
  it.each(['{"checks":[]}', '{"checks":[{"anchor":"C1E1","quote":"oversized"}]}'])
  ("uses Claude's supported schema shape but retains local evidence count and length limits: %s", async content => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(JSON.stringify(body.response_format.json_schema.schema)).not.toMatch(/maxItems|maxLength/);
      expect(body.response_format.json_schema.schema.properties.checks.items.properties.anchor.enum).toEqual(["C1E1"]);
      expect(body.provider).toMatchObject({ data_collection: "deny", zdr: true, require_parameters: true });
      expect(body.messages[0].content).toContain('"maxItems":0');
      return reply(content);
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await make("anthropic/claude-haiku-5.5").generateJson({ system: "s", prompt: "p", structuredOutput: true,
      schema: { type: "object", properties: { checks: { type: "array", maxItems: 0, items: { type: "object",
        properties: { anchor: { type: "string", enum: ["C1E1"] }, quote: { type: "string", maxLength: 3 } }, required: ["anchor", "quote"] } } }, required: ["checks"] } });
    expect(result).toEqual(content === '{"checks":[]}' ? { checks: [] } : null);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it.each([false, true])("routes Haiku with supported parameters and unchanged privacy (strict=%s)", async strict => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("anthropic/claude-haiku-5.5");
      expect(body.reasoning).toEqual({ effort: "medium", exclude: true });
      expect(body).not.toHaveProperty("temperature");
      expect(body.provider).toMatchObject({ data_collection: "deny", zdr: true });
      if (strict) {
        expect(body.provider.require_parameters).toBe(true);
        expect(body.response_format.type).toBe("json_schema");
      }
      return reply("{}");
    });
    delete process.env.OPENROUTER_PRIVACY;
    vi.stubGlobal("fetch", fetcher);
    expect(await make("anthropic/claude-haiku-5.5").generateJson({ system: "s", prompt: "p", schema, structuredOutput: strict })).toEqual({});
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("uses Google's bounded-output shape without accepting locally oversized results", async () => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(JSON.stringify(body.response_format.json_schema.schema)).not.toMatch(/maxItems|maxLength/);
      expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
      return reply('{"rows":["oversized"]}');
    });
    vi.stubGlobal("fetch", fetcher);
    expect(await make("google/scripted").generateJson({ system: "s", prompt: "p", structuredOutput: true,
      schema: { type: "object", properties: { rows: { type: "array", maxItems: 1, items: { type: "string", maxLength: 3 } } }, required: ["rows"] } })).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("does not exclude the recorded schema-capable Vertex routes with an unsupported optional temperature", async () => {
    // Read-only endpoint metadata on 2026-10-22: Google Vertex supports these
    // generation parameters, but not temperature. This is a routing fixture,
    // not a live model result or proof of account-specific endpoint eligibility.
    const supported = new Set(["reasoning", "include_reasoning", "max_tokens", "seed", "response_format", "stop", "structured_outputs", "tools", "tool_choice", "reasoning_effort"]);
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const generation = Object.keys(body).filter(key => !["model", "messages", "stream", "provider"].includes(key));
      if (body.provider.require_parameters && generation.some(key => !supported.has(key)))
        return new Response(JSON.stringify({ error: { code: 404, message: "No endpoints found supporting all requested parameters" } }), { status: 404 });
      expect(body.provider).toMatchObject({ data_collection: "deny", zdr: true, require_parameters: true });
      expect(body.response_format.type).toBe("json_schema");
      return reply('{"ok":true}');
    });
    vi.stubGlobal("fetch", fetcher);
    expect(await make().generateJson({ system: "s", prompt: "p", structuredOutput: true,
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] } })).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("enforces a request-specific writing schema even when the global preview is off", async () => {
    vi.stubEnv("OPENROUTER_STRUCTURED_OUTPUTS", "false");
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.response_format.type).toBe("json_schema");
      expect(body.response_format.json_schema.strict).toBe(true);
      expect(body.provider.require_parameters).toBe(true);
      expect(body).not.toHaveProperty("temperature");
      return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: '{"wrong":true}' } }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetcher);
    const provider = createOpenRouter("fake-key", "test-model", free());
    expect(await provider.generateJson({ system: "s", prompt: "p", schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] }, structuredOutput: true })).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("requests strict shape support without dropping privacy and validates the returned shape", async () => {
    process.env.OPENROUTER_STRUCTURED_OUTPUTS = "true";
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { bodies.push(JSON.parse(String(init.body))); return reply("{}"); }));
    expect(await run()).toEqual({});
    expect(bodies[0].provider).toEqual({ data_collection: "deny", zdr: true, require_parameters: true });
    expect(bodies[0]).not.toHaveProperty("temperature");
    expect(bodies[0].response_format).toEqual({ type: "json_schema", json_schema: { name: "bayan_response", strict: true,
      schema: { type: "object", properties: {}, required: [], additionalProperties: false } } });
  });

  it("does not downgrade or retry strict schema mode after a 400", async () => {
    process.env.OPENROUTER_STRUCTURED_OUTPUTS = "true";
    const fetcher = vi.fn(async () => new Response("", { status: 400 })); vi.stubGlobal("fetch", fetcher);
    await expect(run()).rejects.toThrow("status 400"); expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each(['{"extra":true}', 'Here: {}', '{"extra":', '```json\n{}\n```'])
  ("refuses invalid strict output without another model call %#", async content => {
    process.env.OPENROUTER_STRUCTURED_OUTPUTS = "true";
    const fetcher = vi.fn(async () => reply(content)); vi.stubGlobal("fetch", fetcher);
    expect(await run()).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid declared schema before transport", async () => {
    process.env.OPENROUTER_STRUCTURED_OUTPUTS = "true";
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(make().generateJson({ system: "s", prompt: "p", schema: { ...schema, required: ["missing"] } })).rejects.toThrow("structured_schema_invalid");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("carries actual rich writer and checker contracts through strict transport without paid calls", async () => {
    process.env.OPENROUTER_STRUCTURED_OUTPUTS = "true";
    const deps = dependencies(), scriptedWrite = deps.writer.generateJson;
    const routes: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)); routes.push(body.model);
      expect(body.response_format.type).toBe("json_schema");
      expect(body.provider.require_parameters).toBe(true);
      const [system, user] = body.messages;
      const value = body.model === "scripted-writer"
        ? { ...await scriptedWrite({ system: system.content, prompt: user.content, schema }) as object, no_answer_feedback: [] }
        : audit(user.content);
      if (body.model === "scripted-checker") {
        const record = value as Record<string, unknown>;
        const request = JSON.parse(user.content);
        record.citation_checks = Object.fromEntries((record.citation_checks as any[]).map(row => [row.claim_id, { ...row,
          clauses: row.clauses.map((clause: any) => ({ ...clause, evidence: clause.evidence.map((e: any) => ({ anchor_id:
            request.claim_evidence.find((b: any) => b.claim_id === row.claim_id).excerpt_choices.find((a: any) => a.source_id === e.source_id).anchor_id })) })) }]));
        record.contribution_map = Object.fromEntries((record.contribution_map as { claim_id: string }[]).map(row => [row.claim_id, row]));
        record.attribution_checks = Object.fromEntries((record.attribution_checks as { claim_id: string }[]).map(row => [row.claim_id, row]));
        if (!request.full_answer) for (const key of ["requirement_coverage", "question_checklist_complete", "guidance_safe", "guidance_relevant",
          "complete_coverage", "listed_items_complete", "direct_summary"]) delete record[key];
      }
      if (body.model === "scripted-checker" && JSON.parse(user.content).full_answer) {
        const record = value as Record<string, unknown>;
        record.requirement_coverage = Object.fromEntries((record.requirement_coverage as { requirement_id: string; source_ids: string[] }[]).map(({ source_ids: _sources, ...row }) => [row.requirement_id, row]));
      }
      // The old scripted fixture always adds guidance, including source-only jobs.
      // This strict-response fixture follows the actual requested contract instead.
      if (body.model === "scripted-writer" && !JSON.parse(user.content).sections_to_write.includes("summary")) delete (value as Record<string, unknown>).next_step;
      else if (body.model === "scripted-writer") (value as Record<string, unknown>).next_step = [(value as Record<string, unknown>).next_step];
      return reply(JSON.stringify(value));
    }));
    deps.writer = make("scripted-writer"); deps.verifier = make("scripted-checker");
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Invented care question", {})).status).toBe("rich_answer");
    expect(routes.filter(r => r === "scripted-writer")).toHaveLength(3);
    expect(routes.filter(r => r === "scripted-checker")).toHaveLength(3);
  });

  it("keeps strict privacy and output checks without sending unsupported reasoning to the pinned non-reasoning backup", async () => {
    const bodies: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init.body)); bodies.push(body);
      if (body.reasoning && body.provider.require_parameters) return reply("", { error: { code: 404 } }, 404);
      return reply('{"ok":true}');
    }));
    const provider = make("mistralai/mistral-small-3.2-24b-instruct");
    expect(await provider.generateJson({ system: "s", prompt: "p", structuredOutput: true,
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] } })).toEqual({ ok: true });
    expect(bodies).toHaveLength(1); expect(bodies[0].reasoning).toBeUndefined();
    expect(bodies[0].provider).toMatchObject({ zdr: true, data_collection: "deny", require_parameters: true });
    expect(bodies[0].response_format.type).toBe("json_schema");
  });

  it("records cut-off reply cost before falling through to the existing chain", async () => {
    process.env.ASK_DEBUG = "true";
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return bodies.length === 1
        ? new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: '{"assessments":[{"source_id":"Q2:1"},' } }], usage: { cost: 0.001 } }))
        : reply('{"ok":true}', { usage: { cost: 0.002 } });
    }));
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
    expect(bodies.map((b) => b.max_tokens)).toEqual([2048]);
    expect(info.mock.calls.filter(([message]) => String(message).startsWith("ai cost:"))).toHaveLength(1);
  });
  it("never accepts nested objects from a cut-off response", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: '{"assessments":[{"source_id":"Q2:1"},' } }] })));
    vi.stubGlobal("fetch", fetcher);
    await expect(run()).rejects.toBeInstanceOf(GoogleBusyError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("reads JSON with reasoning text or a think block around it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply('<think>hmm {"a":0}</think>Here: {"ok":true}')));
    expect(await run()).toEqual({ ok: true });
  });

  it("returns null for malformed output (the caller refuses)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply('{"broken": ')));
    expect(await run()).toBeNull();
  });

  it("sends the privacy preferences, low reasoning effort and the key only as a header", async () => {
    let init: RequestInit = {};
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { init = i; return reply("{}"); }));
    await run();
    const body = JSON.parse(String(init.body));
    expect(body.provider).toEqual({ data_collection: "deny", zdr: true });
    // Low effort is the default: Gemini 3.5 Flash-Lite refuses "reasoning off" with a 400.
    expect(body.reasoning).toEqual({ effort: "low", exclude: true });
    expect(body.temperature).toBe(0);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(String(init.body)).not.toContain(KEY);
  });

  it("uses DeepSeek's supported reasoning effort without weakening strict output or privacy", async () => {
    let sent: any;
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { sent = JSON.parse(String(i.body)); return reply("{}"); }));
    vi.stubEnv("OPENROUTER_PRIVACY", "zdr");
    await createOpenRouter(KEY, "deepseek/deepseek-v4-flash", free()).generateJson({ system: "s", prompt: "p", schema, structuredOutput: true });
    expect(sent.reasoning).toEqual({ effort: "high", exclude: true });
    expect(sent.provider).toMatchObject({ data_collection: "deny", zdr: true, require_parameters: true });
    expect(sent.response_format.type).toBe("json_schema");
    expect(sent.response_format.json_schema.strict).toBe(true);
  });

  it("honours OPENROUTER_PRIVACY and OPENROUTER_REASONING", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { bodies.push(JSON.parse(String(i.body))); return reply("{}"); }));
    process.env.OPENROUTER_PRIVACY = "deny";
    process.env.OPENROUTER_REASONING = "low";
    await run();
    process.env.OPENROUTER_REASONING = "default";
    await run();
    process.env.OPENROUTER_REASONING = "off";
    await run();
    expect(bodies[0].provider).toEqual({ data_collection: "deny" });
    expect(bodies[0].reasoning).toEqual({ effort: "low", exclude: true });
    expect(bodies[1].reasoning).toBeUndefined();
    expect(bodies[2].reasoning).toEqual({ enabled: false, exclude: true });
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
  it("uses the configured backup only for an explicit already-budgeted malformed-response correction", async () => {
    const { getProvider } = await import("@/lib/ai");
    setEnv("openrouter:primary/test,openrouter:backup/test", "openrouter:checker/test");
    const models: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      const model = JSON.parse(String(init.body)).model; models.push(model);
      return reply(model === "primary/test" ? '{"broken": - }' : '{"ok":true}');
    }));
    const provider = getProvider();
    expect(await provider.generateJson({ system: "s", prompt: "p", schema })).toBeNull();
    expect(await provider.generateJson({ system: "s", prompt: "p", schema, malformedResponseRetry: true })).toEqual({ ok: true });
    expect(models).toEqual(["primary/test", "backup/test"]);
  });

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

// The owner's current Haiku defaults when the key exists, direct Gemini otherwise.
describe("default model chains", () => {
  const chains = async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const { getProvider, getVerifier } = await import("@/lib/ai");
    return { writer: getProvider().id, checker: getVerifier().id };
  };
  const clear = () => {
    for (const k of ["AI_MODELS", "AI_VERIFIER_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", "AI_PROVIDER", "VERTEX_API_KEY"]) delete process.env[k];
  };

  it("uses the owner's restored Luna writer and checker choices when OPENROUTER_API_KEY is set", async () => {
    clear();
    process.env.OPENROUTER_API_KEY = KEY;
    process.env.GEMINI_API_KEY = "g";
    const { writer, checker } = await chains();
    expect(writer.startsWith("openrouter/openai/gpt-6-luna")).toBe(true);
    expect(writer).toContain("openrouter/google/gemini-3.8-flash");
    expect(checker.startsWith("openrouter/openai/gpt-6-luna")).toBe(true);
    expect(checker).toContain("openrouter/mistralai/mistral-small-3.2-24b-instruct");
  });

  it("falls back to the direct Gemini defaults without an OpenRouter key", async () => {
    clear();
    delete process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = "g";
    const { writer, checker } = await chains();
    expect(writer).toBe("gemini/gemini-3.7-flash");
    expect(checker).toBe("gemini/gemini-3.1-flash-lite");
  });

  it("an explicit AI_MODELS still wins over the OpenRouter default", async () => {
    clear();
    process.env.OPENROUTER_API_KEY = KEY;
    process.env.GEMINI_API_KEY = "g";
    process.env.AI_MODELS = "gemini-3.5-flash-lite";
    const { writer } = await chains();
    expect(writer).toBe("gemini/gemini-3.5-flash-lite");
  });
});
