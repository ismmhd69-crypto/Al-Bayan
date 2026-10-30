import { expect, it } from "vitest";
import { richReviewRequest, normalizeRichReview } from "@/lib/ask/rich-review-request";
import { meaningAnchors } from "@/lib/ask/meaning-anchors";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { CLAIM_AUDIT_FIELDS } from "@/lib/ask/checks";
import { PRIMARY_ANCHOR_CONTRACT } from "@/lib/ask/primary-review-anchors";

// Invented controls. A bound negative is repair feedback, never approval.
const items = [{ text: "A test assertion requires both prerequisites.", refs: ["S1"], requirementId: "R1" }];
const original = "نص اختباري يتطلب الشرط الأول والشرط الثاني";
const serialized = { question: { requirements: [{ id: "R1", text: "Test prerequisites" }] }, passages: [{ id: "S1", arabic: original, supported_requirement_ids: ["R1"] }] };
function negative() {
  return { audit_contract: PRIMARY_ANCHOR_CONTRACT, claim_assessments: [{ claim_id: "C1", source_ids: ["S1"],
    ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f => [f, "yes"])), conditions_preserved: "no", explanation: "Preserve both prerequisites.",
    finding: { category: "missing_qualification", claim_quote: items[0].text, source_id: "S1", source_anchor_id: "C1E1" },
  }] };
}
it("resolves an anchored negative to unchanged original text without changing its decision", () => {
  const parsed: any = normalizeRichReview(negative(), items, serialized, true);
  expect(parsed.claim_assessments[0]).toMatchObject({ conditions_preserved: "no", reason_codes: ["condition_lost"], explanation: "Preserve both prerequisites.", finding: { source_quote: original } });
  expect(normalizeRichReview({ ...negative(), audit_contract: "field_verdicts_v2" }, items, serialized, true)).toBeNull();
});
it("rejects invented, mixed-contract and unrelated claim findings", () => {
  for (const change of [{ source_anchor_id: "C2E1" }, { source_quote: original }, { claim_quote: "Not in the actual claim." }]) {
    const raw = negative(); Object.assign(raw.claim_assessments[0].finding, change);
    expect(normalizeRichReview(raw, items, serialized, true)).toBeNull();
  }
});
it("offers only existing originals and restrictive context as negative choices", () => {
  const context = { ...serialized, passages: [{ ...serialized.passages[0], surrounding_context: [{ id: "Q2", arabic: "قيد اختباري مرتبط بالمصدر" }] }] };
  const choices = meaningAnchors(items, context).findings.C1;
  expect(choices.map(a => a.source_id)).toEqual(["S1", "Q2"]);
  const raw = negative(); raw.claim_assessments[0].finding.source_id = "Q2"; raw.claim_assessments[0].finding.source_anchor_id = "C1R1";
  expect((normalizeRichReview(raw, items, context, true) as any).claim_assessments[0].finding.source_quote).toBe(context.passages[0].surrounding_context[0].arabic);
});
it("replaces generated negative source quotations in the actual summary review schema", () => {
  const request = richReviewRequest({ items, language: "en", full: true, question: "Test", serialized, guidance: null, translationCandidates: [], summaryCount: 1, earlierCount: 0, deriveAuditReasons: true, publishedOriginalIds: ["S1"] });
  const prompt = JSON.parse(request.prompt);
  expect(prompt.review_contract).toBe(PRIMARY_ANCHOR_CONTRACT);
  expect(prompt.claim_evidence[0].negative_excerpt_choices[0].original_excerpt).toBe(original);
  expect(request.system).not.toContain("Return audit_contract field_verdicts_v2");
  if (request.schema.type !== "object") throw Error("schema");
  const rows = request.schema.properties.claim_assessments;
  if (rows.type !== "array" || rows.items.type !== "object") throw Error("schema");
  expect(rows.items.properties.finding).toMatchObject({ required: ["category", "claim_quote", "source_id", "source_anchor_id"] });
  structuredOutputContract(request.schema); // Provider contract remains compilable.
});
it("keeps a negative verdict whose valid excerpt label names a different source, binding it to the label (reliability plan)", () => {
  const raw = negative(); raw.claim_assessments[0].finding.source_id = "S2";
  const parsed: any = normalizeRichReview(raw, items, serialized, true);
  expect(parsed.claim_assessments[0]).toMatchObject({ conditions_preserved: "no", finding: { source_id: "S1", source_quote: original } });
});
it("still rejects a mismatched source on an approval", () => {
  const raw = negative(); const row: any = raw.claim_assessments[0];
  row.conditions_preserved = "yes"; row.finding = { category: "source_support", claim_quote: "", source_id: "S2", source_anchor_id: "C1E1" };
  expect(normalizeRichReview(raw, items, serialized, true)).toBeNull();
});

function approved() {
  return { audit_contract: PRIMARY_ANCHOR_CONTRACT, claim_assessments: [{ claim_id: "C1", source_ids: ["S1"],
    ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f => [f, "yes"])), explanation: "",
    finding: { category: "source_support", claim_quote: "", source_id: "", source_anchor_id: "C1E1" },
  }] };
}
it("ignores only a leftover excerpt label on a full yes with an otherwise empty finding", () => {
  const parsed: any = normalizeRichReview(approved(), items, serialized, true);
  expect(parsed.claim_assessments[0].finding).toMatchObject({ category: "source_support", claim_quote: "", source_id: "", source_quote: "" });
});
it("still refuses a yes with a real finding, and never turns a negative into an approval", () => {
  const quoted = approved(); quoted.claim_assessments[0].finding.claim_quote = items[0].text;
  expect(normalizeRichReview(quoted, items, serialized, true)).toBeNull();
  const category = approved(); category.claim_assessments[0].finding.category = "missing_qualification";
  expect(normalizeRichReview(category, items, serialized, true)).toBeNull();
  const unsure = approved(); (unsure.claim_assessments[0] as any).direct_support = "unsure";
  expect(normalizeRichReview(unsure, items, serialized, true)).toBeNull();
  const noAnchor = negative(); noAnchor.claim_assessments[0].finding.source_anchor_id = "nope";
  expect(normalizeRichReview(noAnchor, items, serialized, true)).toBeNull();
});

it("accepts a full yes that points at the excerpt it read, but refuses a label and source that disagree", () => {
  const matching = approved(); matching.claim_assessments[0].finding.source_id = "S1";
  expect((normalizeRichReview(matching, items, serialized, true) as any).claim_assessments[0].finding).toMatchObject({ source_id: "", source_quote: "" });
  const mismatched = approved(); mismatched.claim_assessments[0].finding.source_id = "S2";
  expect(normalizeRichReview(mismatched, items, serialized, true)).toBeNull();
});
