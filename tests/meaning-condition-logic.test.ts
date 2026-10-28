import { expect, it } from "vitest";
import { meaningReviewRequest, parseMeaningReview } from "@/lib/ask/meaning-review";
import { structuredOutputContract } from "@/lib/ai/structured-output";

// Invented language controls. No religious judgment or topic/source routing.
const original = "ينجح الاختبار إذا تحقق الشرط الأول والشرط الثاني";
const claim = { text: "تتحقق النتيجة إذا توفر الشرط الأول أو الشرط الثاني.", refs: ["S1"] };
const serialized = { passages: [{ id: "S1", arabic: original }] };
function response(sourceJoin = "all", claimJoin = "any") {
  return { meaning_contract: "condition_logic_v2", claims: { C1: { verdict: "yes", explanation: "",
    finding: { category: "source_support", claim_quote: "", source_id: "", source_quote: "" },
    condition_comparisons: [{ source_id: "S1", source_excerpt: original, claim_excerpt: claim.text, source_join: sourceJoin, claim_join: claimJoin }],
  } } };
}
it("does not promote bare yes when the explicit qualification comparison changes conjunction into alternatives", () => {
  const result = parseMeaningReview(response(), [claim], serialized, true);
  expect(result?.safeIds).toEqual([]);
  expect(result?.failures[0]).toMatchObject({ claim_id: "C1", category: "missing_qualification", finding: { source_id: "S1", source_quote: original } });
});
it("requires every cited original and exact source/claim excerpts before using the logic comparison", () => {
  const missing = response(); missing.claims.C1.condition_comparisons = [];
  expect(parseMeaningReview(missing, [claim], serialized, true)).toBeNull();
  const invented = response(); invented.claims.C1.condition_comparisons[0].source_excerpt = "نص غير موجود";
  expect(parseMeaningReview(invented, [claim], serialized, true)).toBeNull();
  expect(parseMeaningReview(response("unclear", "any"), [claim], serialized, true)).toBeNull();
  expect(parseMeaningReview({ claims: response().claims }, [claim], serialized, true)).toBeNull();
});
it("keeps all grounded repair details when a condition comparison also fails", () => {
  const rejected = response();
  rejected.claims.C1.verdict = "no";
  rejected.claims.C1.explanation = "The claim omits the first prerequisite and treats the second as an alternative.";
  rejected.claims.C1.finding = { category: "missing_qualification", claim_quote: claim.text, source_id: "S1", source_quote: original };
  const result = parseMeaningReview(rejected, [claim], serialized, true);
  expect(result?.safeIds).toEqual([]);
  expect(result?.failures[0].explanation).toContain(rejected.claims.C1.explanation);
  expect(result?.failures[0].explanation).toContain("different condition logic");
  expect(result?.failures[0].finding?.source_quote).toBe(original);
});
it("treats grounded uncertainty as a rejection eligible for correction, never as approval", () => {
  const uncertain = response("unclear", "any");
  uncertain.claims.C1.verdict = "unsure";
  uncertain.claims.C1.explanation = "The relationship is uncertain.";
  uncertain.claims.C1.finding = { category: "context_needed", claim_quote: claim.text, source_id: "S1", source_quote: original };
  expect(parseMeaningReview(uncertain, [claim], serialized, true)).toMatchObject({safeIds: [], failures: [{claim_id: "C1", category: "context_needed"}]});
  uncertain.claims.C1.finding.source_quote = "invented source";
  expect(parseMeaningReview(uncertain, [claim], serialized, true)).toBeNull();
});
it("retains faithful matching logic and still requires all existing negative-finding checks", () => {
  const faithful = { ...claim, text: claim.text.replace(" أو ", " و") };
  const positive = response("all", "all"); positive.claims.C1.condition_comparisons[0].claim_excerpt = faithful.text;
  expect(parseMeaningReview(positive, [faithful], serialized, true)?.safeIds).toEqual(["C1"]);
  const negative = structuredClone(positive); negative.claims.C1.verdict = "no"; negative.claims.C1.explanation = "A negative finding without its source binding.";
  expect(parseMeaningReview(negative, [faithful], serialized, true)).toBeNull();
  const request = meaningReviewRequest([claim], serialized, new AbortController().signal, true);
  const contract = structuredOutputContract(request.schema);
  expect(contract.parse(JSON.stringify(response()))).not.toBeNull();
  const missing: any = response(); delete missing.claims.C1.condition_comparisons;
  expect(contract.parse(JSON.stringify(missing))).toBeNull();
});

it("compares semantic condition logic rather than rejecting equivalent negated alternatives by keyword", () => {
  const german = { text: "Die Prüfung gilt, sofern weder Hitze noch Kälte sie beeinträchtigt.", refs: ["S1"] };
  const source = { passages: [{ id: "S1", arabic: "إذا لم تؤثر الحرارة ولم يؤثر البرد" }] };
  const matched = response("all", "all");
  matched.claims.C1.condition_comparisons[0].source_excerpt = source.passages[0].arabic;
  matched.claims.C1.condition_comparisons[0].claim_excerpt = german.text;
  expect(parseMeaningReview(matched, [german], source, true)?.safeIds).toEqual(["C1"]);
});
