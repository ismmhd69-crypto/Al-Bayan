import type { CurrentSourceState } from "./index-store";

export type IndexStateRow = { source_id: string; rights_id: string; expires_at: string | null; parent_hash: string; source_fingerprint: string };
export function parseCurrentIndexStates(rows: unknown, requestedIds: string[], checkedAt = new Date()): Map<string, CurrentSourceState> {
  if (!Array.isArray(rows) || rows.length > requestedIds.length) throw new Error("invalid_index_source_states");
  const states = new Map<string, CurrentSourceState>();
  for (const raw of rows) {
    const r = raw as IndexStateRow;
    if (!r || !requestedIds.includes(r.source_id) || states.has(r.source_id) || typeof r.rights_id !== "string" || !r.rights_id || !/^[a-f0-9]{64}$/.test(r.parent_hash) || !/^[a-f0-9]{64}$/.test(r.source_fingerprint)
      || (r.expires_at !== null && (typeof r.expires_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.expires_at)))) throw new Error("invalid_index_source_states");
    states.set(r.source_id, { parentOriginalHash: r.parent_hash, sourceFingerprint: r.source_fingerprint,
      permissions: { published: true, search: true, ai: true, embeddings: false, record: r.rights_id, verifiedAt: checkedAt.toISOString(), expiresAt: r.expires_at ? `${r.expires_at}T23:59:59.999Z` : null, revoked: false } });
  }
  return states;
}
