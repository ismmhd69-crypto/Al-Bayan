import type { JsonSchema } from "@/lib/ai/types";
import type { Claim } from "./checks";

export type TextOnlyPatch = { original: unknown[]; indices: number[] };

/** Support corrections edit only explicitly identified sentences. Layout/merge
 * repairs keep their existing path. A stale or ambiguous snapshot cannot lock
 * the wrong claim. This never approves untouched text or removes later checks. */
export function sourceSupportTextPatch(original: unknown, feedback: unknown, allowedIds: string[]): TextOnlyPatch | null {
  if (!Array.isArray(original) || !original.length || original.some(c => !c || typeof c.text !== "string"
    || !Array.isArray(c.refs) || !c.refs.length || c.refs.some((id: unknown) => typeof id !== "string" || !allowedIds.includes(id)))) return null;
  const f = feedback as any, rows = f?.claims;
  if (!Array.isArray(rows) || !rows.length || new Set(rows.map((r: any) => r?.claim_id)).size !== rows.length
    || rows.some((r: any) => typeof r?.claim_id !== "string" || !/^C[1-9]\d*$/u.test(r.claim_id))) return null;
  const matches = (c: Claim, r: any) => r.text === c.text && r.requirement_id === c.requirementId
    && Array.isArray(r.source_ids) && JSON.stringify(r.source_ids) === JSON.stringify(c.refs);
  const bindings = original.map(c => rows.filter((r: any) => matches(c, r)));
  if (bindings.some(r => r.length !== 1) || new Set(bindings.map(r => r[0].claim_id)).size !== original.length) return null;
  const ownIds = new Set(bindings.map(r => r[0].claim_id));
  if (!Array.isArray(f.support_failures) || !Array.isArray(f.citation_failures ?? [])
    || !Array.isArray(f.contribution_failures) || f.contribution_failures.some((r: any) => ownIds.has(r?.claim_id))) return null;
  const failures = [...f.support_failures, ...(f.citation_failures ?? [])];
  if (failures.some((r: any) => !rows.some((c: any) => c.claim_id === r?.claim_id))) return null;
  const targeted = new Set(failures.map((r: any) => r.claim_id));
  const indices = bindings.flatMap((r, i) => targeted.has(r[0].claim_id) ? [i] : []);
  if (!indices.length) return null;
  return { indices, original: original.map((c: Claim) => ({ text: c.text, source_ids: [...c.refs], ...(c.requirementId ? { requirement_id: c.requirementId } : {}) })) };
}

/** Generate only replacement text. Identity and untouched wording belong to the
 * sealed draft, never to a second model-generated copy of that draft. */
export function textOnlyPatchSchema(patch: TextOnlyPatch): JsonSchema {
  return { type: "object", properties: Object.fromEntries(patch.indices.map(i => [`P${i}`, {
    type: "object", properties: { text: { type: "string", maxLength: 300 } }, required: ["text"],
  }])), required: patch.indices.map(i => `P${i}`) };
}

export function applyTextOnlyPatch(raw: unknown, patch: TextOnlyPatch): unknown[] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>, keys = patch.indices.map(i => `P${i}`);
  if (Object.keys(record).length !== keys.length || keys.some(k => !Object.hasOwn(record, k))) return null;
  for (const key of keys) {
    const row = record[key];
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).length !== 1
      || typeof (row as { text?: unknown }).text !== "string" || Array.from((row as { text: string }).text).length > 300) return null;
  }
  return patch.original.map((item, i) => patch.indices.includes(i)
    ? { ...(item as object), text: (record[`P${i}`] as { text: string }).text } : structuredClone(item));
}
