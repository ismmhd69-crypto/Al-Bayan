import { expect, it } from "vitest";
import { worshipRetestLedger } from "../scripts/authorize-ask-worship-retest";
import { digest, type CampaignLedger } from "../scripts/ask-arabic-campaign-guard";
const prior: CampaignLedger = { version: 1, cap: 1, priorExposure: .5, originalLedgerHash: "original", prices: {},
  calls: [{ model: "current", fingerprint: "x", at: "fixed", reserved: .3, cost: .2 }], stopped: "diverse_package_writer_finished_review_required" };
it("adds only the approved quarter and preserves all old exposure, remainder and exact ancestor hash", () => {
  const bytes = JSON.stringify(prior), next = worshipRetestLedger(prior, bytes, "old");
  expect(next.cap).toBe(1.25); expect(next.priorExposure).toBe(.7); expect(next.cap - next.priorExposure).toBeCloseTo(.55);
  expect(next.priorCampaign).toMatchObject({ path: "old", hash: digest(bytes), exposure: .7 });
  expect(JSON.stringify(prior)).toBe(bytes); expect(next.originalLedgerHash).toBe("original"); expect(next.calls).toEqual([]);
});
it("rejects uncertain charges and unreviewed full evaluations without releasing their exposure", () => {
  for (const changed of [{ ...prior, calls: [{ ...prior.calls[0], cost: undefined }] }, { ...prior, evaluationCases: [{ id: "x", requestId: "x", reportPath: "x", review: "pending" as const }] }]) {
    expect(() => worshipRetestLedger(changed, JSON.stringify(changed), "old")).toThrow("preceding_spending_not_settled_and_reviewed");
  }
});
