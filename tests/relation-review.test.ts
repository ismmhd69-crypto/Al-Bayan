import { expect, it } from "vitest";
import { relationReviewRequest, parseRelationReview } from "@/lib/ask/relation-review";
const sources = [{ id: "S1", arabic: "Submit the application to request a place." }];
const claim = { text: "Submitting the application secures a place.", refs: ["S1"] };
const row = { text: claim.text, claim_function: "outcome", source_function: "instruction", supported: "yes", limits_preserved: "yes", source_id: "S1", original_excerpt: sources[0].arabic };
it("does not turn an exact source quote plus a positive verdict into proof of a different outcome", () => {
  expect(parseRelationReview({ clauses: [row] }, claim, sources)?.safeIds).toEqual([]);
});
it("accepts an instruction paraphrase with matched force and exact original proof", () => {
  const item = { ...claim, text: "Apply to request a place." };
  expect(parseRelationReview({ clauses: [{ ...row, text: item.text, claim_function: "instruction" }] }, item, sources)?.safeIds).toEqual(["C1"]);
});
it.each(["missing clause", "invented proof", "uncited source", "uncertain", "extra field"])("refuses incomplete or unanchored agreement: %s", mode => {
  const r = { ...row, source_function: "outcome" };
  if (mode === "missing clause") r.text = "Submitting the application";
  if (mode === "invented proof") r.original_excerpt = "Submitting always secures a place.";
  if (mode === "uncited source") r.source_id = "S2";
  if (mode === "uncertain") r.supported = "unsure";
  const result = parseRelationReview({ clauses: [r], ...(mode === "extra field" ? { approved: true } : {}) }, claim, sources);
  expect(result?.safeIds ?? []).toEqual([]);
});
it("supplies only the single claim's cited originals, with no neighbouring proof", () => {
  const req = relationReviewRequest(claim, [...sources, { id: "S2", arabic: "OTHER UNRELATED TEXT" }], new AbortController().signal);
  expect(req.prompt).not.toContain("OTHER UNRELATED TEXT");
  expect(req.system).toContain("Two neighbouring commands do not establish a causal relationship");
});
