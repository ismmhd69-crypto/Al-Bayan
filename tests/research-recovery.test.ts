import { describe, expect, it, vi } from "vitest";
import { recoverEvidence, type EvidenceGap, type RecoveryQuery, type RecoveryPlanner } from "@/lib/ask/search-engine/recovery";
import type { PassageForSelection, QuestionFrame } from "@/lib/ask/retrieval";
import { pack } from "./fixtures/rich";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {} };
const gap: EvidenceGap = { requirementId: "R1", concern: "Explain the concern", reason: "missing_direct_support", families: ["scholar"] };
const query: RecoveryQuery = { requirementId: "R1", family: "scholar", language: "ar", text: "صياغة بحث جديدة" };
const first = pack.passages.find(p => p.source.kind === "scholar")!;
const candidate = (id: string): PassageForSelection => {
  if (first.source.kind !== "scholar") throw new Error("fixture_missing");
  return { id, source: { kind: "scholar", quote: { ...first.source.quote, id, url: `https://binbaz.org.sa/fatwas/${id.replace(/\D/g, "") || "123"}/title`, arabic: `${first.source.quote.arabic} ${id}` } }, context: [] };
};
const base = () => ({ frame, initial: 0, candidates: [] as PassageForSelection[], previousQueries: [] as RecoveryQuery[], gaps: (n: number) => n < 1 ? [gap] : [],
  plan: vi.fn<RecoveryPlanner>(async () => [query]), search: vi.fn<(query: RecoveryQuery, signal: AbortSignal) => Promise<PassageForSelection[]>>(async () => [candidate("S123")]), assess: vi.fn(async () => 1), signal: new AbortController().signal });

describe("bounded gap-driven research", () => {
  it("persists round and queries before search, then results before reassessment", async () => {
    const deps = base(), order: string[] = [];
    deps.plan = vi.fn(async () => { order.push("plan"); return [query]; });
    deps.search = vi.fn(async () => { order.push("search"); return [candidate("S123")]; });
    deps.assess = vi.fn(async () => { order.push("assess"); return 1; });
    await recoverEvidence({ ...deps, onRoundStart: async () => { order.push("save-round"); },
      onPlanned: async () => { order.push("save-plan"); }, onSearchResult: async () => { order.push("save-result"); } });
    expect(order).toEqual(["save-round", "plan", "save-plan", "search", "save-result", "assess"]);
  });
  it("does not reset the two-round allowance when work resumes", async () => {
    const deps = base();
    await recoverEvidence({ ...deps, startingRound: 2 });
    expect(deps.plan).not.toHaveBeenCalled(); expect(deps.search).not.toHaveBeenCalled();
    await recoverEvidence({ ...deps, startingRound: 1 });
    expect(deps.plan).toHaveBeenCalledOnce(); expect(deps.plan.mock.calls[0][0].round).toBe(2);
  });
  it("propagates a failed result checkpoint without pretending the source failed or calling the checker", async () => {
    const deps = base(), events: string[] = [];
    await expect(recoverEvidence({ ...deps, onSearchResult: async () => { throw Error("checkpoint failure"); },
      onEvent: event => { events.push(event.code); } })).rejects.toThrow("checkpoint failure");
    expect(deps.assess).not.toHaveBeenCalled(); expect(events).not.toContain("search_failed");
  });
  it("reformulates the specific gap, assesses new evidence, then stops when covered", async () => {
    const deps = base(), result = await recoverEvidence(deps);
    expect(result.value).toBe(1); expect(result.remainingGaps).toEqual([]); expect(deps.plan).toHaveBeenCalledOnce();
    expect(deps.plan.mock.calls[0][0].gaps).toEqual([gap]);
    expect(result.candidates[0].retrievedFor).toEqual(["R1"]);
  });
  it("does not repeat a previous query with punctuation-only changes", async () => {
    const deps = base(); deps.previousQueries = [query]; deps.plan = vi.fn(async () => [{ ...query, text: `${query.text}؟` }]);
    const result = await recoverEvidence(deps);
    expect(result.remainingGaps).toHaveLength(1); expect(deps.search).not.toHaveBeenCalled(); expect(deps.assess).not.toHaveBeenCalled();
  });
  it("does not treat an alternate URL slug for the same fatwa and excerpt as recovery progress", async () => {
    const deps = base(), c = candidate("S123"); deps.candidates = [c];
    if (c.source.kind !== "scholar") throw new Error("fixture_missing");
    const quote = c.source.quote;
    deps.search = vi.fn(async () => [{ ...c, id: "S456", source: { kind: "scholar", quote: { ...quote, url: "https://binbaz.org.sa/fatwas/123/different-slug" } } }]);
    const result = await recoverEvidence(deps);
    expect(result.candidates).toHaveLength(1); expect(deps.assess).not.toHaveBeenCalled(); expect(deps.plan).toHaveBeenCalledOnce();
  });
  it("stops after two novel rounds when a gap remains", async () => {
    const deps = base(); deps.gaps = () => [gap];
    deps.plan = vi.fn(async input => [{ ...query, text: `${query.text} ${input.round === 1 ? "أولى" : "ثانية"}` }]);
    deps.search = vi.fn(async q => [candidate(q.text.endsWith("أولى") ? "S123" : "S456")]);
    const result = await recoverEvidence(deps);
    expect(result.rounds).toBe(2); expect(result.remainingGaps).toHaveLength(1); expect(deps.plan).toHaveBeenCalledTimes(2);
  });
  it("retains a gap after an outage without claiming evidence does not exist", async () => {
    const deps = base(), events: string[] = []; deps.search = vi.fn(async () => { throw new Error("outage"); });
    const result = await recoverEvidence({ ...deps, onEvent: e => events.push(e.code) });
    expect(events).toContain("search_failed"); expect(result.remainingGaps).toHaveLength(1); expect(result.value).toBe(0);
  });
  it("notifies the caller before assessing potentially qualifying new material", async () => {
    const deps = base(), changed = vi.fn(); deps.assess = vi.fn(async () => { expect(changed).toHaveBeenCalledOnce(); throw new Error("check failed"); });
    await expect(recoverEvidence({ ...deps, onNovelEvidence: changed })).rejects.toThrow("check failed");
  });
  it("does not start another stage after cancellation", async () => {
    const deps = base(), stop = new AbortController(); deps.signal = stop.signal;
    deps.search = vi.fn(async () => { stop.abort(); return [candidate("S123")]; });
    await expect(recoverEvidence(deps)).rejects.toThrow(); expect(deps.assess).not.toHaveBeenCalled();
  });
  it("rejects a plan that searches a different concern or source family", async () => {
    const deps = base(); deps.plan = vi.fn(async () => [{ ...query, requirementId: "R99" }]);
    await expect(recoverEvidence(deps)).rejects.toThrow("invalid_recovery_plan"); expect(deps.search).not.toHaveBeenCalled();
  });
});
