import { expect, it } from "vitest";
import { canonicalNegativeFinding, groundedFinding } from "@/lib/ask/review-findings";
import { normalizeRichReview } from "@/lib/ask/rich-review-request";

const claim = { text: "An invented explanation for a text-matching test.", refs: ["Q1"] };
const original = "شَـرْطٌ أَوَّلٌ وَشَرْطٌ ثَانٍ";
const serialized = { passages: [{ id: "Q1", arabic: original }] };
const finding = { category: "context_needed" as const, claim_quote: claim.text, source_id: "Q1", source_quote: "شرط أول وشرط ثان" };

it("resolves lost Arabic display marks to the unique untouched original, keeping the negative decision", () => {
  expect(groundedFinding(finding, claim, serialized)).toBeNull(); // Legacy exact binding is unchanged.
  expect(canonicalNegativeFinding(finding, claim, serialized)?.source_quote).toBe(original);
  const row = { claim_id: "C1", source_ids: ["Q1"], direct_support: "unsure", audience_preserved: "yes", conditions_preserved: "yes", scope_preserved: "yes", causal_meaning_preserved: "yes", explanation: "An invented negative finding.", finding };
  const parsed: any = normalizeRichReview({ audit_contract: "field_verdicts_v2", claim_assessments: [row] }, [claim], serialized);
  expect(parsed.claim_assessments[0]).toMatchObject({ direct_support: "unsure", reason_codes: ["unsupported_meaning"], finding: { source_quote: original } });
});
it("never substitutes another source, changed words, or an ambiguous normalized occurrence", () => {
  expect(canonicalNegativeFinding({ ...finding, source_id: "Q2" }, claim, serialized)).toBeNull();
  expect(canonicalNegativeFinding({ ...finding, source_quote: "شرط أول أو شرط ثان" }, claim, serialized)).toBeNull();
  expect(canonicalNegativeFinding({ ...finding, claim_quote: "Another claim." }, claim, serialized)).toBeNull();
  expect(canonicalNegativeFinding(finding, claim, { passages: [{ id: "Q1", arabic: original + "، " + original }] })).toBeNull();
});
it("binds a supplied restrictive context only to its own existing identity", () => {
  const context = { passages: [{ id: "Q1", arabic: "نص اختباري آخر", surrounding_context: [{ id: "Q2", arabic: original }] }] };
  expect(canonicalNegativeFinding({ ...finding, source_id: "Q2" }, claim, context)?.source_quote).toBe(original);
  expect(canonicalNegativeFinding(finding, claim, context)).toBeNull();
});
