import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { diagnosticLogger } from "@/lib/ask/diagnostics";
import { parseEvidencePackage, type PassageForSelection, type QuestionFrame } from "@/lib/ask/retrieval";
import { CLAIM_AUDIT_FIELDS, parseClaimAudit } from "@/lib/ask/checks";

const recorded = JSON.parse(readFileSync("docs/ask-repair-runs/baseline-1.json", "utf8")).rows as {
  id: string; frame?: QuestionFrame; candidates?: PassageForSelection[]; selection?: unknown;
}[];
const sample = recorded.find((row) => row.id === "zakah-en")!;
const frame = sample.frame!;
const candidates = sample.candidates!;
const assessment = { source_id: candidates[0].id, relevance: "direct", context_safe: "yes", supported_requirement_ids: frame.requirements.map((r) => r.id), position: "" };
const selection = () => ({ status: "ready", coverage: "complete", conflict_type: "none", assessments: [{ ...assessment }] });
const claims = [{ text: "A controlled example.", refs: ["Q16:91"] }];
const audit = () => ({ claim_assessments: [{ claim_id: "C1", source_ids: ["Q16:91"],
  ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((field) => [field, "yes"])), reason_codes: [], explanation: "" }] });

describe("reason-only Ask diagnostics", () => {
  it("replays every recorded selection without changing acceptance or packages", () => {
    let count = 0;
    for (const row of recorded) {
      if (!row.frame || !row.candidates || !row.selection) continue;
      const diagnostic = vi.fn();
      const before = JSON.stringify(row);
      const normal = parseEvidencePackage(row.selection, row.frame, row.candidates);
      expect(parseEvidencePackage(row.selection, row.frame, row.candidates, {}, diagnostic)).toEqual(normal);
      expect(diagnostic).toHaveBeenCalledTimes(normal ? 0 : 1);
      expect(JSON.stringify(row)).toBe(before);
      count++;
    }
    expect(count).toBeGreaterThan(15);
  });
  it("identifies a recorded refusal, without claiming it is the new promises failure", () => {
    const diagnostic = vi.fn();
    expect(parseEvidencePackage(sample.selection, frame, candidates, {}, diagnostic)).toBeNull();
    expect(diagnostic).toHaveBeenCalledWith("no_direct_evidence_with_requirements");
    expect(parseEvidencePackage(selection(), frame, candidates, {}, diagnostic)).not.toBeNull();
  });
  it.each([
    ["source_id_invalid_or_unknown", { source_id: "invented" }],
    ["relevance_invalid", { relevance: "maybe" }],
    ["context_decision_missing", { context_safe: undefined }],
    ["no_direct_evidence_unsafe_context", { context_safe: "unsure" }],
    ["requirement_ids_invalid_or_unknown", { supported_requirement_ids: ["R999"] }],
    ["non_direct_requirement_assignment", { relevance: "partial" }],
  ])("explains %s but still refuses", (code, change) => {
    const raw = selection(); Object.assign(raw.assessments[0], change);
    const diagnostic = vi.fn();
    expect(parseEvidencePackage(raw, frame, candidates, {}, diagnostic)).toBeNull();
    expect(diagnostic).toHaveBeenCalledWith(code);
  });
  it("distinguishes unavailable coverage from coverage blocked by source caps", () => {
    const raw = selection();
    const diagnostic = vi.fn();
    expect(parseEvidencePackage(raw, frame, candidates, { caps: { quranCards: 0, hadith: 0, scholar: 0, passages: 0 } }, diagnostic)).toBeNull();
    expect(diagnostic).toHaveBeenCalledWith("package_caps_prevent_coverage");
  });
  it.each([
    ["claim_id_unknown", { claim_id: "C999" }],
    ["citation_ids_mismatch", { source_ids: ["invented"] }],
    ["audience_preserved_missing", { audience_preserved: undefined }],
    ["scope_preserved_invalid", { scope_preserved: true }],
    ["reason_codes_disagree_with_decisions", { audience_preserved: "no" }],
    ["positive_assessment_has_explanation", { explanation: "Faithful." }],
    ["explanation_too_long", { explanation: "x".repeat(241) }],
  ])("explains malformed audit %s without forwarding text", (code, change) => {
    const raw = audit(); Object.assign(raw.claim_assessments[0], change);
    const diagnostic = vi.fn();
    expect(parseClaimAudit(raw, claims, diagnostic)).toBeNull();
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith(code);
    expect(parseClaimAudit(raw, claims)).toBeNull();
  });
  it("keeps valid negative and uncertain assessments separate from malformed results", () => {
    for (const decision of ["no", "unsure"]) {
      const raw = audit(); Object.assign(raw.claim_assessments[0], { audience_preserved: decision,
        reason_codes: ["audience_changed"], explanation: "The addressed group changed." });
      const diagnostic = vi.fn();
      expect(parseClaimAudit(raw, claims, diagnostic)).toEqual(parseClaimAudit(raw, claims));
      expect(parseClaimAudit(raw, claims)?.supported).toBe(false);
      expect(diagnostic).not.toHaveBeenCalled();
    }
  });
  it("logs only fixed metadata and rejects untrusted text in metadata", () => {
    const sink = vi.fn();
    const context = { requestId: "controlled-1", revision: "bc2a729", writerChain: "openrouter/google/writer",
      verifierChain: "openrouter/google/checker|fallback:openrouter/mistral/checker", claimAudit: false, tiered: false, lean: false };
    diagnosticLogger(false, context, sink)("selection", "coverage_missing_or_invalid", 12080);
    expect(sink).not.toHaveBeenCalled();
    const logger = diagnosticLogger(true, context, sink);
    logger("selection", "coverage_missing_or_invalid", 12080);
    expect(JSON.parse(sink.mock.calls[0][0].split("ask diagnostic: ")[1])).toMatchObject({
      revision: "bc2a729", claim_audit: false, stage: "selection", code: "coverage_missing_or_invalid", elapsed_ms: 12080,
    });
    logger("selection", "visitor question?", 1);
    expect(sink).toHaveBeenCalledTimes(1);
    diagnosticLogger(true, { ...context, writerChain: "secret\nquestion text", revision: "source excerpt" }, sink)("screening", "assessments_missing", 2);
    expect(sink.mock.calls[1][0]).not.toMatch(/secret|source excerpt|question text/);
  });
});
