import type { StoredSearchSource } from "../lib/ask/search-engine/source-passages";
import type { CurrentSourceState } from "../lib/ask/search-engine/index-store";

const ENDPOINT = "https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query/read-only";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const FINGERPRINT_COLUMNS = ["s.kind", "s.language", "s.reference", "s.text_original", "s.url", "s.scholar_id", "s.grade", "s.grader", "s.collection", "s.numbering", "s.title", "a.name_ar", "a.name_en", "a.name_de"];
const FINGERPRINT_SQL = FINGERPRINT_COLUMNS.map(c => `(pg_catalog.octet_length(pg_catalog.convert_to(coalesce(${c},''),'UTF8'))::text || ':' || coalesce(${c},''))`).join(" || ");
// Both source-family and publication/rights filters apply before LIMIT.
const ELIGIBLE = `s.published and s.language = 'ar'
  and r.status in ('granted','short_quotes_only') and r.search_index_allowed and r.ai_processing_allowed
  and (r.expires_at is null or r.expires_at >= current_date)
  and char_length(s.text_original) > 0
  and (r.status <> 'short_quotes_only' or char_length(s.text_original) <= r.max_quote_chars)
  and (s.kind <> 'hadith' or (s.grade in ('sahih','hasan') and s.grader is not null and s.collection is not null and s.numbering is not null))
  and (s.kind <> 'fatwa' or exists(select 1 from public.scholars a where a.id=s.scholar_id and a.approved))
  and exists(select 1 from public.source_search_documents d where d.source_id=s.id and d.approved and d.lang=s.language)`;

async function query(token: string, sql: string, parameters: unknown[], signal: AbortSignal | undefined, request: typeof fetch) {
  if (!token.trim()) throw new Error("management_read_token_missing");
  const timeout = AbortSignal.timeout(30_000);
  const result = await request(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql, parameters }), signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!result.ok) throw new Error(`source_index_read_http_${result.status}`);
  const rows: unknown = await result.json(); if (!Array.isArray(rows)) throw new Error("source_index_read_invalid");
  return rows;
}

/** Admin import utility only. Never imported by a visitor route or browser. */
export async function readBayanIndexSources(token: string, family: "hadith" | "fatwa", limit = 20, after: string | null = null, signal?: AbortSignal, request: typeof fetch = fetch): Promise<StoredSearchSource[]> {
  if (!["hadith", "fatwa"].includes(family) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (after !== null && !UUID.test(after))) throw new Error("invalid_source_index_page");
  const sql = `select s.id,s.kind,s.language,s.title,s.reference,s.text_original,s.url,s.scholar_id,s.grade,s.grader,s.collection,s.numbering,s.rights_id,s.published,
    r.status as rights_status,r.search_index_allowed,r.ai_processing_allowed,r.max_quote_chars,r.expires_at,true as approved_search_document,
    a.name_ar as scholar_name_ar,a.name_en as scholar_name_en,a.name_de as scholar_name_de
    from public.sources s join editorial.source_rights r on r.id=s.rights_id left join public.scholars a on a.id=s.scholar_id
    where s.kind=$3::text and ($1::uuid is null or s.id>$1::uuid) and ${ELIGIBLE}
    order by s.id limit $2::int`;
  const rows = await query(token, sql, [after, limit, family], signal, request);
  if (rows.some(r => !r || typeof r !== "object" || typeof r.id !== "string" || !UUID.test(r.id) || r.kind !== family || r.language !== "ar" || typeof r.text_original !== "string" || typeof r.reference !== "string" || typeof r.url !== "string" || typeof r.rights_id !== "string" || r.published !== true || r.approved_search_document !== true)) throw new Error("source_index_rows_invalid");
  return rows as StoredSearchSource[];
}

/** Current fingerprints are computed in Postgres; original bodies are not downloaded again. */
export async function revalidateBayanIndexSources(token: string, sourceIds: string[], signal?: AbortSignal, request: typeof fetch = fetch): Promise<Map<string, CurrentSourceState>> {
  if (sourceIds.length > 500 || sourceIds.some(id => !UUID.test(id)) || new Set(sourceIds).size !== sourceIds.length) throw new Error("invalid_source_revalidation_ids");
  if (!sourceIds.length) return new Map();
  const sql = `select s.id,s.rights_id,r.expires_at,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(s.text_original,'UTF8')),'hex') as parent_hash,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(${FINGERPRINT_SQL},'UTF8')),'hex') as source_fingerprint
    from public.sources s join editorial.source_rights r on r.id=s.rights_id left join public.scholars a on a.id=s.scholar_id
    where s.id in (select jsonb_array_elements_text($1::jsonb)::uuid) and ${ELIGIBLE}`;
  const rows = await query(token, sql, [JSON.stringify(sourceIds)], signal, request), now = new Date().toISOString();
  const states = new Map<string, CurrentSourceState>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || !sourceIds.includes(row.id) || typeof row.parent_hash !== "string" || !/^[a-f0-9]{64}$/.test(row.parent_hash) || typeof row.source_fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(row.source_fingerprint) || typeof row.rights_id !== "string") throw new Error("source_revalidation_invalid");
    states.set(row.id, { parentOriginalHash: row.parent_hash, sourceFingerprint: row.source_fingerprint, permissions: { published: true, search: true, ai: true, embeddings: false, record: row.rights_id, verifiedAt: now,
      expiresAt: row.expires_at ? `${row.expires_at}T23:59:59.999Z` : null, revoked: false } });
  }
  return states;
}
