import { createClient } from "@supabase/supabase-js";
import { handleAccountResearchExport } from "@/lib/ask/search-engine/account-export-api";
import { serverResearchJobs } from "@/lib/ask/search-engine/server-jobs";

export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key || new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co") throw new Error("account_export_not_configured");
    const enabled = !!process.env.ASK_JOB_ENCRYPTION_KEY || !!process.env.ASK_JOB_OWNER_SECRET || process.env.ASK_DURABLE_ENABLED === "true";
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return await handleAccountResearchExport(request, {
      enabled,
      verifyUser: async token => { const { data, error } = await client.auth.getUser(token); return !error && data.user ? data.user.id : null; },
      exportPage: (...args) => serverResearchJobs().exportAccount(...args),
    });
  } catch { return Response.json({ status: "research_export_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
