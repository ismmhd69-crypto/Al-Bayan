import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import cases from "./fixtures/claim-audit-cases.json";
import { evaluationAccepted, evaluationInput, evaluationSummary, frozenAuditCases } from "../scripts/evaluate-claim-audit";
import { screeningRequest } from "@/lib/ask/core";
import { CLAIM_AUDIT_FIELDS } from "@/lib/ask/checks";

describe("frozen source-faithfulness evaluation", () => {
  it("never treats an empty or partial evaluation as a passed detection gate", () => {
    expect(evaluationSummary([]).every((r) => !r.detectionGatePassed)).toBe(true);
    const rows = frozenAuditCases().map((item) => ({ id: item.id, audit: true, expected: item.expected, accepted: item.expected === "accept", seconds: 1 }));
    expect(evaluationSummary(rows)[1].detectionGatePassed).toBe(true);
    expect(evaluationSummary(rows.slice(1))[1].detectionGatePassed).toBe(false);
    const unsafe = rows.map((r) => ({ ...r }));
    unsafe.find((r) => r.expected === "reject")!.accepted = true;
    expect(evaluationSummary(unsafe)[1].detectionGatePassed).toBe(false);
  });
  it("contains four recorded packages of each kind, with three-language paired summaries", () => {
    expect(cases.packages).toHaveLength(12);
    for (const kind of ["quran", "hadith", "scholar"]) expect(cases.packages.filter((p) => p.kind === kind)).toHaveLength(4);
    const inputs = frozenAuditCases();
    expect(inputs).toHaveLength(72);
    expect(new Set(inputs.map((i) => i.id)).size).toBe(72);
    for (const item of cases.packages) {
      for (const language of ["en", "de", "ar"] as const) {
        const pair = item.summaries[language];
        expect(pair.faithful).not.toBe(pair.incorrect);
        expect(pair.faithful.length).toBeLessThanOrEqual(300);
        expect(pair.incorrect.length).toBeLessThanOrEqual(300);
      }
      const recorded = JSON.parse(readFileSync(item.provenance.record, "utf8"));
      const original = recorded.rows.find((r: { id: string }) => r.id === item.provenance.row).candidates
        .find((c: { id: string }) => c.id === item.candidate.id);
      expect(original).toEqual(item.candidate);
      expect(createHash("sha256").update(JSON.stringify(original)).digest("hex")).toBe(item.provenance.candidate_sha256);
    }
  });
  it("uses the production screening builder and never supplies expected labels to the AI", () => {
    for (const item of frozenAuditCases()) {
      const { evidence, answer } = evaluationInput(item);
      for (const audit of [false, true]) {
        const request = screeningRequest(answer, evidence, item.language, audit);
        const prompt = JSON.parse(request.prompt);
        expect(prompt.claims[0].claim).toBe(item.summary);
        expect(prompt.claims[0].passages[0].arabic).toBeTruthy();
        expect(prompt).not.toHaveProperty("expected");
        expect(prompt).not.toHaveProperty("category");
        expect(request.maxOutputTokens).toBe(2048);
      }
    }
  });
  it("measures acceptance against all production gates, not the expected label", () => {
    const item = frozenAuditCases()[0];
    const { answer } = evaluationInput(item);
    const raw = { answers_question: "yes", covers_facets: "yes", fair_picture: "yes", context_preserved: "yes",
      direct_answer_complete: "yes", listed_items_complete: "yes", no_repetition: "yes", not_established_ok: "yes",
      requirement_verdicts: [{ requirement_id: "R1", verdict: "yes" }],
      claim_assessments: [{ claim_id: "C1", source_ids: answer.claims[0].refs,
        ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((f) => [f, "yes"])), reason_codes: [], explanation: "" }],
    };
    expect(evaluationAccepted(raw, answer, true)).toBe(true);
    expect(evaluationAccepted({ ...raw, context_preserved: "no" }, answer, true)).toBe(false);
    expect(evaluationAccepted({ ...raw, claim_assessments: [] }, answer, true)).toBe(false);
    expect(evaluationAccepted({ ...raw, verdicts: ["supported"] }, answer, false)).toBe(true);
  });
});
