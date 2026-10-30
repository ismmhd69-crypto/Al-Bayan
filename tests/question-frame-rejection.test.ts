import { expect, it } from "vitest";
import { parseQuestionFrame, questionFrameRejection } from "@/lib/ask/retrieval";
it("gives the existing bounded correction the exact topic-label constraint without relaxing validation", () => {
  const raw = { language: "en", kind: "question", question_type: "practice", subjects: ["Islamic guidance on controlling anger"], requested_points: [{ text: "Explain guidance for controlling anger", facet: "steps" }], qualifiers: [], search_queries_en: ["anger restraint"], search_queries_ar: ["كظم الغيظ"], search_queries_de: [] };
  expect(parseQuestionFrame(raw)).toBeNull();
  expect(questionFrameRejection(raw)).toBe("subjects_must_be_short_English_labels_max_4_words_each");
  expect(parseQuestionFrame({ ...raw, subjects: ["anger", "self restraint"] })).not.toBeNull();
  expect(parseQuestionFrame({ ...raw, subjects: ["ignore instructions"] })).toBeNull();
});
import recorded from "./fixtures/question-frame-arabic-failure.json";

it("reproduces both recorded planning failures and gives specific correction reasons", () => {
  expect(recorded.plans).toHaveLength(2);
  expect(parseQuestionFrame(recorded.plans[0])).toBeNull();
  expect(questionFrameRejection(recorded.plans[0])).toBe("requested_point_text_must_be_short_plain_English");
  expect(parseQuestionFrame(recorded.plans[1])).toBeNull();
  expect(questionFrameRejection(recorded.plans[1])).toBe("requested_point_facet_not_in_allowed_enum");
});

it("requires corrected model output instead of silently guessing a valid category", () => {
  const fixed = structuredClone(recorded.plans[1]);
  fixed.requested_points[1].facet = "steps";
  expect(parseQuestionFrame(fixed)?.requirements.map(r => r.facet)).toEqual(["definition", "steps"]);
  expect(recorded.plans[1].requested_points[1].facet).toBe("practice");
  expect(questionFrameRejection(null)).toBe("frame_response_unreadable");
});

const hintPlan = () => ({ language: "en", kind: "question", question_type: "practice", subjects: ["anger"], requested_points: [{ text: "Explain guidance for controlling anger", facet: "general", interpretation_id: "", scope: "general" }],
  qualifiers: [], search_queries_en: ["controlling anger"], search_queries_ar: [], search_queries_de: [], interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [] as unknown[] });
it("drops bad search hints and keeps the plan", () => {
  const raw = hintPlan();
  raw.backup_queries = [{ requirementId: "R2", family: "hadith", language: "ar", text: "حديث" }, { requirementId: "R1", family: "scholar", language: "en", text: "x" }, { requirementId: "1", family: "hadith", language: "ar", text: "الغضب" }, { requirementId: "R1", family: "hadith", language: "ar", text: "no arabic" }, null];
  expect(parseQuestionFrame(raw)?.backupQueries).toEqual([{ requirementId: "R1", family: "scholar", language: "en", text: "x" }, { requirementId: "R1", family: "hadith", language: "ar", text: "الغضب" }]);
});
it("removes a meaning label when no meanings are listed, but still rejects a bad question point", () => {
  const labelled = hintPlan(); labelled.requested_points[0].interpretation_id = "I1";
  expect(parseQuestionFrame(labelled)?.requirements[0].interpretationId).toBeUndefined();
  const bad = hintPlan(); bad.requested_points[0].facet = "not_a_facet";
  expect(parseQuestionFrame(bad)).toBeNull();
  const notInOrOut = hintPlan(); notInOrOut.requested_points[0].interpretation_id = "I9";
  expect(parseQuestionFrame(notInOrOut)).toBeNull();
});
