import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { expandedPlannerRequest, describePlannerOutput } from "@/lib/ask/follow-up";
import { currentPlannerRequest, evaluatePlanner } from "../scripts/ask-follow-up-planner";
import { PLANNER_CASES } from "../scripts/ask-follow-up-fixtures";
import type { JsonRequest } from "@/lib/ai/types";
const frame = () => ({ language: "ar", kind: "question", question_type: "definition", subjects: ["zakat"],
  requested_points: [{ text: "Explain the meaning of zakat", facet: "definition", scope: "general", essential_conditions: [], interpretation_id: "",
    search_queries: { en: ["zakat meaning"], ar: ["معنى الزكاة"], de: [] }, quran_ar: [], hadith_ar: [] }],
  qualifiers: [], search_queries_en: ["zakat meaning"], search_queries_ar: ["معنى الزكاة"], search_queries_de: [],
  interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [],
  follow_up: { relation: "none", resolved_question: "", intent: "none" } });
it("requires an Arabic main query after the six-word filter and corrects for that specific reason", async () => {
  const test = PLANNER_CASES.find(t => t.id === "new-topic-ar")!, base = await currentPlannerRequest(test, "fixture");
  const raw = frame(); raw.search_queries_ar = ["أقوال العلماء في سفر المرأة للحج بدون محرم"];
  expect(describePlannerOutput(raw, true).failureReason).toBe("arabic_queries_missing_after_parsing_six_word_limit");
  let calls = 0;
  const provider = { id: "fixture", generateJson: vi.fn(async (request: JsonRequest) => {
    if (++calls === 1) return raw;
    expect(JSON.parse(request.prompt).correction).toContain("arabic_queries_missing_after_parsing_six_word_limit"); return frame();
  }) };
  const result = await evaluatePlanner(expandedPlannerRequest(base, test), test, provider, true);
  expect(result.output.valid).toBe(true); expect(result.output.queries.ar).toEqual(["معنى الزكاة"]); expect(calls).toBe(2);
});
it("uses the existing plain-English rejection reason and never clarifies a valid none on frame failure", async () => {
  const test = PLANNER_CASES.find(t => t.id === "new-topic-ar")!, base = await currentPlannerRequest(test, "fixture"), raw = frame();
  raw.requested_points[0].text = "ما معنى الزكاة؟";
  const provider = { id: "fixture", generateJson: vi.fn(async (request: JsonRequest) => {
    if (JSON.parse(request.prompt).correction) {
      expect(JSON.parse(request.prompt).correction).toContain("requested_point_text_must_be_short_plain_English");
      expect(JSON.parse(request.prompt).correction).toContain("Requirement text must be plain English");
    }
    return raw;
  }) };
  const result = await evaluatePlanner(expandedPlannerRequest(base, test), test, provider, true);
  expect(provider.generateJson).toHaveBeenCalledTimes(2); expect(result.fallback).toBe("frame_invalid");
});
it("accepts only the narrow empty-requirement ambiguous contract without a correction", async () => {
  const test = PLANNER_CASES.find(t => t.id === "expired-ar")!, base = await currentPlannerRequest(test, "fixture");
  const raw = { ...frame(), requested_points: [], checklist_status: "ambiguous", clarification_needed: true,
    search_queries_ar: [], follow_up: { relation: "ambiguous", resolved_question: "", intent: "none" } };
  const provider = { id: "fixture", generateJson: vi.fn(async () => raw) };
  const result = await evaluatePlanner(expandedPlannerRequest(base, test), test, provider, true);
  expect(result.output.valid).toBe(true); expect(result.output.clarification).toBe(true); expect(provider.generateJson).toHaveBeenCalledTimes(1);
  expect(describePlannerOutput({ ...raw, language: "invalid" }, true).valid).toBe(false);
  expect(describePlannerOutput({ ...raw, kind: "invalid" }, true).valid).toBe(false);
  expect(describePlannerOutput({ ...raw, question_type: "invalid" }, true).valid).toBe(false);
  expect(describePlannerOutput({ ...raw, clarification_needed: false }, true).valid).toBe(false);
  expect(describePlannerOutput({ ...raw, checklist_status: "invalid" }, true).valid).toBe(false);
});
it("has sixteen cases including two real-answer parents with provenance", () => {
  expect(PLANNER_CASES).toHaveLength(16);
  expect(PLANNER_CASES.filter(t => t.provenance && t.parent?.displayed_sentences.length)).toHaveLength(2);
});
