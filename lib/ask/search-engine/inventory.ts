/** Metadata-only inventory. It neither approves content nor infers embedding rights. */
export type SourceMetadata = { id: string; kind: string; language: string; published: boolean; rights_id: string | null; grade: string | null; grader: string | null; scholar_id: string | null };
export type SearchMetadata = { source_id: string; lang: string; approved: boolean };
export type RightsMetadata = { id: string; owner: string; status: string; search_index_allowed: boolean; ai_processing_allowed: boolean; translation_index_allowed: boolean; expires_at: string | null };

export function inventorySummary(sources: SourceMetadata[], documents: SearchMetadata[], rights: RightsMetadata[] | null, now = new Date()) {
  const sourceIds = new Set(sources.map(s => s.id));
  const rightById = new Map(rights?.map(r => [r.id, r]));
  const docs = new Map<string, SearchMetadata[]>();
  for (const document of documents) docs.set(document.source_id, [...(docs.get(document.source_id) ?? []), document]);
  const groups: Record<string, { total: number; published: number; withApprovedIndex: number; indexedLanguages: Record<string, number>; eligibility: { allowed: number; excluded: number; unknown: number }; missingHadithGrade: number }> = {};
  for (const source of sources) {
    const group = groups[source.kind] ??= { total: 0, published: 0, withApprovedIndex: 0, indexedLanguages: {}, eligibility: { allowed: 0, excluded: 0, unknown: 0 }, missingHadithGrade: 0 };
    group.total++;
    if (source.published) group.published++;
    const approved = (docs.get(source.id) ?? []).filter(d => d.approved);
    if (approved.length) group.withApprovedIndex++;
    for (const lang of new Set(approved.map(d => d.lang))) group.indexedLanguages[lang] = (group.indexedLanguages[lang] ?? 0) + 1;
    const right = source.rights_id ? rightById.get(source.rights_id) : undefined;
    const gradeOk = source.kind !== "hadith" || (!!source.grader && ["sahih", "hasan"].includes(source.grade ?? ""));
    if (!gradeOk) group.missingHadithGrade++;
    if (!source.published || !gradeOk || (rights !== null && !right)) { group.eligibility.excluded++; continue; }
    if (!right) { group.eligibility.unknown++; continue; }
    const validDate = !right.expires_at || /^\d{4}-\d{2}-\d{2}$/.test(right.expires_at) && Number.isFinite(Date.parse(right.expires_at));
    const unexpired = validDate && (!right.expires_at || right.expires_at >= now.toISOString().slice(0, 10));
    const languageEligible = approved.some(d => d.lang === source.language || right.translation_index_allowed);
    const eligible = ["granted", "short_quotes_only"].includes(right.status) && right.search_index_allowed && right.ai_processing_allowed && unexpired && languageEligible;
    group.eligibility[eligible ? "allowed" : "excluded"]++;
  }
  return {
    groups, sourceRows: sources.length, searchDocuments: documents.length,
    orphanSearchDocuments: documents.filter(d => !sourceIds.has(d.source_id)).length,
    rightsReadable: rights !== null,
    rights: rights?.map(({ owner, status, search_index_allowed, ai_processing_allowed, translation_index_allowed, expires_at }) => ({ owner, status, search_index_allowed, ai_processing_allowed, translation_index_allowed, expires_at, embedding_permission: "not_established_by_existing_flags" })),
    qualification: "Allowed means published, graded where applicable, and indexed under the existing metadata gates. Exact excerpt integrity, quote length, necessary context, approved scholar identity, current permission correspondence and semantic embedding rights still require verification.",
  };
}
