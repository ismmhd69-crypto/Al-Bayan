import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { premiseCheck, bareDependentReference, expandedPlannerRequest, describePlannerOutput } from "@/lib/ask/follow-up";
import { currentPlannerRequest, evaluatePlanner } from "../scripts/ask-follow-up-planner";
import { PLANNER_CASES } from "../scripts/ask-follow-up-fixtures";
import type { JsonRequest } from "@/lib/ai/types";

it.each(["بطلان", "إعلان", "فلان", "الان", "ما حكم بطلان الصلاة", "عحيث أن", "حيث أنانية", "علما أنانية", "بما أنانية", "sincere", "xgiven that", "عبecause"])("does not match a connector inside another word: %s", text => {
  expect(premiseCheck(text, []).found).toEqual([]);
});
it.each(["لأن", "لأنه", "لأنني", "ولأنه", "فلأنها", "بما أن", "وبما أننا", "حيث أن", "فحيث أنه", "علما أن", "وعلما بأنني", "given that", "since", "because"])("catches the whole connector or a supported grammatical attachment: %s", text => {
  expect(premiseCheck(`السؤال: ${text} هذا واجب؟`, []).introduced).toHaveLength(1);
});
it("uses whole connectors in visitor text too, rather than allowing a substring in فلان", () => {
  expect(premiseCheck("لأن هذا واجب", ["قال فلان"]).introduced).toHaveLength(1);
  expect(premiseCheck("لأن هذا واجب", ["ولأنني سألت"]).introduced).toEqual([]);
});

const raw = () => ({ language: "en", kind: "question", question_type: "general", subjects: ["travel"],
  requested_points: [{ text: "Explain the referenced travel topic", facet: "general", scope: "general", essential_conditions: [],
    search_queries: { en: ["travel topic"], ar: ["أحكام السفر"], de: [] }, essential_condition_quotes: [] }],
  search_queries_en: ["travel topic"], search_queries_ar: ["أحكام السفر"], search_queries_de: [], qualifiers: [], interpretations: [],
  clarification_needed: false, checklist_status: "complete", backup_queries: [], follow_up: { relation: "none", resolved_question: "", intent: "none" } });
it.each(["the second one", "Explain the second one.", "اشرح الثاني", "that", "ذلك"])("corrects dependent none once then clarifies: %s", async message => {
  const test = { ...PLANNER_CASES[0], message }, request = expandedPlannerRequest(await currentPlannerRequest(test, "fixture"), test);
  expect(bareDependentReference(message)).toBe(true);
  expect(describePlannerOutput(raw(), true, test).failureReason).toBe("dependent_reference_cannot_be_none");
  const generateJson = vi.fn(async (_request: JsonRequest) => raw());
  const result = await evaluatePlanner(request, test, { id: "fixture", generateJson }, true);
  expect(generateJson).toHaveBeenCalledTimes(2); expect(result.fallback).toBe("clarify");
  expect(JSON.parse(generateJson.mock.calls[1][0].prompt).correction).toContain("dependent_reference_cannot_be_none");
});
it.each(["What is the second pillar of Islam?", "ما هو الركن الثاني من أركان الإسلام؟",
  PLANNER_CASES.find(t => t.id === "new-topic-ar")!.message, PLANNER_CASES.find(t => t.id === "new-topic-en")!.message])("keeps a self-contained question as none: %s", message => {
  const test = { ...PLANNER_CASES[0], message };
  expect(bareDependentReference(message)).toBe(false);
  const output = describePlannerOutput(raw(), true, test);
  expect(output.valid).toBe(true); expect(output.followUp?.relation).toBe("none");
});
it("does not apply the dependent-none backstop without earlier context", () => {
  expect(describePlannerOutput(raw(), true, { ...PLANNER_CASES[0], message: "that", history: [], parent: undefined }).failureReason).toBeNull();
});
it.each([true, false])("restores the invalid/missing-follow-up fallback with context=%s", async context => {
  const test = { ...PLANNER_CASES[0], history: context ? ["Earlier question"] : [], parent: context ? PLANNER_CASES[0].parent : undefined };
  const base = expandedPlannerRequest(await currentPlannerRequest(test, "fixture"), test);
  for (const follow_up of [undefined, { relation: "invalid" }]) {
    const generateJson = vi.fn(async (_request: JsonRequest) => ({ ...raw(), follow_up }));
    const result = await evaluatePlanner(base, test, { id: "fixture", generateJson }, true);
    expect(generateJson).toHaveBeenCalledTimes(2); expect(result.fallback).toBe(context ? "clarify" : "first_question");
  }
});
it("keeps valid-none frame failures separate from missing follow-up", async () => {
  const test = PLANNER_CASES.find(t => t.id === "new-topic-ar")!, request = expandedPlannerRequest(await currentPlannerRequest(test, "fixture"), test);
  const generateJson = vi.fn(async (_request: JsonRequest) => ({ ...raw(), kind: "invalid" }));
  const result = await evaluatePlanner(request, test, { id: "fixture", generateJson }, true);
  expect(result.fallback).toBe("frame_invalid"); expect(generateJson).toHaveBeenCalledTimes(2);
});
