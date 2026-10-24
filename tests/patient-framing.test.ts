import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { understandPatientQuestion } from "@/lib/ask/patient-framing";
import type { AIProvider } from "@/lib/ai/types";

it("uses the same ambiguity labels contract as the shared parser, assigning identities in code", async () => {
  let calls = 0;
  const writer: AIProvider = { id: "fake/planner", generateJson: async req => {
    calls++;
    if (req.schema.type !== "object") throw Error("fixture");
    const schema = req.schema.properties.interpretations;
    expect(schema.type === "array" && schema.items.type).toBe("string");
    return { language: "en", kind: "question", question_type: "general", subjects: ["charity"], qualifiers: [],
      requested_points: [{ text: "Explain voluntary charity", facet: "general", interpretation_id: "I1" }, { text: "Explain obligatory charity", facet: "general", interpretation_id: "I2" }],
      search_queries_en: ["voluntary charity", "obligatory charity"], search_queries_de: [], search_queries_ar: [],
      interpretations: ["Voluntary charity", "Obligatory charity"], clarification_needed: true, checklist_status: "ambiguous" };
  } };
  const frame = await understandPatientQuestion("What charity do you mean?", [], writer, new AbortController().signal);
  expect(calls).toBe(1); expect(frame?.clarificationNeeded).toBe(true);
  expect(frame?.interpretations).toEqual([{ id: "I1", label: "Voluntary charity" }, { id: "I2", label: "Obligatory charity" }]);
  expect(frame?.requirements.map(r => r.interpretationId)).toEqual(["I1", "I2"]);
});
