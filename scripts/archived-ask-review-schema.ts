import type { JsonSchema } from "../lib/ai/types";

/** Historical replay may accept only this deliberate contract upgrade. Never
 * mutate archived requests or relax source/coverage/other schema comparisons. */
export function archivedReviewSchemaMatches(current: JsonSchema, archived: JsonSchema, ids: string[]): boolean {
  if (JSON.stringify(current) === JSON.stringify(archived)) return true;
  if (current.type !== "object" || archived.type !== "object") return false;
  const decision: JsonSchema = { type: "string", enum: ["yes", "no", "unsure"] };
  const oldAttribution: JsonSchema = { type: "array", items: { type: "object", properties: { claim_id: { type: "string" }, verdict: decision }, required: ["claim_id", "verdict"] } };
  const newAttribution: JsonSchema = { type: "object", properties: Object.fromEntries(ids.map(id => [id, {
    type: "object", properties: { claim_id: { type: "string", enum: [id] }, verdict: decision }, required: ["claim_id", "verdict"],
  } as JsonSchema])), required: ids };
  if (JSON.stringify(archived.properties.attribution_checks) !== JSON.stringify(oldAttribution)
    || JSON.stringify(current.properties.attribution_checks) !== JSON.stringify(newAttribution)) return false;
  const comparison = structuredClone(current);
  comparison.properties.attribution_checks = oldAttribution;
  return JSON.stringify(comparison) === JSON.stringify(archived);
}
