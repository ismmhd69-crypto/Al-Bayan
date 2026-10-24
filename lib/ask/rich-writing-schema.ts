import type { JsonSchema } from "@/lib/ai/types";
export const richWritingOutputAllowance = (groups: string[]) => groups.length === 1 && groups[0] !== "summary" ? 2200 : 6600;

// Identity constraints never establish religious meaning. Every resulting claim still
// passes original-source, scope, qualification and whole-answer checking.
export function richWritingClaimsSchema(sourceIds: string[], requirementIds: string[], summary = false): JsonSchema {
  return { type: "array", maxItems: sourceIds.length ? summary ? 4 : 8 : 0, items: {
    type: "object", properties: {
      text: { type: "string", maxLength: 300 },
      source_ids: { type: "array", maxItems: 3, items: { type: "string", ...(sourceIds.length ? { enum: [...new Set(sourceIds)] } : {}) } },
      requirement_id: { type: "string", ...(requirementIds.length ? { enum: [...new Set(requirementIds)] } : {}) },
    }, required: ["text", "source_ids", "requirement_id"],
  } };
}
