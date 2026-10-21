import "server-only";
import { createClient } from "@supabase/supabase-js";
import { askDurable, askStreaming } from "@/lib/ask/settings";
import { askEnabled } from "@/lib/ask/limits";
import { handleResearchJob, type ResearchAction } from "./job-api";
import { researchOwners } from "./job-owner";
import { researchEngineRevision } from "./job-policy";
import { serverResearchJobs } from "./server-jobs";

export async function researchJobRoute(
  request: Request,
  action: ResearchAction,
): Promise<Response> {
  const headers = {
    "Cache-Control": "private, no-store",
    "Content-Type": "application/json",
  };
  if (!askEnabled() || !askDurable())
    return new Response(JSON.stringify({ status: "not_ready" }), {
      status: 404,
      headers,
    });
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.SUPABASE_SECRET_KEY,
      secret = process.env.ASK_JOB_OWNER_SECRET;
    const maxCostUsd = Number(process.env.ASK_JOB_MAX_COST_USD);
    if (
      !url ||
      new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co" ||
      !key ||
      !secret ||
      !Number.isFinite(maxCostUsd) ||
      maxCostUsd <= 0 ||
      maxCostUsd > 1.5
    )
      throw new Error("research_api_not_configured");
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
      },
    });
    const { serverJobFreshness } = await import("./server-job-freshness");
    return await handleResearchJob(request, action, {
      owners: researchOwners(secret),
      store: serverResearchJobs(),
      freshness: serverJobFreshness(),
      engineRevision: researchEngineRevision(),
      maxCostUsd,
      streaming: askStreaming(),
      async verifyUser(token) {
        const { data, error } = await db.auth.getUser(token);
        if (error && (error.status ?? 0) >= 500)
          throw new Error("research_auth_unavailable");
        return !error && data.user ? data.user.id : null;
      },
    });
  } catch {
    return new Response(JSON.stringify({ status: "research_unavailable" }), {
      status: 503,
      headers,
    });
  }
}
