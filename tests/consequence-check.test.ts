import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assertsValidity, checkConsequences } from "../lib/ask/consequence-check";
import { richReviewRequest } from "../lib/ask/rich-review-request";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { pack, dependencies, audit } from "./fixtures/rich";
const bad = { text: "بين النبي صلى الله عليه وسلم أن ترك الكذب والفعل الباطل أثناء الصيام يعد أمرا أساسيا لمن أراد صحة صيامه.", refs: ["HE66270"], requirementId: "R1" };
const source = { id: "HE66270", arabic: "عبارة تجريبية عن أخلاق حسنة ونقص الثواب، وليست نقلا من حديث." };
describe("explicit consequence protection", () => {
 it("rejects the recorded displayed validity claim despite a generic all-yes checker approval", () => {
  const oldApproval = { all_claims_consistent: "yes", claim_assessments: [{ claim_id: "C1", direct_support: "yes", conditions_preserved: "yes", scope_preserved: "yes" }] };
  expect(checkConsequences(oldApproval, [bad], [source]).blocked).toEqual(["C1"]);
 });
 it("does not accept reward or an unanchored justification as validity evidence", () => {
  const row = { claim_id: "C1", source_id: source.id, claim_effect: "validity", original_effect: "reward", same_consequence: "yes", original_excerpt: source.arabic };
  expect(checkConsequences({ consequence_checks: [row] }, [bad], [source]).blocked).toEqual(["C1"]);
  expect(checkConsequences({ consequence_checks: [{ ...row, original_effect: "validity" }] }, [bad], [source]).blocked).toEqual(["C1"]);
  expect(checkConsequences({ consequence_checks: [{ ...row, original_effect: "validity", original_excerpt: "هذه العبادة باطلة بعبارة مختلقة ليست في المصدر" }] }, [bad], [source]).blocked).toEqual(["C1"]);
 });
 it("requires the same proof category across subjects and languages", () => {
  for (const text of ["هذه الصلاة باطلة.", "That contract is invalid.", "Dieses Gebet ist ungültig.", "يلزم ذلك لصحة العمل."]) expect(assertsValidity(text)).toBe(true);
  const original = { id: "S1", arabic: "نص تجريبي مستقل يقول إن هذا العمل باطل في الحالة المحددة." };
  const item = { text: "That action is invalid.", refs: ["S1"] };
  expect(checkConsequences({ consequence_checks: [{ claim_id: "C1", source_id: "S1", claim_effect: "validity", original_effect: "validity", same_consequence: "yes", original_excerpt: original.arabic }] }, [item], [original]).blocked).toEqual([]);
 });
 it("does not create a validity question for a limited conduct/reward explanation", () => {
  const corrected = { ...bad, text: "يحذر الحديث الصائم من الكذب والعمل الباطل، فلا يقتصر الصيام على ترك الطعام والشراب." };
  expect(checkConsequences({}, [corrected], [source]).blocked).toEqual([]);
 });
 it("uses the actual checker builder with schema output and explicit consequence IDs", () => {
  const req = richReviewRequest({ items: [bad], language: "ar", full: false, question: "سؤال", serialized: {}, guidance: null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });
  expect(req.structuredOutput).toBe(true);
  expect(JSON.parse(req.prompt).consequence_claim_ids).toEqual(["C1"]);
  expect(req.schema.type).toBe("object");
  if (req.schema.type === "object") { expect(req.schema.properties.translation_checks).toMatchObject({ maxItems: 0 }); expect(req.schema.properties).not.toHaveProperty("requirement_coverage"); }
 });
 it("never streams a validity claim from an all-yes checker without explicit consequence proof", async () => {
  const local = structuredClone(pack); local.passages = local.passages.slice(0, 1); local.cards = local.cards.slice(0, 1);
  const deps = dependencies(); const delivered: any[] = [], codes: string[] = [];
  deps.rich = { onSection: s => delivered.push(s) }; deps.onDiagnostic = (_stage, code) => codes.push(code);
  deps.writer.generateJson = async req => {
   const p = JSON.parse(req.prompt);
   return { status: "answer", no_answer_feedback: [], ...Object.fromEntries(p.sections_to_write.map((g: string) => [g, [{ text: "The Quran states that abandoning wrongdoing is essential for valid worship.", source_ids: ["Q2:183"], requirement_id: "R1" }]])), ...(p.sections_to_write.includes("summary") ? { next_step: { text: "Study the cited explanation of this subject.", kind: "learning", refs: [] } } : {}) };
  };
  deps.verifier.generateJson = async req => audit(req.prompt);
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain this teaching", {});
  expect(result.status).toBe("incomplete");
  expect(delivered.some(s => s.outcome === "ready" && s.claims.some((c: any) => assertsValidity(c.text)))).toBe(false);
  expect(codes).toContain("rich_consequence_audit_invalid");
 });
});
