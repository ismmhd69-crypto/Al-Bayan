import type { JsonRequest, JsonSchema } from "@/lib/ai/types";
import type { Claim } from "./checks";
import { reviewAnchors } from "./review-excerpts";

/** What the visitor added in a search follow-up ("on purpose", "if not traveling"), per requirement. */
export type VisitorCondition = { requirement_id: string; condition: string };

// Live tests, 2026-11-12: the checker accepted a restated general rule as covering "on purpose" in English and
// rejected it in Arabic. Codex's suggestion: make the judgement explicit and auditable. For each added condition
// the checker must name the summary sentence that speaks about it AND a code-supplied excerpt of that sentence's
// own cited originals that speaks about it. Code then verifies the pairing. A "yes" without both is not accepted.
const RULE = `visitor_conditions lists what the visitor ADDED in this follow-up. Return condition_coverage with exactly one row per listed condition. Set addressed to yes ONLY when a summary sentence speaks about that condition itself, and a passage of that sentence's cited originals also speaks about that condition; then give that sentence's claim_id and the anchor_id of that passage from the claim's excerpt_choices. A sentence that restates the general topic without mentioning the condition is no, however correct it is. A passage about the general topic that never mentions the condition is no. When addressed is no or unsure, claim_id and anchor_id are empty strings. Never infer how a general teaching applies to the condition.`;

export function withConditionCoverage(request: JsonRequest, conditions: VisitorCondition[], items: Claim[], serialized: unknown, summaryCount: number): JsonRequest {
  if (!conditions.length || request.schema.type !== "object") return request;
  const anchors = reviewAnchors(items, serialized), summaryIds = items.map((_, i) => `C${i + 1}`).slice(items.length - summaryCount);
  const row: JsonSchema = { type: "object", properties: {
    requirement_id: { type: "string", enum: [...new Set(conditions.map(c => c.requirement_id))] },
    condition: { type: "string", enum: [...new Set(conditions.map(c => c.condition))] },
    addressed: { type: "string", enum: ["yes", "no", "unsure"] },
    claim_id: { type: "string", enum: ["", ...summaryIds] },
    anchor_id: { type: "string", enum: ["", ...summaryIds.flatMap(id => (anchors[id] ?? []).map(a => a.anchor_id))] },
  }, required: ["requirement_id", "condition", "addressed", "claim_id", "anchor_id"] };
  return { ...request, system: `${request.system}\n${RULE}`,
    prompt: JSON.stringify({ ...JSON.parse(request.prompt), visitor_conditions: conditions }),
    schema: { ...request.schema, properties: { ...request.schema.properties, condition_coverage: { type: "array", maxItems: conditions.length, items: row } },
      required: [...request.schema.required, "condition_coverage"] } };
}

/** True only when every added condition has one "yes" row naming a summary sentence and an excerpt that
 * belongs to that same sentence's cited originals. This never approves wording; the full review still applies. */
export function conditionCoverageOk(raw: unknown, conditions: VisitorCondition[], items: Claim[], serialized: unknown, summaryCount: number): boolean {
  if (!conditions.length) return true;
  const rows = (raw as { condition_coverage?: unknown } | null)?.condition_coverage;
  if (!Array.isArray(rows) || rows.length !== conditions.length) return false;
  const anchors = reviewAnchors(items, serialized), summaryIds = new Set(items.map((_, i) => `C${i + 1}`).slice(items.length - summaryCount));
  return conditions.every(c => {
    const own = rows.filter(r => r && r.requirement_id === c.requirement_id && r.condition === c.condition);
    if (own.length !== 1) return false;
    const r = own[0] as { addressed?: unknown; claim_id?: unknown; anchor_id?: unknown };
    return r.addressed === "yes" && typeof r.claim_id === "string" && summaryIds.has(r.claim_id)
      && (anchors[r.claim_id] ?? []).some(a => a.anchor_id === r.anchor_id);
  });
}
