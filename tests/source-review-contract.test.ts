import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { richReviewRequest, normalizeRichReview } from "@/lib/ask/rich-review-request";
import { CLAIM_AUDIT_FIELDS, CLAIM_AUDIT_REASONS, parseClaimAudit } from "@/lib/ask/checks";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit, dependencies, pack, strictAudit } from "./fixtures/rich";

const finalOnly = ["requirement_coverage", "question_checklist_complete", "guidance_safe", "guidance_relevant",
  "complete_coverage", "listed_items_complete", "direct_summary"];
const request = (full: boolean, sourceStage = false, withGuide = full) => richReviewRequest({ items: [{ text: "A distinct invented explanation.", refs: ["Q1"], requirementId: "R1" }],
  language: "ar", full, sourceStage, question: "Invented test concern", serialized: { question: { requirements: [{ id: "R1" }] }, passages: [
    { id: "Q1", arabic: "نص تجريبي فقط", supported_requirement_ids: ["R1"] },
  ] }, guidance: withGuide ? { kind: "learning", text: "راجع النص المذكور وسياقه.", refs: [] } : null, translationCandidates: [], summaryCount: 0, earlierCount: 0 });
it("reviews answer polarity as part of the complete assertion and retains explicit scope restrictions", () => {
  const system = request(true).system;
  expect(system).toContain("do not turn a discourse fragment into an independent religious claim");
  expect(system).toContain("Judge the complete sentence and visitor question");
  expect(system).toContain("examples alone cannot establish a new general rule");
  expect(system).toContain("specific outcome, cause or personal ruling still needs explicit support");
});

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
  value.attribution_checks = { C1: value.attribution_checks[0] };
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

it("derives only duplicate reason labels while preserving every required decision and strict envelope", () => {
  const old = request(false);
  const saved = JSON.parse(old.prompt);
  const wire = richReviewRequest({ items: [{ text: "A distinct invented explanation.", refs: ["Q1"], requirementId: "R1" }],
    language: "ar", full: false, question: "Invented test concern", serialized: { ...saved.evidence_package, passages: saved.claim_evidence.flatMap((row: { cited_originals: unknown[] }) => row.cited_originals) },
    guidance: null, translationCandidates: [], summaryCount: 0, earlierCount: 0, deriveAuditReasons: true });
  const response: any = strictAudit(old.prompt);
  response.audit_contract = "field_verdicts_v2";
  for (const row of response.claim_assessments) delete row.reason_codes;
  const contract = structuredOutputContract(wire.schema);
  expect(contract.parse(JSON.stringify(response))).not.toBeNull();
  const extra = structuredClone(response); extra.claim_assessments[0].reason_codes = [];
  expect(contract.parse(JSON.stringify(extra))).toBeNull();
  expect(normalizeRichReview(extra)).toBeNull();
  for (const field of CLAIM_AUDIT_FIELDS) {
    const missing = structuredClone(response); delete missing.claim_assessments[0][field];
    expect(contract.parse(JSON.stringify(missing))).toBeNull(); expect(normalizeRichReview(missing)).toBeNull();
  }
  for (const field of ["claim_id", "source_ids", "finding", "explanation"]) {
    const missing = structuredClone(response); delete missing.claim_assessments[0][field];
    expect(contract.parse(JSON.stringify(missing))).toBeNull();
  }
  const claims = [{ text: "An invented statement.", refs: ["Q1"] }];
  for (let pattern = 0; pattern < 243; pattern++) {
    let value = pattern;
    const decisions = CLAIM_AUDIT_FIELDS.map(() => { const d = ["yes", "no", "unsure"][value % 3]; value = Math.floor(value / 3); return d; });
    const reasons = decisions.flatMap((decision, i) => decision === "yes" ? [] : [CLAIM_AUDIT_REASONS[i]]);
    const row = { claim_id: "C1", source_ids: ["Q1"], ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((f, i) => [f, decisions[i]])),
      explanation: reasons.length ? "An invented negative comparison." : "" };
    const legacy = { claim_assessments: [{ ...row, reason_codes: reasons }] };
    const normalized = normalizeRichReview({ audit_contract: "field_verdicts_v2", claim_assessments: [row] });
    expect(parseClaimAudit(normalized, claims)).toEqual(parseClaimAudit(legacy, claims));
    expect(parseClaimAudit(normalized, claims)?.supported).toBe(reasons.length === 0);
  }
});
