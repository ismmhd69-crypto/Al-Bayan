import { expect, it } from "vitest";
import { disagreementReviewRequest, parseDisagreementReview } from "@/lib/ask/disagreement-review";
const item = { text: "Submit a form to request a place.", refs: ["S1"] };
const sources = [{ id: "S1", arabic: "Submit an application to request a place." }];
const positive = () => ({ criticism_valid: "no", claim_supported: "yes", explanation: "The request instruction is explicit.", clauses: [{
  text: item.text, supported: "yes", scope_preserved: "yes", qualifiers_preserved: "yes", evidence: [{ anchor_id: "C1E1" }],
}] });
it("does not expose model names, earlier approvals or unrelated originals to the review", () => {
  const req = disagreementReviewRequest(item, [...sources, { id: "S2", arabic: "UNRELATED POSITIVE PROOF" }], "The original has no application instruction.", new AbortController().signal);
  const p = JSON.parse(req.prompt);
  expect(Object.keys(p)).toEqual(["stage", "claim", "criticism", "originals", "excerpt_choices"]);
  expect(req.prompt).not.toContain("UNRELATED POSITIVE PROOF");
});
it("requires full exact proof even when the criticism is rejected", () => {
  expect(parseDisagreementReview(positive(), item, sources)?.safe).toBe(true);
  const changed = positive(); changed.clauses[0].text = "Submit a form.";
  expect(parseDisagreementReview(changed, item, sources)?.safe).toBe(false);
});
it.each(["unknown anchor", "missing proof", "real criticism", "uncertain criticism", "extra field"])("refuses defective positive adjudication: %s", mode => {
  const r: any = positive();
  if (mode === "unknown anchor") r.clauses[0].evidence[0].anchor_id = "SOME_OTHER_PROOF";
  if (mode === "missing proof") r.clauses[0].evidence = [];
  if (mode === "real criticism") r.criticism_valid = "yes";
  if (mode === "uncertain criticism") r.criticism_valid = "unsure";
  if (mode === "extra field") r.accepted_by_majority = true;
  expect(parseDisagreementReview(r, item, sources)?.safe ?? false).toBe(false);
});
it("preserves real rejection and uncertainty, without turning a false criticism into approval", () => {
  for (const criticism_valid of ["yes", "no", "unsure"]) expect(parseDisagreementReview({ criticism_valid, claim_supported: "no",
    explanation: "The claimed outcome is absent from the original.", clauses: [] }, item, sources)?.safe).toBe(false);
});
