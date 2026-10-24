import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runNextResearchJob, type ResearchWorkerDeps } from "@/lib/ask/search-engine/job-worker";
import { ResearchStorageError } from "@/lib/ask/search-engine/job-store";
import type { ModelAttempt, ModelAttemptStore } from "@/lib/ask/search-engine/transport-journal";
import type { RichEvent } from "@/lib/ask/rich-answer";
import { modelFetch } from "@/lib/ai/transport";
import { richAnswer, sections } from "./fixtures/rich";
import { askDeadlineMs } from "@/lib/ask/settings";
import { withResearchRuntime } from "@/lib/ask/research-runtime";
import { askTimeout } from "@/lib/ask/timing";
import { researchEngineRevision } from "@/lib/ask/search-engine/job-policy";

const id = "00000000-0000-4000-8000-000000000001", revision = "f".repeat(64);
function setup(seed: RichEvent[] = []) {
  const events = [...seed], attempts = new Map<string, ModelAttempt>();
  let ended = false;
  const lease = { id, lease: "00000000-0000-4000-8000-000000000002", sequence: seed.length,
    request: { version: 1, question: "Explain care", lang: "en", previous_user_messages: [], engineRevision: revision }, expiresAt: "2027-01-01T00:00:00Z" };
  const store: ResearchWorkerDeps["store"] = {
    claim: vi.fn(async () => ended ? null : { ...lease, sequence: events.length }),
    pulse: vi.fn(async () => {}),
    hold: vi.fn(async () => { ended = true; }),
    history: vi.fn(async () => ({ id, state: "running" as const, language: "en" as const, sequence: events.length, events: events.map(e => ({ sequence: e.sequence, payload: e })), expiresAt: lease.expiresAt })),
    append: vi.fn(async (_, expected, payload, terminal) => {
      if (expected !== events.length) throw new ResearchStorageError("sequence_conflict");
      if (terminal && [...attempts.values()].some(a => a.state !== "settled")) throw new ResearchStorageError("reconciliation_required");
      events.push(payload as RichEvent); if (terminal) ended = true;
      return events.length;
    }),
    attempts: () => ({
      async startRun() { if ([...attempts.values()].some(a => a.state !== "settled")) throw new ResearchStorageError("reconciliation_required"); },
      async reserve(key) {
        const attempt = attempts.get(key);
        if (attempt) return { acquired: false, attempt };
        attempts.set(key, { state: "reserved" }); return { acquired: true };
      },
      async record(key, response, costUsd) {
        attempts.set(key, costUsd === null ? { state: "unsettled", response } : { state: "settled", response, costUsd });
      },
    } satisfies ModelAttemptStore),
  };
  const deps: ResearchWorkerDeps = { store, engineRevision: revision, durationMs: 60_000, maxAttemptCostUsd: 0.05,
    execute: vi.fn<ResearchWorkerDeps["execute"]>(async (_, callbacks) => { callbacks.onProgress?.("searching"); sections.forEach(s => callbacks.onSection?.(s)); return { status: "rich_answer", answer: richAnswer }; }) };
  return { deps, store, events, attempts };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("leased background research worker", () => {
  it("keeps a patient job alive past ten minutes while retaining heartbeats", async () => {
    vi.useFakeTimers();
    const { deps } = setup(), execute = deps.execute;
    deps.durationMs = Infinity;
    deps.execute = async (request, callbacks, signal) => {
      expect(askDeadlineMs()).toBe(Infinity);
      expect(askTimeout(signal, 6000, "scholar_transport")).toBe(signal);
      await vi.advanceTimersByTimeAsync(660001);
      expect(signal.aborted).toBe(false);
      return execute(request, callbacks, signal);
    };
    expect(await runNextResearchJob(deps)).toBe("complete");
    expect(deps.store.pulse).toHaveBeenCalled();
  });
  it("stores checked sections in order and completes only after the matching final answer", async () => {
    const { deps, events } = setup();
    expect(await runNextResearchJob(deps)).toBe("complete");
    expect(events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(events.filter(e => e.type === "section").map(e => e.section.group)).toEqual(["quran", "hadith", "scholar", "summary"]);
    expect(events.at(-1)).toMatchObject({ type: "terminal", result: { status: "rich_answer" } });
  });
  it("rechecks an earlier section after restart without delivering that section twice", async () => {
    const { deps, events } = setup([{ request_id: id, sequence: 1, type: "section", section: sections[0] }]);
    expect(await runNextResearchJob(deps)).toBe("complete");
    expect(events.filter(e => e.type === "section")).toHaveLength(4);
    expect(events.at(-1)?.type).toBe("terminal");
  });
  it("withdraws an earlier section if replay produces changed teaching", async () => {
    const { deps, events } = setup([{ request_id: id, sequence: 1, type: "section", section: sections[0] }]);
    deps.execute = async (_, callbacks) => {
      callbacks.onSection?.({ ...sections[0], claims: [{ ...sections[0].claims[0], text: "The Quran describes a changed explanation." }] });
      return { status: "rich_answer", answer: richAnswer };
    };
    expect(await runNextResearchJob(deps)).toBe("incomplete");
    expect(events.slice(1).map(e => e.type)).toEqual(["withdraw", "terminal"]);
    expect(events.at(-1)).toMatchObject({ result: { status: "incomplete", withdraw: true, sections: [] } });
  });
  it("does not execute a queued job under a changed engine revision", async () => {
    const { deps, events } = setup(); deps.engineRevision = "a".repeat(64);
    expect(await runNextResearchJob(deps)).toBe("incomplete");
    expect(deps.execute).not.toHaveBeenCalled(); expect(events.at(-1)?.type).toBe("terminal");
  });
  it("holds an uncertain paid attempt instead of returning a complete or retryable answer", async () => {
    const { deps, store, events } = setup();
    deps.send = vi.fn(async () => { throw new DOMException("timeout", "TimeoutError"); });
    deps.execute = async () => {
      try { await modelFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: "{}" }); } catch { /* Simulate the pipeline mapping a transport failure to an error result. */ }
      return { status: "error", language: "en" };
    };
    expect(await runNextResearchJob(deps)).toBe("held");
    expect(store.hold).toHaveBeenCalledOnce(); expect(deps.send).toHaveBeenCalledOnce(); expect(events).toHaveLength(0);
  });
  it("uses recorded model output after an interrupted worker without a second provider call", async () => {
    const { deps, events, store } = setup(); const stop = new AbortController(); deps.signal = stop.signal;
    deps.send = vi.fn(async () => new Response(JSON.stringify({ usage: { cost: 0.01 }, choices: [] })));
    const originalAppend = store.append;
    store.append = async (...args) => { const n = await originalAppend(...args); if ((args[2] as RichEvent).type === "section") stop.abort(); return n; };
    deps.execute = async (_, callbacks, signal) => {
      await modelFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: "{}" });
      callbacks.onSection?.(sections[0]);
      await new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
      return { status: "rich_answer", answer: richAnswer };
    };
    expect(await runNextResearchJob(deps)).toBe("interrupted"); expect(events).toHaveLength(1);
    store.append = originalAppend; deps.signal = undefined;
    deps.execute = async (_, callbacks) => {
      await modelFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: "{}" });
      sections.forEach(s => callbacks.onSection?.(s)); return { status: "rich_answer", answer: richAnswer };
    };
    expect(await runNextResearchJob(deps)).toBe("complete"); expect(deps.send).toHaveBeenCalledOnce();
    expect(events.filter(e => e.type === "section")).toHaveLength(4);
  });
  it("aborts work when Stop has revoked the database lease", async () => {
    vi.useFakeTimers(); const { deps, store, events } = setup();
    store.pulse = async () => { throw new ResearchStorageError("lease_lost"); };
    deps.execute = async (_, __, signal) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    const running = runNextResearchJob(deps); await vi.advanceTimersByTimeAsync(5001);
    expect(await running).toBe("lease_lost"); expect(events).toHaveLength(0);
  });
  it("does not accept a final answer whose sections were never independently delivered", async () => {
    const { deps, events } = setup(); deps.execute = async () => ({ status: "rich_answer", answer: richAnswer });
    expect(await runNextResearchJob(deps)).toBe("incomplete");
    expect(events.at(-1)).toMatchObject({ result: { status: "incomplete" } });
  });
  it("does not call a partial researched answer a source absence", async () => {
    const { deps, events } = setup(); deps.execute = async (_, callbacks) => {
      callbacks.onSection?.(sections[0]); return { status: "no_source", language: "en" };
    };
    expect(await runNextResearchJob(deps)).toBe("incomplete");
    expect(events.at(-1)).toMatchObject({ result: { status: "incomplete", language: "en", sections: [sections[0]] } });
  });
  it("ignores callbacks from work that continued after the worker was interrupted", async () => {
    const { deps, events } = setup(), stop = new AbortController(); deps.signal = stop.signal;
    let later: (() => void) | undefined;
    deps.execute = async (_, callbacks) => {
      later = () => callbacks.onSection?.(sections[0]); stop.abort(); return { status: "error", language: "en" };
    };
    expect(await runNextResearchJob(deps)).toBe("interrupted");
    later?.(); await Promise.resolve(); await Promise.resolve(); expect(events).toHaveLength(0);
  });
});

