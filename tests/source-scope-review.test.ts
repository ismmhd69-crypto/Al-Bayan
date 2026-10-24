import { expect, it } from "vitest";
import { sourceScopeReviewRequest, parseSourceScopeReview } from "../lib/ask/source-scope-review";
import { structuredOutputContract } from "../lib/ai/structured-output";
// Invented Arabic fixture; no religious source or accuracy claim.
const originals = [{ id: "A", arabic: "الطلاب الذين حضروا ودرسوا ينالون شهادة" }, { id: "B", arabic: "نص آخر لا علاقة له" }];
const items = [{ text: "الطلاب يحصلون على شهادة بعد الحضور والدراسة", refs: ["A"] }];
const row = () => ({ source_readings: [{ source_id: "A", subject_excerpt: "الطلاب الذين حضروا ودرسوا", assertion_excerpt: "ينالون شهادة", conditions: ["حضروا ودرسوا"] }],
  claim_subject: "الطلاب", claim_conditions: ["بعد الحضور والدراسة"], same_subject_and_activity: "yes", necessary_conditions_preserved: "yes", no_added_assertion: "yes", explanation: "" });
it("sends only own originals without expected verdicts or earlier approvals", () => {
  const req = sourceScopeReviewRequest(items, originals, new AbortController().signal);
  const data = JSON.parse(req.prompt);
  expect(data.cases[0].originals).toEqual([{ source_id: "A", arabic: originals[0].arabic }]);
  expect(Object.keys(data.cases[0]).sort()).toEqual(["claim", "claim_id", "originals"]);
  expect(req.maxOutputTokens).toBe(2100);
  expect(() => structuredOutputContract(req.schema)).not.toThrow();
});
it("requires explicit anchored comparison but does not treat anchors alone as approval", () => {
  expect(parseSourceScopeReview({ comparisons: { C1: row() } }, items, originals)?.safeIds).toEqual(["C1"]);
  const rejected = { ...row(), necessary_conditions_preserved: "no", explanation: "Missing one required property." };
  expect(parseSourceScopeReview({ comparisons: { C1: rejected } }, items, originals)?.failures).toHaveLength(1);
});
it.each([
  (r: any) => { r.source_readings[0].source_id = "B"; },
  (r: any) => { r.source_readings[0].conditions = ["invented condition"]; },
  (r: any) => { r.source_readings[0].subject_excerpt = "invented person"; },
  (r: any) => { r.source_readings[0].assertion_excerpt = "invented reward"; },
  (r: any) => { r.claim_subject = "invented person"; },
  (r: any) => { r.claim_conditions = ["invented condition"]; },
  (r: any) => { r.source_readings = []; },
  (r: any) => { r.source_readings.push(r.source_readings[0]); },
  (r: any) => { r.unexpected = true; },
  (r: any) => { r.no_added_assertion = "unsure"; },
  (r: any) => { r.explanation = "Unpermitted positive explanation"; },
])("rejects malformed, unbound or incomplete comparison %#", mutate => {
  const r = row(); mutate(r);
  expect(parseSourceScopeReview({ comparisons: { C1: r } }, items, originals)).toBeNull();
});
it("rejects omitted cases and missing cited originals before a request", () => {
  expect(parseSourceScopeReview({ comparisons: {} }, items, originals)).toBeNull();
  expect(() => sourceScopeReviewRequest([{ ...items[0], refs: ["missing"] }], originals, new AbortController().signal)).toThrow();
  expect(() => sourceScopeReviewRequest(items, [...originals, originals[0]], new AbortController().signal)).toThrow();
});
