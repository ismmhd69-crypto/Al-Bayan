import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { IndexRpc } from "./persistent-index";

/** Explicit server/worker constructor; importing this does not connect, ingest,
 * enable retrieval or load credentials. Never uses the Management API. */
export function serverPersistentIndexRpc(): IndexRpc {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co") throw new Error("persistent_index_not_configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return async (operation, body, signal) => {
    const result = await db.rpc("ask_search_index", { operation, body }).abortSignal(AbortSignal.any([signal, AbortSignal.timeout(10000)]));
    if (result.error) throw new Error("persistent_index_storage_unavailable");
    return result.data;
  };
}
