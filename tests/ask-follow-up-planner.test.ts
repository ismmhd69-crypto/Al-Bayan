import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { expandedPlannerRequest, parseFollowUp } from "@/lib/ask/follow-up";
import { currentPlannerRequest, evaluatePlanner, comparePlanners, comparisonReport } from "../scripts/ask-follow-up-planner";
import { PLANNER_CASES } from "../scripts/ask-follow-up-fixtures";
import type { JsonRequest } from "@/lib/ai/types";

it("captures the unchanged production request without sources or a model and expands a copy only", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline_network_forbidden"));
  try {
    for (const test of PLANNER_CASES) {
      const old = await currentPlannerRequest(test, "vertex/gemini-3.1-flash-lite");
      const before = JSON.stringify(old), candidate = expandedPlannerRequest(old, test);
      expect(JSON.stringify(old)).toBe(before);
      expect(old.system).not.toContain("Return follow_up");
      expect(JSON.parse(old.prompt)).not.toHaveProperty("parent_context");
      expect(candidate.system.startsWith(old.system)).toBe(true);
      const input = JSON.parse(candidate.prompt);
      expect(!!input.parent_context).toBe(!!test.parent && !test.parentUnavailable);
      if (old.schema.type !== "object" || candidate.schema.type !== "object") throw Error("fixture_schema");
      expect(candidate.schema.required).toEqual([...old.schema.required, "follow_up"]);
      for (const key of Object.keys(old.schema.properties).filter(k => k !== "requested_points")) expect(candidate.schema.properties[key]).toEqual(old.schema.properties[key]);
      const beforePoints = old.schema.properties.requested_points, afterPoints = candidate.schema.properties.requested_points;
      if (beforePoints.type !== "array" || afterPoints.type !== "array" || beforePoints.items.type !== "object" || afterPoints.items.type !== "object") throw Error("fixture_points");
      for (const key of Object.keys(beforePoints.items.properties)) expect(afterPoints.items.properties[key]).toEqual(beforePoints.items.properties[key]);
      expect(afterPoints.items.required).toEqual([...beforePoints.items.required, "essential_condition_quotes"]);
    }
    expect(network).not.toHaveBeenCalled();
  } finally { network.mockRestore(); }
});
it.each([
  { relation: "none", resolved_question: "", intent: "none" },
  { relation: "ambiguous", resolved_question: "", intent: "none" },
  ...["re_explain", "new_information", "other_view"].map(intent => ({ relation: "related", resolved_question: "Explain the cited condition", intent })),
])("accepts only valid combinations: %j", value => expect(parseFollowUp(value)).toEqual(value));
it.each([undefined, {}, { relation: "none", resolved_question: "Invented", intent: "none" },
  { relation: "related", resolved_question: "", intent: "re_explain" }, { relation: "related", resolved_question: "x".repeat(301), intent: "re_explain" },
  { relation: "ambiguous", resolved_question: "", intent: "other_view" }, { relation: "related", resolved_question: "Valid text", intent: "disable_checks" },
])("does not turn invalid output into a new topic: %j", value => expect(parseFollowUp(value)).toBeNull());
it("bounds correction to one attempt and clarifies missing follow-up data when context exists", async () => {
  const test = PLANNER_CASES[0], base = await currentPlannerRequest(test, "fixture");
  const generateJson = vi.fn(async (_request: JsonRequest) => ({}));
  const result = await evaluatePlanner(expandedPlannerRequest(base, test), test, { id: "fixture", generateJson }, true);
  expect(generateJson).toHaveBeenCalledTimes(2); expect(result.fallback).toBe("clarify");
  expect(JSON.parse(generateJson.mock.calls[1][0].prompt).parent_context).toEqual(test.parent);
});
it("uses the production correction for the old planner rather than the candidate instructions", async () => {
  const test = PLANNER_CASES[0], request = await currentPlannerRequest(test, "fixture");
  const generateJson = vi.fn(async (_request: JsonRequest) => ({}));
  const result = await evaluatePlanner(request, test, { id: "fixture", generateJson }, false);
  expect(result.fallback).toBe("frame_invalid"); expect(generateJson).toHaveBeenCalledTimes(2);
  const correction = JSON.parse(generateJson.mock.calls[1][0].prompt).correction;
  expect(correction).toContain("Correct the question checklist"); expect(correction).not.toContain("follow_up");
});
it("reports old and new kinds, requirements, queries and follow-up fields without treating scripted output as meaning approval", async () => {
  const frame = { language: "en", kind: "question", question_type: "general", subjects: ["travel"],
    requested_points: [{ text: "Explain Hajj travel", facet: "general", scope: "general", essential_conditions: [], interpretation_id: "",
      search_queries: { en: ["Hajj travel"], ar: ["سفر الحج"], de: [] }, quran_ar: ["سفر الحج"], hadith_ar: ["سفر الحج"] }],
    qualifiers: [], search_queries_en: ["Hajj travel"], search_queries_de: [], search_queries_ar: ["سفر الحج"],
    interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [] };
  const generateJson = vi.fn(async (request: JsonRequest) => request.system.includes("Return follow_up")
    ? { ...frame, follow_up: { relation: "related", resolved_question: "Explain the cited explanation concerning Hajj travel simply.", intent: "re_explain" } } : frame);
  const row = await comparePlanners(PLANNER_CASES[0], { id: "fixture", generateJson });
  expect(generateJson).toHaveBeenCalledTimes(2);
  expect(row.old.output.valid).toBe(true); expect(row.candidate.output.valid).toBe(true);
  expect(row.changed).toEqual({ kind: false, requirements: false, queries: false });
  expect(row.expectedFieldsMatch).toBe(true); expect(row.meaningReview).toBe("pending_owner_review");
  const report = comparisonReport([row]);
  for (const text of ["kind", "requirements", "queries", "followUp", "Old output", "Candidate output", "Meaning review: pending"]) expect(report).toContain(text);
});
