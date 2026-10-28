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
