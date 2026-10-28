import { describe, expect, it } from "vitest";
import { summarizeReliabilityTrace, reliabilityReferenceCases } from "../scripts/prepare-ask-reliability-baseline";
describe("private offline reliability baseline", () => {
  it("binds scores to exact candidate order without copying private wording", () => {
    const result = summarizeReliabilityTrace([
      { sequence: 1, elapsed_ms: 1, event: "model_request", data: { call_id: "A1", phase: "reranking", prompt: { concern: "PRIVATE_QUESTION", passages: [
        { id: "Q2:1", original: "PRIVATE_ORIGINAL" }, { id: "Q2:2", original: "OTHER_PRIVATE_ORIGINAL" }] } } },
      { sequence: 2, elapsed_ms: 2, event: "model_response", data: { call_id: "A1", value: { scores: [0, 80] } } },
    ]);
    expect(result.candidates.map(c => c.rankings)).toEqual([[{ call: "A1", index: 0, score: 0 }], [{ call: "A1", index: 1, score: 80 }]]);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE/);
    expect(result.candidates[0].sourceSnapshotHash).not.toBe(result.candidates[1].sourceSnapshotHash);
  });
  it("freezes paired launch languages and does not claim semantic approval from replay", () => {
    expect(reliabilityReferenceCases.filter(c => c.language === "en")).toHaveLength(3);
    expect(reliabilityReferenceCases.filter(c => c.language === "ar")).toHaveLength(3);
    expect(reliabilityReferenceCases.some(c => c.labelStatus.includes("review_required"))).toBe(true);
    expect(new Set(reliabilityReferenceCases.map(c => c.id)).size).toBe(reliabilityReferenceCases.length);
  });
});
