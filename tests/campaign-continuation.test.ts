import { expect, it } from "vitest";
import { sameAllowanceContinuation, digest, type CampaignLedger } from "../scripts/ask-arabic-campaign-guard";
const previous: CampaignLedger = { version: 1, cap: 1, priorExposure: .5, prices: {}, originalLedgerHash: "root", stopped: "reviewed",
  calls: [{ model: "current", fingerprint: "x", at: "fixed", reserved: .3, cost: .2 }] };
it("preserves the exact old remainder and ceiling instead of adding or resetting money", () => {
  const bytes = JSON.stringify(previous), next = sameAllowanceContinuation(bytes, "old", "Owner resumed the same bounded test loop");
  expect(next.cap).toBe(previous.cap); expect(next.priorExposure).toBe(.7); expect(next.cap - next.priorExposure).toBeCloseTo(.3);
  expect(next.priorCampaign).toMatchObject({ path: "old", hash: digest(bytes), exposure: .7 }); expect(next.originalLedgerHash).toBe("root");
  expect(JSON.stringify(previous)).toBe(bytes); expect(next.calls).toEqual([]);
});
it("cannot release an uncertain charge or proceed past a pending review", () => {
  expect(() => sameAllowanceContinuation(JSON.stringify({ ...previous, calls: [{ ...previous.calls[0], cost: undefined }] }), "old", "resume")).toThrow("new_campaign_charge_unresolved_no_resume");
  expect(() => sameAllowanceContinuation(JSON.stringify({ ...previous, evaluationCases: [{ id: "x", requestId: "x", reportPath: "x", review: "pending" }] }), "old", "resume")).toThrow("prior_campaign_review_required");
});
it("rejects invalid receipts, already overdrawn exposure and empty resumed authorization", () => {
  expect(() => sameAllowanceContinuation(JSON.stringify({ ...previous, calls: [{ ...previous.calls[0], cost: -.1 }] }), "old", "resume")).toThrow("invalid_campaign_receipt");
  expect(() => sameAllowanceContinuation(JSON.stringify({ ...previous, priorExposure: .9 }), "old", "resume")).toThrow("prior_campaign_over_ceiling");
  expect(() => sameAllowanceContinuation(JSON.stringify(previous), "old", " ")).toThrow("prior_campaign_review_required");
});
