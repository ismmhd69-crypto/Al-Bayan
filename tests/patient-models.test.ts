import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { selectPatientEvidence, assessPatientEvidence, checkPatientSource } from "@/lib/ask/patient-models";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import { pack, dependencies, sections, audit } from "./fixtures/rich";

describe("patient sections use real shared source checks", () => {
  it("keeps explicit unresolved concerns despite partial direct support and validates the other concern", async () => {
    const deps = dependencies(), frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care"] },
      requirements: [{ ...pack.question.requirements[0] }, { id: "R2", text: "Explain limits", facet: "conditions" }] };
    deps.verifier.generateJson = vi.fn(async () => ({ status: "insufficient", coverage: "incomplete", conflict_type: "none", missing_requirement_ids: ["R2"],
      assessments: pack.passages.map(p => ({ source_id: p.id, relevance: "direct", supported_requirement_ids: [p.source.kind === "hadith" ? "R2" : "R1"],
        context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) }));
    const result = await assessPatientEvidence(frame, pack.passages, deps, new AbortController().signal, false, true);
    expect(result.pack).toBeNull(); expect(result.missingRequirementIds).toEqual(["R2"]);
    expect(result.preview?.partial).toBe(true); expect(result.preview?.passages.some(p => p.requirementIds.includes("R2"))).toBe(true);
    expect(deps.verifier.generateJson).toHaveBeenCalledTimes(1);
  });

  it("refuses an inconsistent or malformed gap map instead of inferring completeness from source counts", async () => {
    const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care"] },
      requirements: [{ ...pack.question.requirements[0] }, { id: "R2", text: "Explain limits", facet: "conditions" }] };
    const response = { status: "insufficient", coverage: "incomplete", conflict_type: "none", missing_requirement_ids: ["R2"],
      assessments: pack.passages.map(p => ({ source_id: p.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "",
        contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) };
    const variants = [
      { ...response, missing_requirement_ids: [] }, { ...response, missing_requirement_ids: ["R2", "R2"] }, { ...response, missing_requirement_ids: ["R9"] },
      { ...response, missing_requirement_ids: ["R1"] }, { ...response, assessments: [{ source_id: "Q2:183" }], missing_requirement_ids: ["R2"] },
      { ...response, status: "ready", coverage: "complete", missing_requirement_ids: ["R2"] },
    ];
    for (const value of variants) {
      const deps = dependencies(); deps.verifier.generateJson = async () => value;
      const result = await assessPatientEvidence(frame, pack.passages, deps, new AbortController().signal, false, true);
      expect(result.pack).toBeNull(); expect(result.preview).toBeNull(); expect(result.missingRequirementIds).toBeNull();
      expect(result.rejection).toMatch(/gap_map_|combined_selection_format_invalid/);
    }
  });
  it("checks only a source explanation without prematurely writing a summary", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    const requested: string[][] = [];
    deps.writer.generateJson = async req => { requested.push(JSON.parse(req.prompt).sections_to_write); return write(req); };
    const result = await checkPatientSource("hadith", pack, "Explain care", "en", deps, new AbortController().signal);
    expect(result.outcome).toBe("ready"); expect(requested).toEqual([["hadith"]]);
  });
  it("reuses checked source wording but independently audits the whole answer with late context", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    const jobs: string[][] = []; let fullChecks = 0;
    deps.writer.generateJson = async req => { jobs.push(JSON.parse(req.prompt).sections_to_write); return write(req); };
    deps.verifier.generateJson = async req => { const input = JSON.parse(req.prompt); expect(input.full_answer).toBe(true); fullChecks++; return audit(req.prompt); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, Infinity, { checkedSections: sections.slice(0, 3) });
    expect(result.status).toBe("rich_answer"); expect(jobs).toEqual([["summary"]]); expect(fullChecks).toBe(1);
  });
  it("keeps background-only source packages separate from full answer coverage", async () => {
    const deps = dependencies();
    deps.verifier.generateJson = async () => ({ status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [{
      source_id: "Q2:183", relevance: "partial", supported_requirement_ids: [], related_requirement_ids: ["R1"],
      context_safe: "yes", scope_matches_question: "yes", distinct_contribution: "yes", position: "",
      contribution: { role: "background", scope: "general", conditions: [] },
    }] });
    const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care"] } };
    const result = await selectPatientEvidence(frame, pack.passages.slice(0, 1), deps, new AbortController().signal, true);
    expect(result?.partial).toBe(true); expect(result?.passages[0].requirementIds).toEqual([]);
    expect((await runRichAnswer(result!, "en", dependencies(), new AbortController().signal, "Explain care", {}, Infinity)).status).toBe("incomplete");
    expect(await selectPatientEvidence(frame, pack.passages.slice(0, 1), deps, new AbortController().signal, false)).toBeNull();
  });
});
