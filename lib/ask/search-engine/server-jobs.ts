import "server-only";
import { createClient } from "@supabase/supabase-js";
import { researchJobEncryption } from "./job-encryption";
import { researchJobStore } from "./job-store";

/** Explicitly configured server/worker only. No Management API token or automatic key generation. */
export function serverResearchJobs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  const encryptionKey = process.env.ASK_JOB_ENCRYPTION_KEY, keyId = process.env.ASK_JOB_KEY_ID;
  if (!url || !key || new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co" || !encryptionKey || !keyId) throw new Error("research_jobs_not_configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return researchJobStore(async (operation, payload) => {
    const result = await db.rpc("ask_research_job", { operation, payload }).abortSignal(AbortSignal.timeout(10_000));
    if (result.error) throw new Error("research_job_storage_unavailable");
    return result.data;
  }, researchJobEncryption(keyId, encryptionKey));
}
