import { expect, it } from "vitest";
import { correctionFeedback } from "@/lib/ask/correction-feedback";

it("preserves the specific unsupported claim and duplication findings for correction", () => {
  const claims = [{ text: "A statement with an unsupported extra detail.", refs: ["Q1:1"], requirementId: "R1" }];
  const result = correctionFeedback({
    claim_assessments: [{ claim_id: "C1", direct_support: "no", explanation: "That detail is only in the next verse." }],
    contribution_map: [{ claim_id: "C1", kind: "restatement", adds_value: "yes", duplicates: ["C99"] }],
  }, claims);
  expect(result.support_failures).toEqual([{ claim_id: "C1", explanation: "That detail is only in the next verse." }]);
  expect(result.claims[0].source_ids).toEqual(["Q1:1"]);
  expect(result.contribution_failures[0].duplicates).toEqual([]);
});

it("does not fabricate feedback on missing checker output or accept unknown claim IDs", () => {
  expect(correctionFeedback(null, []).support_failures).toEqual([]);
  expect(correctionFeedback({ claim_assessments: [{ claim_id: "C999", direct_support: "no" }] }, []).support_failures).toEqual([]);
});
