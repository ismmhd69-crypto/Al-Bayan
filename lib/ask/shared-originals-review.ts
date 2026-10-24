// Experimental request storage sharing. Not imported by the active answer path.
// Local evidence, anchor resolution and the entire response contract stay unchanged.
import type { JsonRequest } from "../ai/types";
function coverageMetadata(source: any) {
  const { arabic: _original, translation_en: _en, translation_de: _de, surrounding_context: _context, ...metadata } = source;
  return metadata;
}

export function restoreReviewOriginals(input: any): any {
  const p = structuredClone(input), catalog = p.original_catalog;
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) throw Error("original_catalog_invalid");
  const read = (ref: any) => {
    if (!ref || Object.keys(ref).join(",") !== "source_ref" || typeof ref.source_ref !== "string"
      || !Object.hasOwn(catalog, ref.source_ref) || catalog[ref.source_ref]?.id !== ref.source_ref) throw Error("original_reference_invalid");
    return structuredClone(catalog[ref.source_ref]);
  };
  const sourceOrder = p.evidence_package?.passages;
  if (!Array.isArray(sourceOrder)) throw Error("coverage_source_order_missing");
  p.claim_evidence = p.claim_evidence.map((compact: any) => {
    const claim = p.claims.find((c: any) => c.claim_id === compact.claim_id);
    if (!claim || Object.hasOwn(compact, "cited_originals") || !Array.isArray(claim.source_ids)
      || claim.source_ids.some((id: string) => !sourceOrder.includes(id))) throw Error("claim_original_reference_invalid");
    const row = { claim_id: compact.claim_id, cited_originals: sourceOrder.filter((id: string) => claim.source_ids.includes(id)).map((id: string) => read({ source_ref: id })), excerpt_choices: compact.excerpt_choices };
    row.excerpt_choices = row.excerpt_choices.map((a: any) => {
      if (!Object.hasOwn(a, "whole_original")) return a;
      if (a.whole_original !== true || !row.cited_originals.some((s: any) => s.id === a.source_id) || !catalog[a.source_id]) throw Error("anchor_original_reference_invalid");
      const { whole_original: _whole, ...rest } = a;
      return { ...rest, original_excerpt: catalog[a.source_id].arabic.trim() };
    });
    return row;
  });
  p.restriction_context = p.restriction_context.map((id: unknown) => read({ source_ref: id }));
  if (p.evidence_package?.passages) p.evidence_package.passages = p.evidence_package.passages.map((id: unknown) => {
    if (typeof id !== "string" || !Object.hasOwn(catalog, id)) throw Error("coverage_metadata_reference_invalid");
    return coverageMetadata(catalog[id]);
  });
  delete p.original_catalog;
  return p;
}

export function shareReviewOriginals(request: JsonRequest): JsonRequest {
  const before = JSON.parse(request.prompt), p = structuredClone(before);
  if (Object.hasOwn(p, "original_catalog") || !Array.isArray(p.claim_evidence) || !Array.isArray(p.restriction_context)) throw Error("review_storage_shape_invalid");
  const catalog: Record<string, any> = Object.create(null);
  const store = (source: any) => {
    if (!source || typeof source.id !== "string" || !source.id || typeof source.arabic !== "string") throw Error("original_identity_missing");
    if (Object.hasOwn(catalog, source.id) && JSON.stringify(catalog[source.id]) !== JSON.stringify(source)) throw Error("original_identity_conflict");
    catalog[source.id] = structuredClone(source);
    return { source_ref: source.id };
  };
  for (const row of p.claim_evidence) {
    if (!Array.isArray(row.cited_originals) || !Array.isArray(row.excerpt_choices)) throw Error("claim_originals_missing");
    const own = new Map(row.cited_originals.map((s: any) => [s.id, s]));
    row.cited_originals.forEach(store);
    row.excerpt_choices = row.excerpt_choices.map((a: any) => {
      const source = own.get(a.source_id) as any;
      if (!source || typeof a.original_excerpt !== "string" || Object.hasOwn(a, "whole_original")) throw Error("anchor_original_invalid");
      if (source.arabic.trim() !== a.original_excerpt) return a; // Preserve partial excerpts verbatim.
      const { original_excerpt: _text, ...rest } = a;
      return { ...rest, whole_original: true };
    });
    delete row.cited_originals;
  }
  p.restriction_context = p.restriction_context.map((source: any) => { store(source); return source.id; });
  if (p.evidence_package?.passages) p.evidence_package.passages = p.evidence_package.passages.map((metadata: any) => {
    if (!Object.hasOwn(catalog, metadata.id) || JSON.stringify(coverageMetadata(catalog[metadata.id])) !== JSON.stringify(metadata)) throw Error("coverage_metadata_identity_conflict");
    return metadata.id;
  });
  p.original_catalog = catalog;
  if (JSON.stringify(restoreReviewOriginals(p)) !== JSON.stringify(before)) throw Error("review_original_roundtrip_failed");
  return { ...request, prompt: JSON.stringify(p), system: request.system + "\nStorage sharing only: original_catalog stores each exact original once. A claim's cited_originals are precisely the catalog objects for its source_ids; no other catalog entry can support it. restriction_context lists catalog IDs for restrictions only. evidence_package.passages lists catalog IDs for coverage metadata only: exclude arabic, translation_en, translation_de and surrounding_context there. In excerpt_choices, whole_original:true selects the source's complete arabic text (outer whitespace ignored); partial excerpts remain literal. Expand references before judging. All original text, restrictions and claim/anchor eligibility are unchanged." };
}
