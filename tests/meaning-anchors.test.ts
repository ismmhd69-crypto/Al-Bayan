import { expect, it } from "vitest";
import { meaningReviewRequest, parseMeaningReview } from "@/lib/ask/meaning-review";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { positiveMeaningFixture } from "./fixtures/meaning";

// Real spelling contrast from the failed trace; verdicts are scripted. These
// controls prove source identity and refusal behaviour, not religious correctness.
const original = "وَٱلْكَـٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ";
const modern = "وَٱلْكَاظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ";
const items = [{ text: "Holding back anger and pardoning others.", refs: ["Q3:134"] }];
const serialized = { passages: [{ id: "Q3:134", type: "quran", arabic: original,
  surrounding_context: [{ id: "Q3:133", arabic: "سياق تجريبي لا يثبت ادعاء جديدا" }] }] };
const request = () => meaningReviewRequest(items, serialized, new AbortController().signal, "anchored");
const response = () => positiveMeaningFixture(JSON.parse(request().prompt));
it("replays the Uthmani mismatch and removes model-typed Arabic from the active wire contract", () => {
  const old = { meaning_contract: "condition_logic_v2", claims: { C1: { verdict: "yes", explanation: "", finding: { category: "source_support", claim_quote: "", source_id: "", source_quote: "" },
    condition_comparisons: [{ source_id: "Q3:134", source_excerpt: modern, claim_excerpt: items[0].text, source_join: "all", claim_join: "all" }] } } };
  expect(parseMeaningReview(old, items, serialized, true)).toBeNull();
  expect(parseMeaningReview(old, items, serialized, "anchored")).toBeNull();
  const req = request(), input = JSON.parse(req.prompt), raw = response();
  expect(input.claims[0].condition_excerpt_choices[0].original_excerpt).toBe(original);
  expect(JSON.stringify(req.schema)).not.toContain('"source_excerpt"');
  expect(JSON.stringify(req.schema)).not.toContain('"source_quote"');
  expect(structuredOutputContract(req.schema).parse(JSON.stringify(raw))).not.toBeNull();
  expect(parseMeaningReview(raw, items, serialized, "anchored")?.safeIds).toEqual(["C1"]);
});
it("rejects unknown, mismatched and context-only positive anchors instead of repairing them", () => {
  for (const edit of ["unknown", "source", "context", "typed"] as const) {
    const raw: any = response(), row = raw.claims.C1.condition_comparisons[0];
    if (edit === "unknown") row.source_anchor_id = "C99E1";
    if (edit === "source") row.source_id = "Q42:37";
    if (edit === "context") row.source_anchor_id = JSON.parse(request().prompt).claims[0].negative_excerpt_choices.find((a: any) => a.source_id === "Q3:133").anchor_id;
    if (edit === "typed") row.source_excerpt = modern;
    expect(parseMeaningReview(raw, items, serialized, "anchored")).toBeNull();
  }
});
it("still refuses altered condition logic even when the model votes yes", () => {
  const raw = response(); raw.claims.C1.condition_comparisons[0].source_join = "all";
  raw.claims.C1.condition_comparisons[0].claim_join = "any";
  const checked = parseMeaningReview(raw, items, serialized, "anchored");
  expect(checked?.safeIds).toEqual([]);
  expect(checked?.failures[0]).toMatchObject({ category: "missing_qualification", finding: { source_quote: original } });
});
it("grounds negative findings in exact restrictive context without using it as positive evidence", () => {
  const raw = response(), context = JSON.parse(request().prompt).claims[0].negative_excerpt_choices.find((a: any) => a.source_id === "Q3:133");
  raw.claims.C1.verdict = "no"; raw.claims.C1.explanation = "Scripted restrictive-context control.";
  raw.claims.C1.finding = { category: "context_needed", claim_quote: items[0].text, source_id: context.source_id, source_anchor_id: context.anchor_id };
  expect(parseMeaningReview(raw, items, serialized, "anchored")?.failures[0]).toMatchObject({ finding: { source_quote: context.original_excerpt } });
});
