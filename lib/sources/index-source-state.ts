import "server-only";
import { createClient } from "@supabase/supabase-js";
import { parseCurrentIndexStates } from "@/lib/ask/search-engine/source-state";

/** Narrow server-only metadata RPC. No Management API token in the visitor path. */
export async function currentIndexSourceStates(sourceIds: string[], signal?: AbortSignal) {
  if (sourceIds.length > 500 || new Set(sourceIds).size !== sourceIds.length || sourceIds.some(s => !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s))) throw new Error("invalid_index_source_ids");
  if (!sourceIds.length) return new Map();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || new URL(url).hostname !== "jnietkyxgnocyizvjiel.supabase.co") throw new Error("index_source_state_not_configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const query = db.rpc("read_approved_index_source_state", { source_ids: sourceIds });
  const result = await (signal ? query.abortSignal(signal) : query);
  if (result.error) throw new Error("index_source_state_unavailable");
  return parseCurrentIndexStates(result.data, sourceIds);
}
