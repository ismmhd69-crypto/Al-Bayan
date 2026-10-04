import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { diagnosticLogger, safeDetails } from "@/lib/ask/diagnostics";
import { currentAskRequestId, emitAiTrace, observedProvider, withAskRequest } from "@/lib/ask/trace-context";
import { frameSummary, selectionSummary, sourceSummary, screeningSummary } from "@/lib/ask/trace-summary";
import type { QuestionFrame, PassageForSelection } from "@/lib/ask/retrieval";
import type { StructuredDraft } from "@/lib/ask/checks";
import { createOpenRouter } from "@/lib/ai/openrouter";
import { createRateLimiter } from "@/lib/ai/limits";
import { GoogleBusyError } from "@/lib/ai/gemini";

vi.mock("server-only", () => ({}));
const context = { requestId: "controlled-1", revision: "fd7331f", writerChain: "openrouter/test/writer", verifierChain: "openrouter/test/checker", claimAudit: false, tiered: false, lean: false };
const request = { system: "You write short explanations", prompt: "PRIVATE VISITOR AND SOURCE TEXT", schema: { type: "object" as const, properties: {}, required: [] }, maxOutputTokens: 123 };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("privacy-safe end-to-end traces", () => {
  it("allows structural observations but drops private and arbitrary fields recursively", () => {
    const sink = vi.fn(), log = diagnosticLogger(true, context, sink);
    log("screening", "answer_assessments", 10, {
      question: "PRIVATE", answer: "PRIVATE", query: "PRIVATE", api_key: "PRIVATE", explanation: "PRIVATE",
      model: "openrouter/test/checker", claims: [{ claim_id: "C1", source_ids: ["Q16:91", "PRIVATE"], text: "PRIVATE", verdict: "PRIVATE" }],
      checks: [{ check: "audience_preserved", verdict: "no", explanation: "PRIVATE" }], http_status: 200, cost_usd: 0.001,
    });
    expect(sink.mock.calls[0][0]).not.toContain("PRIVATE");
    expect(JSON.parse(sink.mock.calls[0][0].split("ask diagnostic: ")[1]).details).toEqual({
      model: "openrouter/test/checker", claims: [{ claim_id: "C1", source_ids: ["Q16:91", "invalid"], verdict: "invalid" }],
      checks: [{ check: "audience_preserved", verdict: "no" }], http_status: 200, cost_usd: 0.001,
    });
    expect(safeDetails({ cost_usd: NaN, count: -1, valid: "yes", fingerprint: "PRIVATE" })).toBeUndefined();
  });
  it("is silent when disabled and cannot fail a request when its sink throws", () => {
    const sink = vi.fn(() => { throw new Error("sink unavailable"); });
    diagnosticLogger(false, context, sink)("request", "request_received", 0, { count: 1 });
    expect(sink).not.toHaveBeenCalled();
    expect(() => diagnosticLogger(true, context, sink)("request", "request_received", 0)).not.toThrow();
  });
  it("bounds nested arrays without accepting free text", () => {
    const result = safeDetails({ claims: Array(100).fill({ claim_id: "C1", text: "PRIVATE" }) });
    expect(result?.claims).toHaveLength(40);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
  it("retains a terminal event when detailed metadata exceeds the line budget", () => {
    const sink = vi.fn(), log = diagnosticLogger(true, context, sink);
    log("answer", "checked_answer_ready", 50, { claims: Array(40).fill({ claim_id: "C1", source_ids: Array(40).fill("S00000000-0000-4000-a000-000000000001") }) });
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0].length).toBeLessThan(16000);
    expect(sink.mock.calls[0][0]).toContain('"logging_truncated":true');
  });
  it("preserves model success even when a custom observer throws", async () => {
    const value = { ok: true }, generateJson = vi.fn(async () => value);
    const p = observedProvider({ id: context.writerChain, generateJson }, "writer", () => { throw new Error("observer unavailable"); }, Date.now(), () => "A1");
    expect(await p.generateJson(request)).toBe(value);
    expect(generateJson).toHaveBeenCalledExactlyOnceWith(request);
  });
  it("preserves request, result and error identity and makes exactly one provider call", async () => {
    const value = { private_answer: "PRIVATE" }, generateJson = vi.fn(async () => value), sink = vi.fn();
    const provider = observedProvider({ id: context.writerChain, generateJson }, "writer", diagnosticLogger(true, context, sink), Date.now(), () => "A1");
    expect(await provider.generateJson(request)).toBe(value);
    expect(generateJson).toHaveBeenCalledExactlyOnceWith(request);
    expect(sink.mock.calls.flat().join("\n")).not.toContain("PRIVATE");
    const error = new GoogleBusyError("PRIVATE PROVIDER ERROR");
    generateJson.mockRejectedValueOnce(error);
    await expect(provider.generateJson(request)).rejects.toBe(error);
    expect(sink.mock.calls.at(-1)?.[0]).toContain('"outcome":"busy"');
    expect(sink.mock.calls.flat().join("\n")).not.toContain("PRIVATE");
  });
  it("keeps concurrent request and provider scopes separate", async () => {
    const events: string[] = [];
    const run = (requestId: string) => withAskRequest(requestId, async () => {
      const p = observedProvider({ id: context.writerChain, generateJson: async () => {
        await Promise.resolve();
        emitAiTrace("model_usage", { model: context.writerChain, cost_usd: 0.001 });
        return { requestId: currentAskRequestId() };
      } }, "writer", diagnosticLogger(true, { ...context, requestId }, (line) => events.push(line)), Date.now(), () => "A1");
      return p.generateJson(request);
    });
    expect(await Promise.all([run("request-one"), run("request-two")])).toEqual([{ requestId: "request-one" }, { requestId: "request-two" }]);
    for (const id of ["request-one", "request-two"]) expect(events.filter((line) => line.includes(`"request_id":"${id}"`))).toHaveLength(3);
    expect(currentAskRequestId()).toBeUndefined();
  });
  it("reports an existing recorded refusal's missing points without leaking sources or changing them", () => {
    const rows = JSON.parse(readFileSync("docs/ask-repair-runs/baseline-1.json", "utf8")).rows as { id: string; frame: QuestionFrame; candidates: PassageForSelection[]; selection: unknown }[];
    const row = rows.find((r) => r.id === "zakah-en")!, before = JSON.stringify(row);
    const summary = selectionSummary(row.selection, row.frame, row.candidates);
    expect(summary.direct_count).toBe(0);
    expect(summary.coverage.every((point) => point.direct_count === 0)).toBe(true);
    const metadata = safeDetails({ ...frameSummary(row.frame), sources: row.candidates.map(sourceSummary), assessments: summary.assessments });
    expect(JSON.stringify(metadata)).not.toContain(row.frame.requirements[0].text);
    expect(JSON.stringify(metadata)).not.toContain(row.candidates[0].source.kind === "quran" ? row.candidates[0].source.verse.arabic : "UNLIKELY SENTINEL");
    expect(JSON.stringify(row)).toBe(before);
    expect(sourceSummary(row.candidates[0]).fingerprint).toBe(sourceSummary(row.candidates[0]).fingerprint);
  });
  it("reports claim-audit dimensions without misleading missing legacy verdicts", () => {
    const answer = { claims: [{ text: "PRIVATE", refs: ["Q16:91"] }] } as StructuredDraft;
    const result = screeningSummary({ claim_assessments: [{ claim_id: "C1", source_ids: ["Q16:91"], audience_preserved: "no", explanation: "PRIVATE" }] }, answer);
    expect(result.actual_count).toBe(1); expect(result.claims).toEqual([]);
    expect(result.assessments[0].checks).toContainEqual({ check: "audience_preserved", verdict: "no" });
    expect(JSON.stringify(safeDetails(result))).not.toContain("PRIVATE");
  });
  it("counts physical OpenRouter attempts and usage without new calls or secret content", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("PRIVATE ERROR", { status: 400 })).mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content: '{"answer":"PRIVATE"}' } }], usage: { cost: 0.002, prompt_tokens: 120, completion_tokens: 30, completion_tokens_details: { reasoning_tokens: 10 } },
    })));
    vi.stubGlobal("fetch", fetcher);
    const sink = vi.fn(), p = observedProvider(createOpenRouter("PRIVATE KEY", "test/writer", createRateLimiter(1000, 100000)), "writer", diagnosticLogger(true, context, sink), Date.now(), () => "A1");
    expect(await p.generateJson(request)).toEqual({ answer: "PRIVATE" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const lines = sink.mock.calls.map(([line]) => JSON.parse(line.split("ask diagnostic: ")[1]));
    expect(lines.filter((line) => line.code === "http_attempt_started").map((line) => line.details.attempt)).toEqual([1, 2]);
    expect(lines.find((line) => line.code === "model_usage").details).toMatchObject({ cost_usd: 0.002, prompt_tokens: 120, completion_tokens: 30, reasoning_tokens: 10 });
    expect(sink.mock.calls.flat().join("\n")).not.toContain("PRIVATE");
  });
});
