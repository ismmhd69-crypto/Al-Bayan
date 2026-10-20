import type { RightsMetadata } from "../lib/ask/search-engine/inventory";

/** Fixed metadata SELECT through Supabase's read-only endpoint. No arbitrary SQL. */
export async function readBayanRightsMetadata(token: string, request: typeof fetch = fetch): Promise<RightsMetadata[]> {
  if (!token.trim()) throw new Error("management_read_token_missing");
  const response = await request("https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query/read-only", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "select id, owner, status, search_index_allowed, ai_processing_allowed, translation_index_allowed, expires_at from editorial.source_rights order by owner" }), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`rights_metadata_http_${response.status}`);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.some(r => !r || typeof r !== "object" || typeof r.id !== "string" || typeof r.owner !== "string" || typeof r.status !== "string"
    || typeof r.search_index_allowed !== "boolean" || typeof r.ai_processing_allowed !== "boolean" || typeof r.translation_index_allowed !== "boolean" || (r.expires_at !== null && typeof r.expires_at !== "string"))) throw new Error("rights_metadata_invalid");
  return rows;
}