describe("separate research execution budget", () => {
  it("keeps the HTTP ceiling but allows a trusted worker its configured finite budget", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(askDeadlineMs("90000")).toBe(55_000);
    withResearchRuntime(180_000, () => {
      expect(askDeadlineMs()).toBeGreaterThan(179_000);
      expect(askDeadlineMs()).toBeLessThanOrEqual(180_000);
    });
    expect(askDeadlineMs("90000")).toBe(55_000);
  });
  it("does not disable a worker transport's stall timeout in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const signal = withResearchRuntime(1000, () => askTimeout(undefined, 5, "transport"));
    await new Promise(resolve => setTimeout(resolve, 20)); expect(signal.aborted).toBe(true);
  });
});

describe("research engine configuration fingerprint", () => {
  it("requires an actual build revision", () => {
    expect(() => researchEngineRevision({})).toThrow("research_build_revision_required");
  });
  it("changes with build, model and source configuration", () => {
    const env = { ASK_JOB_BUILD_REVISION: "a".repeat(40), AI_MODELS: "model-one", HADITH_SOURCE: "library" };
    const first = researchEngineRevision(env);
    expect(researchEngineRevision({ ...env, AI_MODELS: "model-two" })).not.toBe(first);
    expect(researchEngineRevision({ ...env, OPENROUTER_STRUCTURED_OUTPUTS: "true" })).not.toBe(first);
    expect(researchEngineRevision({ ...env, HADITH_SOURCE: "hadeethenc" })).not.toBe(first);
    expect(researchEngineRevision({ ...env, ASK_JOB_BUILD_REVISION: "b".repeat(40) })).not.toBe(first);
    expect(researchEngineRevision({ ...env, ASK_LOCAL_EMBEDDINGS: "true" })).not.toBe(first);
    expect(researchEngineRevision({ ...env, ASK_LOCAL_EMBEDDING_CONFIG: "changed-encoding-recipe" })).not.toBe(first);
  });
  it("tracks provider availability without depending on secret key bytes", () => {
    const env = { ASK_JOB_BUILD_REVISION: "a".repeat(40), OPENROUTER_API_KEY: "secret-one" };
    expect(researchEngineRevision({ ...env, OPENROUTER_API_KEY: "secret-two" })).toBe(researchEngineRevision(env));
    expect(researchEngineRevision({ ...env, OPENROUTER_API_KEY: "" })).not.toBe(researchEngineRevision(env));
  });
});
