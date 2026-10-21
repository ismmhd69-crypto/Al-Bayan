import { createHash } from "node:crypto";

export type SearchFamily = "quran" | "hadith" | "scholar" | "video";
export type SearchLanguage = "ar" | "en" | "de";
export type SearchMethod = "exact" | "lexical" | "semantic";
export type VectorSpace = { model: string; revision: string; dimensions: number; recipe?: string };
export type TextSpan = { start: number; end: number };
export type SourcePermissions = {
  published: boolean; search: boolean; ai: boolean; embeddings: boolean;
  record: string; verifiedAt: string; expiresAt: string | null; revoked: boolean;
};
export type SearchPassage = {
  id: string; sourceId: string; parentId: string; family: SearchFamily; language: SearchLanguage;
  original: string; originalHash: string; originalVerified: boolean; title: string;
  parentOriginalHash?: string;
  sourceFingerprint?: string;
  verificationBasis?: "stored_source_bytes" | "official_provider_bytes";
  reference: string; canonicalUrl: string; span: TextSpan; context: { before: string; after: string; complete: boolean };
  permissions: SourcePermissions;
  attribution: { scholarId?: string; scholarName?: Record<SearchLanguage, string>; grade?: "sahih" | "hasan"; grader?: string; collection?: string; numbering?: string };
  vector?: { space: VectorSpace; values: number[]; textHash: string };
};
export type SearchIndex = { version: 1; generation: string; space: VectorSpace; passages: SearchPassage[] };
export const textHash = (text: string) => createHash("sha256").update(text).digest("hex");
export const sameSpace = (a: VectorSpace, b: VectorSpace) => a.model === b.model && a.revision === b.revision && a.dimensions === b.dimensions && a.recipe === b.recipe;
export function validVector(values: number[], dimensions: number) {
  return Number.isSafeInteger(dimensions) && dimensions > 0 && dimensions <= 8192 && Array.isArray(values)
    && values.length === dimensions && values.every(n => typeof n === "number" && Number.isFinite(n)) && values.some(n => n !== 0);
}

/** Used before retrieval limits. Similarity can never promote an ineligible source. */
export function passageProblem(p: SearchPassage, now: Date, semantic: boolean): string | null {
  if (!p || typeof p !== "object" || [p.id, p.sourceId, p.parentId, p.reference, p.title, p.permissions?.record].some(s => typeof s !== "string" || !s.trim() || s.length > 1000)) return "identity_missing";
  if (!["quran", "hadith", "scholar", "video"].includes(p.family) || !["ar", "en", "de"].includes(p.language)) return "source_type_invalid";
  if (p.originalVerified !== true || typeof p.original !== "string" || !p.original || p.original.length > 100_000 || p.originalHash !== textHash(p.original)) return "original_mismatch";
  if (!Number.isSafeInteger(p.span?.start) || !Number.isSafeInteger(p.span?.end) || p.span.start < 0 || p.span.end - p.span.start !== p.original.length) return "span_invalid";
  try { const url = new URL(p.canonicalUrl); if (url.protocol !== "https:" || url.username || url.password || url.hash) return "url_invalid"; } catch { return "url_invalid"; }
  const rights = p.permissions;
  if (rights.published !== true || rights.search !== true || rights.ai !== true || rights.revoked !== false || typeof rights.verifiedAt !== "string" || !Number.isFinite(Date.parse(rights.verifiedAt)) || Date.parse(rights.verifiedAt) > now.getTime()) return "permission_ineligible";
  if (rights.expiresAt && (!Number.isFinite(Date.parse(rights.expiresAt)) || Date.parse(rights.expiresAt) <= now.getTime())) return "permission_expired";
  if (semantic && rights.embeddings !== true) return "embedding_permission_missing";
  if (typeof p.context?.complete !== "boolean" || typeof p.context.before !== "string" || typeof p.context.after !== "string" || p.context.before.length + p.context.after.length > 100_000) return "context_invalid";
  if (p.parentOriginalHash && (p.context.before.length !== p.span.start || textHash(p.context.before + p.original + p.context.after) !== p.parentOriginalHash)) return "parent_original_mismatch";
  if (p.family === "hadith" && (!p.attribution?.grader || !["sahih", "hasan"].includes(p.attribution.grade ?? "") || !p.attribution.collection || !p.attribution.numbering)) return "hadith_identity_incomplete";
  if ((p.family === "scholar" || p.family === "video") && !p.attribution?.scholarId) return "scholar_identity_missing";
  return null;
}

/** Discovery can find an incomplete excerpt. Evidence use must resolve its context. */
export function evidenceContextProblem(p: SearchPassage): string | null {
  return p.context.complete ? null : "context_incomplete";
}

export function validateIndex(index: SearchIndex) {
  if (index?.space?.recipe !== undefined && (typeof index.space.recipe !== "string" || !/^[a-f0-9]{64}$/.test(index.space.recipe))) throw new Error("invalid_embedding_recipe");
  if (!index || index.version !== 1 || typeof index.generation !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(index.generation) || !index.space?.model || !index.space.revision || !Number.isSafeInteger(index.space.dimensions) || index.space.dimensions <= 0 || index.space.dimensions > 8192) throw new Error("invalid_index_manifest");
  if (!Array.isArray(index.passages) || new Set(index.passages.map(p => p.id)).size !== index.passages.length) throw new Error("duplicate_passage_identity");
  for (const p of index.passages) if (p.vector && (!sameSpace(p.vector.space, index.space) || !validVector(p.vector.values, index.space.dimensions) || p.vector.textHash !== p.originalHash)) throw new Error("index_vector_mismatch");
}
