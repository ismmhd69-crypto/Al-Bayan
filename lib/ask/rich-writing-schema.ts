import type { JsonSchema } from "@/lib/ai/types";
const primaryNeedsReasoningRoom = (writerId: string) => ["openrouter/anthropic/claude-haiku-5.5", "openrouter/deepseek/deepseek-v4-flash"].includes(writerId.split("|fallback:")[0]);
// Saved receipts: two Arabic source calls exhausted 2,200 tokens entirely on
// reasoning; one correction exhausted it after 1,730 reasoning tokens. Give
// this writer the existing full-writing ceiling, without changing reasoning,
// retries, claim/schema limits or the aggregate continuation protections.
export const richWritingOutputAllowance = (groups: string[], writerId = "") => groups.length === 1 && groups[0] !== "summary"
  ? primaryNeedsReasoningRoom(writerId) ? 6600 : 2200 : 6600;
// The recorded Arabic frame correction also cut off at 1,600 (1,189 reasoning).
export const richFrameOutputAllowance = (writerId: string) => primaryNeedsReasoningRoom(writerId) ? 3200 : 1600;

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
