import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { groundedFinding, validNegativeFindings, reviewFailureCategory } from "@/lib/ask/review-findings";
import { parseMeaningReview } from "@/lib/ask/meaning-review";
import { approvedContext } from "@/lib/ask/approved-context";
import { sealedPackageJson } from "@/lib/ask/core";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit, dependencies, pack } from "./fixtures/rich";
import { richFailureKind } from "@/lib/ask/rich-answer";

// Invented administrative rules isolate protocol checks from religious truth.
const claim = { text: "يقبل الطلب إذا دفع الرسم.", refs: ["X1"] };
const evidence = { passages: [{ id: "X1", arabic: "يقبل الطلب إذا دفع الرسم وقدم التصريح." }, { id: "X2", arabic: "نص آخر" }] };
const finding = { category: "missing_qualification", claim_quote: "إذا دفع الرسم", source_id: "X1", source_quote: "وقدم التصريح" };
const negative = (f: unknown = finding) => ({ claims: { C1: { verdict: "no", explanation: "The permit prerequisite is absent.", finding: f } } });

it("grounds an Arabic missing qualification without treating its receipt as semantic proof", () => {
  expect(groundedFinding(finding, claim, evidence)).toEqual(finding);
  expect(parseMeaningReview(negative(), [claim], evidence)).toMatchObject({ safeIds: [], failures: [{ category: "missing_qualification" }] });
});
it.each([
  { ...finding, source_id: "X2", source_quote: "نص آخر" },
  { ...finding, source_quote: "تصريح آخر" },
  { ...finding, claim_quote: "لا يشترط تصريح" },
  { ...finding, category: "question_coverage" },
  null,
])("invalid negatives cannot become writer corrections or religious findings: %j", f => {
  expect(parseMeaningReview(negative(f), [claim], evidence)).toBeNull();
});
it("accepts a scripted positive paraphrase without demanding identical words", () => {
  expect(parseMeaningReview({ claims: { C1: { verdict: "yes", explanation: "" } } },
    [{ text: "Approval requires both payment and a permit.", refs: ["X1"] }], evidence)?.safeIds).toEqual(["C1"]);
});
it("validates primary negative receipts independently of the overall verdict", () => {
  const row = { claim_id: "C1", direct_support: "yes", audience_preserved: "yes", conditions_preserved: "no", scope_preserved: "yes", causal_meaning_preserved: "yes", finding };
  expect(validNegativeFindings([row], [claim], evidence)).toBe(true);
  expect(validNegativeFindings([{ ...row, finding: null }], [claim], evidence)).toBe(false);
});
it("uses the actual identity of restrictive context and never borrows an unrelated source", () => {
  const e = { passages: [{ id: "X1", arabic: "نص أصلي", approved_context: [{ source_id: "X3", arabic: "قيد مهم", location: "approved source", relationship: "selected_scholar_explanation", citable: true }] }] };
  expect(groundedFinding({ ...finding, source_id: "X3", source_quote: "قيد مهم" }, claim, e)).not.toBeNull();
  expect(groundedFinding({ ...finding, source_id: "X1", source_quote: "قيد مهم" }, claim, e)).toBeNull();
});
it("retains checked progress and spends no correction on an invented primary receipt", async () => {
  const deps = dependencies(); let corrections = 0;
  const write = deps.writer.generateJson;
  deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).correction) corrections++; return write(req); };
  deps.verifier.generateJson = async req => {
    const r = audit(req.prompt);
    if (JSON.parse(req.prompt).review_stage === "source_explanations") Object.assign(r.claim_assessments[0], {
      conditions_preserved: "no", reason_codes: ["condition_lost"], explanation: "A condition is absent.",
      finding: { ...finding, source_id: "Q2:183", source_quote: "invented source wording" },
    });
    return r;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result).toMatchObject({ status: "incomplete", withdraw: false, failureKind: "checker_failure" });
  expect(result.status === "incomplete" && result.sections?.[0].outcome).toBe("ready");
  expect(corrections).toBe(0);
});
it("keeps approved context traceable and cannot link an absent or non-scholar source", () => {
  const p = structuredClone(pack), passage = p.passages[0];
  passage.context = [p.passages[0].source.kind === "quran" ? p.passages[0].source.verse : (() => { throw Error(); })()];
  passage.explanationSourceIds = [p.passages[2].id, "Sunknown", p.passages[1].id];
  const records = approvedContext(passage, p);
  expect(records.map(r => r.relationship)).toEqual(["neighbouring_verse", "selected_scholar_explanation"]);
  expect(records.every(r => r.citable && r.location && r.arabic)).toBe(true);
  expect(sealedPackageJson(p, "ar", false, true, true).passages[0]).toHaveProperty("approved_context", records);
  expect(sealedPackageJson(p, "en", false, false).passages[0]).not.toHaveProperty("approved_context");
});
it("keeps completion, qualification and transport outcomes distinct", () => {
  expect(reviewFailureCategory(["condition_lost"])).toBe("missing_qualification");
  expect(reviewFailureCategory(["surviving_coverage_missing"])).toBe("question_coverage");
  expect(reviewFailureCategory(["negative_finding_invalid", "condition_lost"])).toBe("checker_failure");
  expect(richFailureKind({ status: "incomplete", failureKind: "checker_failure" })).toBe("checker_failure");
  expect(richFailureKind({ status: "rich_answer", failureKind: "checker_failure" })).toBeNull();
  expect(richFailureKind({ status: "incomplete", failureKind: "invented" })).toBeNull();
});
