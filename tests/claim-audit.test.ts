import { describe, expect, it } from "vitest";
import { CLAIM_AUDIT_FIELDS, CLAIM_AUDIT_REASONS, identifiedClaims, parseClaimAudit, type Claim } from "@/lib/ask/checks";
import { screeningSystem } from "@/lib/ask/claim-audit";
import { askClaimAudit } from "@/lib/ask/settings";

const claims: Claim[] = [{ text: "A faithful summary.", refs: ["Q2:183", "S-example"] }, { text: "Another summary.", refs: ["HE1"] }];
const good = () => identifiedClaims(claims).map((claim) => ({
  claim_id: claim.claim_id, source_ids: claim.source_ids,
  ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((f) => [f, "yes"])), reason_codes: [] as string[], explanation: "",
}));

describe("general claim audit", () => {
  it("is explicitly opt-in", () => {
    for (const value of ["", "false", "TRUE", "1"]) expect(askClaimAudit(value)).toBe(false);
    expect(askClaimAudit("true")).toBe(true);
  });
  it("does not alter the legacy prompt", () => {
    const legacy = "Return one verdict per claim, in the same order.";
    expect(screeningSystem(legacy, false)).toBe(legacy);
    expect(screeningSystem(legacy, true)).not.toContain(legacy);
  });
  it("accepts exact identity and citation coverage, independent of output order", () => {
    expect(parseClaimAudit({ claim_assessments: good().reverse() }, claims)).toEqual({ supported: true, failures: [] });
    expect(identifiedClaims(claims)).toEqual(identifiedClaims(claims));
  });
  it.each(CLAIM_AUDIT_FIELDS)("rejects no and unsure on %s with precise feedback", (field) => {
    for (const verdict of ["no", "unsure"]) {
      const items = good();
      const reason = CLAIM_AUDIT_REASONS[CLAIM_AUDIT_FIELDS.indexOf(field)];
      Object.assign(items[0], { [field]: verdict, reason_codes: [reason], explanation: "The summary changes a restriction." });
      expect(parseClaimAudit({ claim_assessments: items }, claims)).toEqual({ supported: false, failures: [{
        claim_id: "C1", source_ids: claims[0].refs, reason_codes: [reason], explanation: "The summary changes a restriction.",
      }] });
    }
  });
  it("fails closed on missing, extra, duplicate and invented IDs or references", () => {
    const variants: unknown[] = [null, {}, { claim_assessments: [] }];
    for (const edit of [
      (a: ReturnType<typeof good>) => a.pop(),
      (a: ReturnType<typeof good>) => a.push(a[0]),
      (a: ReturnType<typeof good>) => { a[1].claim_id = "C1"; },
      (a: ReturnType<typeof good>) => { a[1].claim_id = "C999"; },
      (a: ReturnType<typeof good>) => { a[0].source_ids = ["invented", "S-example"]; },
      (a: ReturnType<typeof good>) => { a[0].source_ids = ["Q2:183", "Q2:183"]; },
      (a: ReturnType<typeof good>) => { a[0].source_ids = ["Q2:183"]; },
      (a: ReturnType<typeof good>) => { Object.assign(a[0], { audience_preserved: undefined }); },
      (a: ReturnType<typeof good>) => { Object.assign(a[0], { audience_preserved: ["yes"] }); },
      (a: ReturnType<typeof good>) => { a[0].reason_codes = ["unknown"]; },
      (a: ReturnType<typeof good>) => { a[0].explanation = "x".repeat(241); },
      (a: ReturnType<typeof good>) => { Object.assign(a[0], { audience_preserved: "no" }); },
      (a: ReturnType<typeof good>) => { Object.assign(a[0], { audience_preserved: "no", reason_codes: ["condition_lost"], explanation: "Wrong code." }); },
      (a: ReturnType<typeof good>) => { a[0].explanation = "All-yes feedback is inconsistent."; },
    ]) { const a = good(); edit(a); variants.push({ claim_assessments: a }); }
    for (const variant of variants) expect(parseClaimAudit(variant, claims)).toBeNull();
  });
});
