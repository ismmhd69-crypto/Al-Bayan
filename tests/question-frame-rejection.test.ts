import { expect, it } from "vitest";
import { parseQuestionFrame, questionFrameRejection } from "@/lib/ask/retrieval";
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
