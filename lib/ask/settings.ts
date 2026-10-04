// Ask settings read from the environment. Pure, so they can be tested without the pipeline.
// Experimental general claim audit. Off until independent model evaluation passes acceptance.
export function askClaimAudit(value: string | undefined = process.env.ASK_CLAIM_AUDIT): boolean {
  return value === "true";
}
// ASK_DEADLINE_MS: the whole answer's deadline (default 50 s). Capped at 55 s so it always ends before
// the route's 60 s limit and the visitor gets the normal busy message, never a cut-off answer.
export function askDeadlineMs(value: string | undefined = process.env.ASK_DEADLINE_MS): number {
  const n = Number(value);
  if (!value || !Number.isFinite(n) || n <= 0) return 50_000;
  return Math.min(Math.max(Math.floor(n), 10_000), 55_000);
}

// ASK_LEAN=true: fewer candidates for the evidence check (for slower models). Off by default.
export const LEAN_CANDIDATE_LIMITS = { quran: 5, hadith: 2, scholar: 3 } as const;

// ASK_TIERED=true: evidence is chosen per tier (Quran, then hadith, then scholars), videos last.
// Anything else keeps the single shared evidence check.
export function askTiered(value: string | undefined = process.env.ASK_TIERED): boolean {
  return value === "true";
}

// ASK_VIDEO_BUDGET_MS (tiered mode): videos are added only if the checked answer was ready within this
// time (default 20 s). 0 means never.
export function askVideoBudgetMs(value: string | undefined = process.env.ASK_VIDEO_BUDGET_MS): number {
  const n = Number(value);
  if (value === undefined || value.trim() === "" || !Number.isFinite(n) || n < 0) return 20_000;
  return Math.min(Math.floor(n), 55_000);
}

// MAX_VIDEOS (tiered mode): at most this many related videos (default 4, never more than 4).
export function askMaxVideos(value: string | undefined = process.env.MAX_VIDEOS): number {
  const n = Number(value);
  if (value === undefined || value.trim() === "" || !Number.isFinite(n) || n < 0) return 4;
  return Math.min(Math.floor(n), 4);
}
