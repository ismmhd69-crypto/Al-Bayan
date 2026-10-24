import type { JsonSchema } from "@/lib/ai/types";

export type TextOnlyPatch = { original: unknown[]; indices: number[] };

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
