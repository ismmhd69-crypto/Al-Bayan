import { describe, expect, it } from "vitest";
import type { EvalQuestion } from "@/data/eval-questions";
import { acceptedSource, formatSummary, percentile, summarize, wrongSources, type EvalRow } from "@/scripts/eval-metrics";

const reviewed = { reviewedBy: "test", reviewedAt: "2026-09-29" };
const questions = new Map<string, EvalQuestion>([
  ["fast", { id: "fast", lang: "en", question: "q", expect: "answer",
    mustContain: [{ point: "month", anyOf: ["month"] }, { point: "duty", anyOf: ["required"] }],
    acceptableSources: { ids: ["HE9001"], classes: ["quran:2:183-187", "scholar:ibn-baz"], ...reviewed } }],
  ["open", { id: "open", lang: "en", question: "q", expect: "answer" }],
  ["gap", { id: "gap", lang: "en", question: "q", expect: "refuse" }],
  ["mine", { id: "mine", lang: "en", question: "q", expect: "ask_scholar" }],
]);
const row = (id: string, outcome: EvalRow["outcome"], extra: Partial<EvalRow> = {}): EvalRow => ({
  id, run: 1, outcome, origin: "live", seconds: 10, structureOk: outcome === "answer" ? true : null,
  mustContainPassed: questions.get(id)?.mustContain ? [] : null, cited: [], ...extra,
});

describe("evaluation definitions", () => {
  it("matches reviewed ids and source classes, and never passes an unreviewed question", () => {
    const acceptable = questions.get("fast")!.acceptableSources!;
    expect(acceptedSource({ id: "Q2:185", kind: "quran" }, acceptable)).toBe(true);
    expect(acceptedSource({ id: "Q2:188", kind: "quran" }, acceptable)).toBe(false);
    expect(acceptedSource({ id: "Q3:185", kind: "quran" }, acceptable)).toBe(false);
    expect(acceptedSource({ id: "HE9001", kind: "hadith" }, acceptable)).toBe(true);
    expect(acceptedSource({ id: "HE9002", kind: "hadith" }, acceptable)).toBe(false);
    expect(acceptedSource({ id: "S1", kind: "scholar", scholarId: "ibn-baz" }, acceptable)).toBe(true);
    expect(acceptedSource({ id: "S2", kind: "scholar", scholarId: "al-albani" }, acceptable)).toBe(false);
    expect(wrongSources(row("open", "answer", { cited: [{ id: "Q9:9", kind: "quran" }] }), questions.get("open"))).toBeNull();
  });

  it("computes nearest-rank p50 and p90", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([5, 1, 9, 3, 7, 2, 8, 4, 6, 10], 50)).toBe(5);
    expect(percentile([5, 1, 9, 3, 7, 2, 8, 4, 6, 10], 90)).toBe(9);
  });

  it("separates useful explanations, no-summary, source-only and correct refusals", () => {
    const summary = summarize([
      row("fast", "answer", { mustContainPassed: ["month", "duty"], cited: [{ id: "Q2:183", kind: "quran" }, { id: "Q4:1", kind: "quran" }] }),
      row("open", "source_only"),
      row("open", "no_summary", { run: 2 }),
      row("gap", "no_source"),
      row("mine", "no_source"), // should have been a scholar referral
      row("open", "answer", { run: 3, structureOk: false }),
    ], questions);
    expect(summary.usefulExplanation).toEqual({ count: 2, of: 4 });
    expect(summary.sourceOnly).toEqual({ count: 1, of: 4 });
    expect(summary.noSummary).toEqual({ count: 1, of: 4 });
    expect(summary.correctRefusal).toEqual({ count: 1, of: 2 });
    expect(summary.structureOk).toEqual({ count: 1, of: 2, answersWithoutV2: 0 });
    expect(summary.mustContain).toEqual({ count: 1, of: 1 });
    expect(summary.wrongSource).toEqual({ count: 1, answersChecked: 1, answersUnreviewed: 1 });
    expect(formatSummary(summary, "live")).toContain("wrong-source count: 1");
  });

  it("calls required points stable only across three answered runs with the same points", () => {
    const stable = [1, 2, 3].map((run) => row("fast", "answer", { run, mustContainPassed: ["duty", "month"] }));
    expect(summarize(stable, questions).stableRequiredPoints).toEqual({ count: 1, of: 1 });
    const drift = [...stable.slice(0, 2), row("fast", "answer", { run: 3, mustContainPassed: ["month"] })];
    expect(summarize(drift, questions).stableRequiredPoints).toEqual({ count: 0, of: 1 });
    const refusedOnce = [...stable.slice(0, 2), row("fast", "no_source", { run: 3 })];
    expect(summarize(refusedOnce, questions).stableRequiredPoints).toEqual({ count: 0, of: 1 });
    expect(summarize(stable.slice(0, 2), questions).stableRequiredPoints).toEqual({ count: 0, of: 0 });
    expect(formatSummary(summarize(stable.slice(0, 2), questions), "live")).toContain("n/a (needs --runs=3)");
  });
});
