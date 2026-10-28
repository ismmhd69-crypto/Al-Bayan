import type { JsonRequest } from "@/lib/ai/types";
import type { PassageForSelection } from "./retrieval";

export const SELECTION_REFERENCE_CONTRACT = "candidate_refs_v1";

/** Short references bind selections to the exact candidate pool. No fuzzy ID repair. */
export function selectionReferences(request: JsonRequest, items: PassageForSelection[]): JsonRequest {
  const schema = structuredClone(request.schema), input = JSON.parse(request.prompt);
  if (schema.type !== "object" || schema.properties.assessments.type !== "array"
    || schema.properties.assessments.items.type !== "object") throw Error("selection_reference_schema_invalid");
  const refs = items.map((_, i) => `P${i + 1}`), row = schema.properties.assessments.items;
  delete row.properties.source_id;
  row.properties.source_ref = { type: "string", enum: refs };
  row.required = row.required.map(k => k === "source_id" ? "source_ref" : k);
  schema.properties.selection_contract = { type: "string", enum: [SELECTION_REFERENCE_CONTRACT] };
  schema.required.push("selection_contract");
  const plan = schema.properties.evidence_plan;
  if (plan?.type === "array" && plan.items.type === "object") {
    const field = plan.items.properties.source_ids;
    if (field?.type === "array") field.items = { type: "string", enum: refs };
  }
  input.candidates = input.candidates.map((candidate: object, i: number) => ({ ...candidate, candidate_ref: refs[i] }));
  input.selection_contract = SELECTION_REFERENCE_CONTRACT;
  return { ...request, schema, prompt: JSON.stringify(input), system: request.system
    + "\nReturn selection_contract candidate_refs_v1. In every assessment use source_ref copied from that candidate's candidate_ref, never source_id or a retyped source identifier. Assess every candidate exactly once, including rejected candidates. If evidence_plan is requested, its source_ids contain candidate_ref values too; code resolves these to unchanged originals. References establish identity only. They cannot establish relevance, context safety, scope or support." };
}

/** Unknown, duplicated or retyped references still refuse the whole selection. A candidate the
 * selector did not assess is simply not selected (never approved); onOmitted reports which. */
export function resolveSelectionReferences(raw: unknown, items: PassageForSelection[], onOmitted?: (ids: string[]) => void): unknown {
  const r = raw as Record<string, unknown> | null;
  if (!r || r.selection_contract !== SELECTION_REFERENCE_CONTRACT || !Array.isArray(r.assessments)) return null;
  const ids = new Map(items.map((p, i) => [`P${i + 1}`, p.id]));
  const seen = new Set<string>(), assessments = [];
  for (const row of r.assessments) {
    if (!row || typeof row !== "object" || Object.hasOwn(row, "source_id") || !ids.has(row.source_ref) || seen.has(row.source_ref)) return null;
    seen.add(row.source_ref);
    const { source_ref, ...fields } = row;
    assessments.push({ ...fields, source_id: ids.get(source_ref) });
  }
  if (seen.size !== items.length) onOmitted?.(items.filter((_, i) => !seen.has(`P${i + 1}`)).map(p => p.id));
  let plan = r.evidence_plan;
  if (plan !== undefined) {
    if (!Array.isArray(plan) || plan.some(row => !row || !Array.isArray(row.source_ids) || row.source_ids.some((ref: unknown) => !ids.has(ref as string)))) return null;
    plan = plan.map(row => ({ ...row, source_ids: row.source_ids.map((ref: string) => ids.get(ref)) }));
  }
  return { ...r, assessments, ...(plan === undefined ? {} : { evidence_plan: plan }) };
}
