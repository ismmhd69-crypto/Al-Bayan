import { expect, it } from "vitest";
import { meaningReviewRequest, parseMeaningReview } from "../scripts/ask-restriction-review-experiment";
import { structuredOutputContract, providerShapeSchema } from "@/lib/ai/structured-output";

// Invented nonreligious standards isolate protocol behaviour, not theology.
const original = "Approve the application when the form is signed and the fee is paid. Ask for help if the form is unclear.";
const evidence = { passages: [{ id: "S1", arabic: original }] };
const item = (text: string) => [{ text, refs: ["S1"] }];
const response = () => ({ source_limits: { E1: { scope: "limited", scan_complete: "yes", limits: ["when the form is signed", "the fee is paid"] } },
  claims: { C1: { verdict: "yes", explanation: "", limit_checks: [
    { source_key: "E1", limit_index: 0, disposition: "preserved", claim_quote: "signed form", explanation: "" },
    { source_key: "E1", limit_index: 1, disposition: "preserved", claim_quote: "paid fee", explanation: "" },
  ] } } });

it("accepts an intact restriction account with grounded claim phrases", () => {
  expect(parseMeaningReview(response(), item("Approval requires a signed form and paid fee."), evidence)?.safeIds).toEqual(["C1"]);
});
it("does not let an overall yes override a missing positive prerequisite", () => {
  const row = response(); row.claims.C1.limit_checks[0] = { ...row.claims.C1.limit_checks[0], disposition: "missing", claim_quote: "", explanation: "The signature prerequisite was omitted." };
  const result = parseMeaningReview(row, item("Approval requires a paid fee."), evidence);
  expect(result?.safeIds).toEqual([]); expect(result?.failures[0].explanation).toContain("when the form is signed");
});
it("rejects an unaccounted condition even when the remaining condition passes", () => {
  const row = response(); row.claims.C1.limit_checks.shift();
  expect(parseMeaningReview(row, item("Approval requires a paid fee."), evidence)?.safeIds).toEqual([]);
});
it.each(["invented quote", "borrowed claim phrase", "unknown source", "duplicate condition", "legacy yes"])("rejects an invalid whole receipt: %s", kind => {
  const row = response();
  if (kind === "invented quote") row.source_limits.E1.limits[0] = "when the supervisor agrees";
  if (kind === "borrowed claim phrase") row.claims.C1.limit_checks[0].claim_quote = "the supervisor agrees";
  if (kind === "unknown source") row.claims.C1.limit_checks[0].source_key = "E2";
  if (kind === "duplicate condition") row.claims.C1.limit_checks[1].limit_index = 0;
  expect(parseMeaningReview(kind === "legacy yes" ? { claims: { C1: { verdict: "yes", explanation: "" } } } : row,
    item("Approval requires a signed form and paid fee."), evidence)).toBeNull();
});
it("does not approve an incomplete source scan or a limited source with no recorded limits", () => {
  const row = response(); row.source_limits.E1.scan_complete = "unsure";
  expect(parseMeaningReview(row, item("Approval requires a signed form and paid fee."), evidence)?.safeIds).toEqual([]);
  row.source_limits.E1.limits = [];
  expect(parseMeaningReview(row, item("Approval requires a signed form and paid fee."), evidence)).toBeNull();
});
it("allows an explicitly unrelated teaching without importing the restricted instruction", () => {
  const row = response(); row.claims.C1.limit_checks = row.claims.C1.limit_checks.map(c => ({ ...c, disposition: "not_applicable", claim_quote: "", explanation: "This claim only describes asking for help, not approval of an application." }));
  expect(parseMeaningReview(row, item("Ask for assistance if the document is confusing."), evidence)?.safeIds).toEqual(["C1"]);
});
it.each([
  ["يُسمح بالدخول إذا توفر تصريح ولم يوجد مانع.", "إذا توفر تصريح", "الدخول يحتاج إلى تصريح ساري", "تصريح ساري"],
  ["Zugang wird gewährt, wenn ein Ausweis vorliegt und keine Sperre besteht.", "wenn ein Ausweis vorliegt", "Zugang setzt einen gültigen Ausweis voraus.", "gültigen Ausweis"],
])("grounds receipts without language-specific topic rules", (source, restriction, claim, phrase) => {
  const row = response(); row.source_limits.E1.limits = [restriction]; row.claims.C1.limit_checks = [{ ...row.claims.C1.limit_checks[0], claim_quote: phrase }];
  expect(parseMeaningReview(row, item(claim), { passages: [{ id: "S1", arabic: source }] })?.safeIds).toEqual(["C1"]);
});
it("keeps the new transport contract strict and independently validates received output", () => {
  const req = meaningReviewRequest(item("Approval requires a signed form and paid fee."), evidence, new AbortController().signal);
  expect(JSON.parse(req.prompt).stage).toBe("narrow_meaning_review_v2");
  const contract = structuredOutputContract(req.schema!);
  expect(contract.parse(JSON.stringify(response()))).not.toBeNull();
  expect(contract.parse('{"claims":{"C1":{"verdict":"yes","explanation":""}}}')).toBeNull();
  expect(JSON.stringify(providerShapeSchema(contract.schema))).toContain("not_applicable");
});
