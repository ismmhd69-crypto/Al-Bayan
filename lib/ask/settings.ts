import { remainingResearchMs } from "./research-runtime";
// Ask settings read from the environment. Pure, so they can be tested without the pipeline.
// Independent rollbacks. Never opt in production while live acceptance is incomplete.
export const askRich = () => process.env.ASK_RICH_ENABLED === "true";
export const askFocusedChecks = () => process.env.ASK_FOCUSED_CHECKS === "true";
export const askDistinctSelection = () => process.env.ASK_DISTINCT_SELECTION === "true";
export const askStreaming = () => process.env.ASK_STREAM_ENABLED === "true";
export const askDurable = () => askRich() && process.env.ASK_DURABLE_ENABLED === "true" && process.env.ASK_JOB_WORKER_ACCEPTED === "true";
export const askPatient = () => askDurable() && process.env.ASK_PATIENT_ENABLED === "true";
// Research preview only. Off by default; existing approved-source checks still run.
export const askMeaningRanking = () => process.env.ASK_MEANING_RANKING === "true";
export const askResearchRecovery = () => process.env.ASK_RESEARCH_RECOVERY === "true";
export const askCorpusRetrieval = () => process.env.ASK_CORPUS_RETRIEVAL === "true";
export const askRichVideos = () => process.env.ASK_RICH_VIDEOS === "true" && process.env.VIDEOS !== "off";
// Owner-only local development. Never relax a deployed function's execution budget.
export const localAskRuntime = () => process.env.NODE_ENV === "development" && !process.env.VERCEL;
export const localAskUnhurried = () => localAskRuntime() && process.env.ASK_LOCAL_UNHURRIED !== "false";
export const localAskTraceEnabled = () => localAskRuntime() && process.env.ASK_LOCAL_TRACE !== "false";
// Broader library/conversation flow is experimental until matched live acceptance passes.
export function askLibraryFlow(value: string | undefined = process.env.ASK_LIBRARY_FLOW): boolean {
  return value === "true";
}
// Experimental general claim audit. Off until independent model evaluation passes acceptance.
export function askClaimAudit(value: string | undefined = process.env.ASK_CLAIM_AUDIT): boolean {
  return value === "true";
}
// Deployed ASK_DEADLINE_MS defaults to 50 s, capped at 55 s within the 60 s route limit.
// Owner-only unhurried local development returns Infinity, handled without creating a timer.
export function askDeadlineMs(value: string | undefined = process.env.ASK_DEADLINE_MS): number {
  const workerRemaining = remainingResearchMs();
  if (workerRemaining !== undefined) return workerRemaining;
  if (localAskUnhurried()) return Number.POSITIVE_INFINITY;
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
