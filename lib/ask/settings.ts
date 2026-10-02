// Ask settings read from the environment. Pure, so they can be tested without the pipeline.
// ASK_DEADLINE_MS: the whole answer's deadline (default 50 s). Capped at 55 s so it always ends before
// the route's 60 s limit and the visitor gets the normal busy message, never a cut-off answer.
export function askDeadlineMs(value: string | undefined = process.env.ASK_DEADLINE_MS): number {
  const n = Number(value);
  if (!value || !Number.isFinite(n) || n <= 0) return 50_000;
  return Math.min(Math.max(Math.floor(n), 10_000), 55_000);
}

// ASK_LEAN=true: fewer candidates for the evidence check (for slower models). Off by default.
export const LEAN_CANDIDATE_LIMITS = { quran: 5, hadith: 2, scholar: 3 } as const;
