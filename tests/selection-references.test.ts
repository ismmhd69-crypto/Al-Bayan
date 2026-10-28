import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assessPatientEvidence } from "@/lib/ask/patient-models";
import { resolveSelectionReferences, SELECTION_REFERENCE_CONTRACT } from "@/lib/ask/selection-references";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { pack, dependencies } from "./fixtures/rich";
import { selectionReply } from "./fixtures/selection";
import { richFailureKind } from "@/lib/ask/rich-answer";
import { researchFailureText } from "@/lib/ask/research-failure-text";
import type { QuestionFrame } from "@/lib/ask/retrieval";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care"], ar: ["عناية"] } };
const response = () => ({ selection_contract: SELECTION_REFERENCE_CONTRACT, status: "insufficient", coverage: "incomplete", conflict_type: "none",
  assessments: pack.passages.map((_, i) => ({ source_ref: `P${i + 1}`, relevance: "context", context_safe: "yes", supported_requirement_ids: [], related_requirement_ids: ["R1"],
    distinct_contribution: "yes", scope_matches_question: "yes", position: "", contribution: { role: "background", scope: "general", conditions: [] } })) });
it.each(["selection_failure", "source_revalidation_unavailable"] as const)("preserves the specific reader reason %s", kind => {
  expect(richFailureKind({ status: "incomplete", failureKind: kind })).toBe(kind);
  expect(researchFailureText("en", kind)).toBeTruthy();
  expect(researchFailureText("ar", kind)).toBeTruthy();
});

it("maps exact pool references without changing relevance, roles or coverage", () => {
  const result: any = resolveSelectionReferences(response(), pack.passages);
  expect(result.assessments.map((a: any) => a.source_id)).toEqual(pack.passages.map(p => p.id));
  expect(result.assessments.every((a: any) => a.relevance === "context" && a.supported_requirement_ids.length === 0 && a.contribution.role === "background")).toBe(true);
  expect(result.coverage).toBe("incomplete");
  const planned = { ...response(), evidence_plan: [{ source_ids: ["P1", "P3"], purpose: "background" }] };
  expect((resolveSelectionReferences(planned, pack.passages) as any).evidence_plan[0].source_ids).toEqual([pack.passages[0].id, pack.passages[2].id]);
});
it("rejects unknown, duplicated and mixed references rather than guessing source IDs", () => {
  const unknown = response(); unknown.assessments[0].source_ref = "P999";
  const duplicate = response(); duplicate.assessments[1].source_ref = "P1";
  const mixed = response(); Object.assign(mixed.assessments[0], { source_id: pack.passages[0].id });
  for (const raw of [unknown, duplicate, mixed, { ...response(), evidence_plan: [{ source_ids: ["TYPO"] }] }, { ...response(), selection_contract: undefined }]) {
    expect(resolveSelectionReferences(raw, pack.passages)).toBeNull();
  }
});
it("retains useful background without promoting it into direct or complete support", async () => {
  const deps = dependencies(); deps.fixedSelectionReferences = true;
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    expect(input.candidates.map((c: any) => c.candidate_ref)).toEqual(["P1", "P2", "P3"]);
    expect(structuredOutputContract(request.schema).parse(JSON.stringify(response()))).not.toBeNull();
    return response();
  };
  const result = await assessPatientEvidence(frame, pack.passages, deps, new AbortController().signal, true);
  expect(result.pack?.partial).toBe(true);
  expect(result.pack?.passages.length).toBeGreaterThan(0);
  expect(result.pack?.passages.every(p => p.requirementIds.length === 0 && p.contribution?.role === "background")).toBe(true);
});
it("keeps unrelated and context-unsafe candidates out even with valid references", async () => {
  const deps = dependencies(); deps.fixedSelectionReferences = true;
  deps.verifier.generateJson = async request => selectionReply(JSON.parse(request.prompt), {
    status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: pack.passages.map((p, i) => ({
      source_id: p.id, relevance: i === 0 ? "unrelated" : "context", context_safe: i === 0 ? "yes" : "no", supported_requirement_ids: [], related_requirement_ids: i === 0 ? [] : ["R1"],
      distinct_contribution: "yes", scope_matches_question: "yes", position: "", contribution: { role: "background", scope: "general", conditions: [] },
    })),
  });
  expect((await assessPatientEvidence(frame, pack.passages, deps, new AbortController().signal, true)).pack).toBeNull();
});
it("treats a candidate the selector skipped as not selected and reports it (reliability plan Phase 2)", () => {
  const missing = response(); const skipped = missing.assessments.pop(); let omitted: string[] = [];
  const resolved = resolveSelectionReferences(missing, pack.passages, ids => { omitted = ids; }) as { assessments: { source_id: string }[] };
  expect(resolved).not.toBeNull();
  expect(omitted).toEqual([pack.passages[Number(skipped!.source_ref.slice(1)) - 1].id]);
  expect(resolved.assessments.map(a => a.source_id)).not.toContain(omitted[0]);
});
