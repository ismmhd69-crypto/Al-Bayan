import { describe, expect, it } from "vitest";
import { compareRichMeasurements, guardedRichChains, richMeasurementSummary, type RichMeasurement } from "@/scripts/evaluate-ask-rich";
const row: RichMeasurement = { id: "one", outcome: "rich_answer", firstCheckedMs: 100, totalMs: 200, cost: .01, sources: { quran: 1, hadith: 1, scholar: 1 }, groups: {}, result: null };
describe("rich measurements do not imply source-faithfulness acceptance", () => {
  it("separates prepared answers and partial/error cases from timed rich completions", () => {
    const summary = richMeasurementSummary([row, { ...row, id: "two", outcome: "answer", firstCheckedMs: null }, { ...row, id: "three", outcome: "incomplete" }], 4);
    expect(summary.matchedSetComplete).toBe(false); expect(summary.automaticRichCompletions).toBe(1); expect(summary.preparedAnswers).toBe(1);
    expect(summary.timingPairs).toEqual([{ id: "one", firstCheckedMs: 100, totalMs: 200, fractionEarlier: .5 }]);
    expect(summary.thirtyPercentEarlierCases).toBe(1); expect(summary.costPerAutomaticRichCompletion).toBeCloseTo(.03);
    expect(summary.sourceFaithfulnessAcceptance).toContain("not_established");
  });
  it("rejects chains that could send an unguarded billable request", () => {
    expect(guardedRichChains("openrouter/model|fallback:openrouter/other", "openrouter/checker")).toBe(true);
    expect(guardedRichChains("openrouter/model|fallback:gemini/model", "openrouter/checker")).toBe(false);
    expect(guardedRichChains("nvidia/model", "openrouter/checker")).toBe(false);
  });
  it("compares only matched completed questions and never labels missing pairs a complete comparison", () => {
    const baseline = { ...row, firstCheckedMs: 140, totalMs: 240 };
    const matched = compareRichMeasurements([row], [baseline], 1);
    expect(matched.matchedSetComplete).toBe(true);
    expect(matched.completedPairs[0].totalMs).toEqual({ baseline: 240, current: 200 });
    expect(matched.manualReview).toContain("still require review");
    expect(compareRichMeasurements([row], [{ ...baseline, id: "other" }], 1)).toMatchObject({ matchedSetComplete: false, completedPairs: [] });
    expect(compareRichMeasurements([row], [{ ...baseline, outcome: "incomplete" }], 1).completedPairs).toEqual([]);
  });
});
