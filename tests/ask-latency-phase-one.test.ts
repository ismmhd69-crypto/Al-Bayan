import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const events = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ask/local-trace", () => ({ recordLocalAskEvent: events, withLocalAskTrace: (_id: string, _time: number, work: () => unknown) => work() }));
import { runSourceRequest, withAskTimeout, sourceRequestTimeout } from "@/lib/ask/timing";
import { askDeadlineMs, localAskUnhurried } from "@/lib/ask/settings";
import { createOpenRouter, OpenRouterRequestError } from "@/lib/ai/openrouter";
import { createRateLimiter } from "@/lib/ai/limits";
import { requestPhase } from "@/lib/ask/trace-context";
import { withResearchCancellation } from "@/lib/ask/research-runtime";
import { GoogleBusyError } from "@/lib/ai/gemini";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack } from "./fixtures/rich";

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); events.mockClear(); });

it("requires explicit opt-in for unlimited local waits", () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "");
  expect(localAskUnhurried()).toBe(false); expect(askDeadlineMs()).toBe(50_000);
});

it("lets an unhurried source search and body finish after three minutes while retaining visitor cancellation", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true"); vi.useFakeTimers();
  const stop = new AbortController(); let release!: () => void, finished = false;
  const body = new Promise<string>(resolve => { release = () => resolve("unchanged source text"); });
  const connection = sourceRequestTimeout(stop.signal, 10_000, "fixture_source");
  const work = runSourceRequest(stop.signal, 10_000, "fixture_search", async () => { const result = await body; finished = true; return result; });
  await vi.advanceTimersByTimeAsync(180_000);
  expect(connection.aborted).toBe(false); expect(finished).toBe(false); expect(vi.getTimerCount()).toBe(0);
  release(); expect(await work).toBe("unchanged source text");
  const cancelled = runSourceRequest(stop.signal, 10_000, "fixture_search", () => new Promise(() => {})).catch(e => e);
  stop.abort(new DOMException("Stopped", "AbortError"));
  expect(await cancelled).toMatchObject({ name: "AbortError" });
});

it("cancels nested source readers even when they do not receive an explicit parent signal", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true");
  const stop = new AbortController(); let connection!: AbortSignal;
  const pending = withResearchCancellation(stop.signal, () => runSourceRequest(undefined, 10_000, "nested_source", async signal => {
    connection = signal; return new Promise(() => {});
  })).catch(e => e);
  stop.abort(new DOMException("Stopped", "AbortError"));
  expect(connection.aborted).toBe(true); expect(await pending).toMatchObject({ name: "AbortError" });
});

it("clears successful and failed operation timers without later timeout events", async () => {
  vi.useFakeTimers();
  expect(await runSourceRequest(undefined, 100, "fixture", async () => 42)).toBe(42);
  await expect(runSourceRequest(undefined, 100, "fixture", async () => { throw new Error("unavailable"); })).rejects.toThrow("unavailable");
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(101); expect(events).not.toHaveBeenCalled();
});

it("records one true unfinished-operation timeout and rejects a signal-ignoring body", async () => {
  vi.useFakeTimers();
  const result = runSourceRequest(undefined, 100, "quran_content", async () => new Promise(() => {})).catch(e => e);
  await vi.advanceTimersByTimeAsync(101);
  expect(await result).toMatchObject({ name: "TimeoutError" });
  expect(events).toHaveBeenCalledExactlyOnceWith("source_request_timeout_fired", { stage: "quran_content", limit_ms: 100, parent_already_aborted: false });
});

it("cancellation clears timers without reporting a source timeout", async () => {
  vi.useFakeTimers(); const stop = new AbortController();
  const job = runSourceRequest(stop.signal, 100, "quran_content", async () => new Promise(() => {})).catch(e => e);
  stop.abort(new DOMException("Stopped", "AbortError"));
  expect(await job).toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(101); expect(events).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});

it("scoped model deadlines cover body consumption and do not survive completion", async () => {
  vi.useFakeTimers(); vi.stubEnv("ASK_LOCAL_UNHURRIED", "false");
  expect(await withAskTimeout(undefined, 100, "model", async () => 1)).toBe(1);
  expect(vi.getTimerCount()).toBe(0);
  const result = withAskTimeout(undefined, 100, "model", async () => new Promise(() => {})).catch(e => e);
  await vi.advanceTimersByTimeAsync(101); expect(await result).toMatchObject({ name: "TimeoutError" });
});

it("keeps rejection metadata safe and never retries strict HTTP 400", async () => {
  const fetcher = vi.fn(async () => Response.json({ error: { message: "private provider detail" } }, { status: 400 }));
  vi.stubGlobal("fetch", fetcher);
  const error = await createOpenRouter("fixture", "fixture", createRateLimiter(10, 10)).generateJson({ system: "fixture", prompt: "{}", structuredOutput: true,
    schema: { type: "object", properties: {}, required: [] } }).catch(e => e);
  expect(error).toBeInstanceOf(OpenRouterRequestError);
  expect(error).toMatchObject({ httpStatus: 400, category: "provider_rejected" });
  expect(JSON.stringify(error)).not.toContain("private provider detail"); expect(fetcher).toHaveBeenCalledOnce();
});

it("bounds an OpenRouter response body that ignores fetch cancellation", async () => {
  vi.useFakeTimers(); vi.stubEnv("ASK_LOCAL_UNHURRIED", "false"); vi.stubEnv("OPENROUTER_TIMEOUT_MS", "100");
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) })));
  const pending = createOpenRouter("fixture", "fixture", createRateLimiter(10, 10)).generateJson({ system: "fixture", prompt: "{}",
    schema: { type: "object", properties: {}, required: [] } }).catch(e => e);
  await vi.advanceTimersByTimeAsync(101); expect(await pending).toBeInstanceOf(GoogleBusyError);
});

it("identifies summary writing without logging the visitor content", () => {
  expect(requestPhase({ system: "You write short explanations", prompt: JSON.stringify({ sections_to_write: ["summary"] }), schema: { type: "object", properties: {}, required: [] } })).toBe("summary");
});

it("preserves checked sections and identifies a summary rejection without retrying it", async () => {
  const deps = dependencies(), original = deps.writer.generateJson;
  let summaries = 0;
  deps.writer.generateJson = async request => {
    if (JSON.parse(request.prompt).sections_to_write?.includes("summary")) {
      summaries++; throw new OpenRouterRequestError(400, "provider_rejected");
    }
    return original(request);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result).toMatchObject({ status: "incomplete", failureKind: "summary_provider_rejection", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.filter(s => s.outcome === "ready")).toHaveLength(3);
  expect(summaries).toBe(1);
});
