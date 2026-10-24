import { describe, expect, it } from "vitest";
import { parentsVerificationLedger } from "../scripts/authorize-ask-parents-verification";
import { digest, type CampaignLedger } from "../scripts/ask-arabic-campaign-guard";

const previous: CampaignLedger = { version: 1, cap: 2.3824438125, priorExposure: 2.2787119725,
  originalLedgerHash: "original", prices: {}, stopped: "named_scholar_control_finished_review_required",
  calls: [{ fingerprint: "one", model: "model", at: "now", reserved: .04589712, cost: .0016644 }] };
describe("one approved parents verification allowance", () => {
  it("adds only the approved quarter and preserves every earlier charge and original hold identity", () => {
    const bytes = JSON.stringify(previous), next = parentsVerificationLedger(bytes, "previous");
    expect(next.cap).toBe(previous.cap + .25);
    expect(next.priorExposure).toBeCloseTo(2.2803763725, 10);
    expect(next.cap - next.priorExposure).toBeCloseTo(.35206744, 10);
    expect(next.originalLedgerHash).toBe("original");
    expect(next.priorCampaign).toMatchObject({ path: "previous", hash: digest(bytes), exposure: next.priorExposure });
    expect(next.calls).toEqual([]);
    expect(JSON.parse(bytes)).toEqual(previous);
  });
  it("cannot carry forward unknown charges, unreviewed results or the wrong predecessor", () => {
    expect(() => parentsVerificationLedger(JSON.stringify({ ...previous, calls: [{ ...previous.calls[0], cost: undefined }] }), "p")).toThrow("new_campaign_charge_unresolved_no_resume");
    expect(() => parentsVerificationLedger(JSON.stringify({ ...previous, evaluationCases: [{ review: "pending" }] }), "p")).toThrow("prior_campaign_review_required");
    expect(() => parentsVerificationLedger(JSON.stringify({ ...previous, stopped: "other" }), "p")).toThrow("preceding_component_not_reviewed");
  });
});
