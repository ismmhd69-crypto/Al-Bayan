import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { richReviewRequest } from "@/lib/ask/rich-review-request";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit, dependencies, pack, strictAudit } from "./fixtures/rich";

const finalOnly = ["requirement_coverage", "question_checklist_complete", "guidance_safe", "guidance_relevant",
  "complete_coverage", "listed_items_complete", "direct_summary"];
const request = (full: boolean, sourceStage = false, withGuide = full) => richReviewRequest({ items: [{ text: "A distinct invented explanation.", refs: ["Q1"], requirementId: "R1" }],
  language: "ar", full, sourceStage, question: "Invented test concern", serialized: { question: { requirements: [{ id: "R1" }] }, passages: [
    { id: "Q1", arabic: "نص تجريبي فقط", supported_requirement_ids: ["R1"] },
  ] }, guidance: withGuide ? { kind: "learning", text: "راجع النص المذكور وسياقه.", refs: [] } : null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });

it.each([false, true])("source stage omits final-only output rather than asking for empty approvals (%s)", sourceStage => {
  const req = request(false, sourceStage);
  if (req.schema.type !== "object") throw Error("schema");
  for (const key of finalOnly) {
    expect(req.schema.properties).not.toHaveProperty(key); expect(req.schema.required).not.toContain(key);
  }
  expect(req.schema.properties).toHaveProperty("claim_assessments");
  expect(req.schema.properties).toHaveProperty("citation_checks");
  expect(req.schema.properties).toHaveProperty("earlier_section_safe");
  expect(req.system).not.toContain("For full_answer=true return requirement_coverage");
  expect(JSON.parse(req.prompt)).not.toHaveProperty("next_step");
});
it("rejects the recorded failure shape in full, with no coverage-field stripping", () => {
  const req = request(false), contract = structuredOutputContract(req.schema);
  const value: any = audit(req.prompt);
  value.citation_checks = { C1: { claim_id: "C1", clauses: [{ text: "A distinct invented explanation.", supported: "yes", scope_preserved: "yes",
    qualifiers_preserved: "yes", evidence: [{ anchor_id: "C1E1" }] }] } };
  value.contribution_map = { C1: value.contribution_map[0] };
  for (const key of finalOnly) delete value[key];
  expect(contract.parse(JSON.stringify(value))).not.toBeNull();
  expect(contract.parse(JSON.stringify({ ...value, requirement_coverage: ["R1", "R2"] }))).toBeNull();
  delete value.claim_assessments; expect(contract.parse(JSON.stringify(value))).toBeNull();
});
it("retains every final coverage, guidance and summary judgment", () => {
  const req = request(true);
  if (req.schema.type !== "object") throw Error("schema");
  for (const key of finalOnly) { expect(req.schema.properties).toHaveProperty(key); expect(req.schema.required).toContain(key); }
  expect(req.system).toContain("For full_answer=true return requirement_coverage");
});
it("omits only genuinely absent guidance checks and rejects unsolicited guidance verdicts in full", () => {
  const req = request(true, false, false), contract = structuredOutputContract(req.schema);
  const response = strictAudit(req.prompt);
  expect(contract.parse(JSON.stringify(response))).not.toBeNull();
  expect(contract.parse(JSON.stringify({ ...response, guidance_safe: "yes" }))).toBeNull();
  expect(JSON.parse(req.prompt)).not.toHaveProperty("next_step");
  if (req.schema.type !== "object") throw Error("schema");
  for (const key of ["complete_coverage", "listed_items_complete", "direct_summary", "question_checklist_complete", "requirement_coverage"]) expect(req.schema.required).toContain(key);
});
it.each([true, false])("stage-only approvals do not establish final coverage (%s)", coveragePasses => {
  const deps = dependencies();
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), result: any = audit(req.prompt);
    if (!input.full_answer) for (const key of finalOnly) delete result[key];
    else if (!coveragePasses) { result.requirement_coverage = []; result.complete_coverage = "no"; }
    return result;
  };
  return runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}).then(result => {
    expect(result.status).toBe(coveragePasses ? "rich_answer" : "incomplete");
  });
});
