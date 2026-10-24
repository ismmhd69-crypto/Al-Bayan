import { expect, it } from "vitest";
import { shareReviewOriginals, restoreReviewOriginals } from "@/lib/ask/shared-originals-review";
import type { JsonRequest } from "@/lib/ai/types";
const a = { id: "A", arabic: " أصل اختباري مع شرط ونفي ", surrounding_context: [{ arabic: "قيد باق" }], supported_requirement_ids: ["R1"] };
const b = { id: "B", arabic: "أصل آخر للقيود فقط" };
function request(): JsonRequest {
  return { system: "Original rules", prompt: JSON.stringify({ claims: [{ claim_id: "C1", source_ids: ["A"] }, { claim_id: "C2", source_ids: ["A"] }], evidence_package: { passages: [
    { id: "A", supported_requirement_ids: ["R1"] }, { id: "B" },
  ] },
    claim_evidence: [{ claim_id: "C1", cited_originals: [a], excerpt_choices: [
      { anchor_id: "C1E1", source_id: "A", original_excerpt: a.arabic.trim() },
      { anchor_id: "C1E2", source_id: "A", original_excerpt: "شرط ونفي" },
    ] }, { claim_id: "C2", cited_originals: [a], excerpt_choices: [{ anchor_id: "C2E1", source_id: "A", original_excerpt: a.arabic.trim() }] }], restriction_context: [b] }),
    schema: { type: "object", properties: {}, required: [] }, maxOutputTokens: 9000, structuredOutput: true };
}
it("round-trips every original, context, source identity, anchor and claim without changing the output contract", () => {
  const req = request(), packed = shareReviewOriginals(req), body = JSON.parse(packed.prompt);
  expect(JSON.stringify(restoreReviewOriginals(body))).toBe(req.prompt);
  expect(body.original_catalog).toEqual({ A: a, B: b });
  expect(body.evidence_package.passages).toEqual(["A", "B"]);
  expect(body.claim_evidence[0].excerpt_choices[1].original_excerpt).toBe("شرط ونفي");
  expect(packed.schema).toBe(req.schema); expect(packed.maxOutputTokens).toBe(9000);
  expect(packed.system).toContain("for restrictions only");
});
it("refuses conflicting originals and anchors borrowing an uncited source", () => {
  const req = request(), body = JSON.parse(req.prompt);
  body.claim_evidence[1].cited_originals[0].arabic = "changed";
  expect(() => shareReviewOriginals({ ...req, prompt: JSON.stringify(body) })).toThrow("original_identity_conflict");
  const wrong = JSON.parse(req.prompt); wrong.claim_evidence[0].excerpt_choices[0].source_id = "B";
  expect(() => shareReviewOriginals({ ...req, prompt: JSON.stringify(wrong) })).toThrow("anchor_original_invalid");
});
it("rejects missing references and cannot turn restrictive originals into a claim's own proof", () => {
  const body = JSON.parse(shareReviewOriginals(request()).prompt);
  body.claims[0].source_ids = ["missing"];
  expect(() => restoreReviewOriginals(body)).toThrow("claim_original_reference_invalid");
  const wrong = JSON.parse(shareReviewOriginals(request()).prompt);
  wrong.claim_evidence[0].excerpt_choices[0].source_id = "B";
  expect(() => restoreReviewOriginals(wrong)).toThrow("anchor_original_reference_invalid");
});
