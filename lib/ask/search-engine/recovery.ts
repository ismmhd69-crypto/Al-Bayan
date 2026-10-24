import type { PassageForSelection, QuestionFrame } from "../retrieval";
import { candidateIdentity, uniqueResearchCandidates } from "./candidate-identity";
import { abortable } from "../abort";
import { searchTokens } from "./hybrid";

export type RecoveryFamily = "quran" | "hadith" | "scholar";
export type EvidenceGap = { requirementId: string; concern: string; reason: "missing_direct_support" | "missing_source_contribution"; families: RecoveryFamily[] };
export type RecoveryQuery = { requirementId: string; family: RecoveryFamily; language: "ar" | "en" | "de"; text: string };
export type RecoveryPlanInput = { frame: QuestionFrame; gaps: EvidenceGap[]; previousQueries: RecoveryQuery[]; visitedSources: string[]; round: number };
export type RecoveryPlanner = (input: RecoveryPlanInput, signal: AbortSignal) => Promise<RecoveryQuery[]>;
export type RecoveryEvent = { code: "planned" | "no_new_queries" | "search_failed" | "no_new_sources" | "reselected" | "finished"; round: number; queries?: number; sources?: number; pool?: number; remainingGaps?: number };
export const recoveryQueryKey = (q: RecoveryQuery) => `${q.family}:${q.language}:${searchTokens(q.text).join(" ")}`;

/** No religious decisions here. The caller's independent evidence selector
 * determines coverage after each genuinely novel retrieval round. */
export async function recoverEvidence<T>(options: {
  frame: QuestionFrame; initial: T; candidates: PassageForSelection[]; previousQueries: RecoveryQuery[];
  gaps: (value: T) => EvidenceGap[]; plan: RecoveryPlanner;
  search: (query: RecoveryQuery, signal: AbortSignal) => Promise<PassageForSelection[]>;
  assess: (candidates: PassageForSelection[], signal: AbortSignal) => Promise<T>;
  onNovelEvidence?: (candidates: PassageForSelection[]) => void;
  onPlanned?: (queries: RecoveryQuery[]) => Promise<void>;
  onRoundStart?: (round: number) => Promise<void>;
  onSearchResult?: (query: RecoveryQuery, candidates: PassageForSelection[], status: "finished" | "failed") => Promise<void>;
  signal: AbortSignal; maxRounds?: number; startingRound?: number; onEvent?: (event: RecoveryEvent) => void;
}): Promise<{ value: T; candidates: PassageForSelection[]; rounds: number; remainingGaps: EvidenceGap[] }> {
  const maxRounds = options.maxRounds ?? 2;
  const startingRound = options.startingRound ?? 0;
  if (!Number.isSafeInteger(maxRounds) || maxRounds < 1 || maxRounds > 2 || !Number.isSafeInteger(startingRound) || startingRound < 0 || startingRound > maxRounds || options.candidates.length > 120) throw new Error("invalid_research_budget");
  let value = options.initial, candidates = uniqueResearchCandidates(options.candidates), rounds = 0;
  const previousQueries = [...options.previousQueries], visitedQueries = new Set(previousQueries.map(recoveryQueryKey));
  const visitedSources = new Set(candidates.map(candidateIdentity));
  for (let round = startingRound + 1; round <= maxRounds; round++) {
    options.signal.throwIfAborted();
    const gaps = options.gaps(value); if (!gaps.length) break;
    await options.onRoundStart?.(round);
    const proposed = await abortable(options.plan({ frame: options.frame, gaps, previousQueries: [...previousQueries], visitedSources: candidates.map(c => c.id), round }, options.signal), options.signal);
    if (!Array.isArray(proposed) || proposed.length > 6) throw new Error("invalid_recovery_plan");
    const queries: RecoveryQuery[] = [];
    for (const q of proposed) {
      if (!q || typeof q !== "object") throw new Error("invalid_recovery_plan");
      const gap = gaps.find(g => g.requirementId === q.requirementId && g.families.includes(q.family));
      if (!gap || !["ar", "en", "de"].includes(q.language) || typeof q.text !== "string" || !q.text.trim() || q.text.length > 120
        || !searchTokens(q.text).length || (q.family === "scholar" && q.language !== "ar") || (q.language === "ar" && !/\p{Script=Arabic}/u.test(q.text))) throw new Error("invalid_recovery_plan");
      const key = recoveryQueryKey(q); if (visitedQueries.has(key)) continue;
      visitedQueries.add(key); previousQueries.push(q); queries.push(q);
    }
    rounds = round;
    options.onEvent?.({ code: queries.length ? "planned" : "no_new_queries", round, queries: queries.length });
    if (!queries.length) break;
    await options.onPlanned?.(queries);
    const batches = await Promise.all(queries.map(async q => {
      let found: PassageForSelection[] = [], status: "finished" | "failed" = "finished";
      try {
        const result = await abortable(options.search(q, options.signal), options.signal);
        if (!Array.isArray(result) || result.length > 20 || result.some(c => c.source.kind !== q.family)) throw new Error("invalid_recovery_sources");
        found = result.map(c => ({ ...c, retrievedFor: [...new Set([...(c.retrievedFor ?? []), q.requirementId])] }));
      } catch (error) {
        options.signal.throwIfAborted(); options.onEvent?.({ code: "search_failed", round }); status = "failed";
      }
      // Checkpoint failures must propagate, not masquerade as source outages or
      // permit a paid reassessment against work that has not been saved.
      await options.onSearchResult?.(q, found, status);
      return found;
    }));
    const novel = uniqueResearchCandidates(batches.flat()).filter(c => !visitedSources.has(candidateIdentity(c)));
    options.onEvent?.({ code: novel.length ? "reselected" : "no_new_sources", round, sources: novel.length });
    if (!novel.length) break;
    // Each query contributes in turn before the global bound. Gaps stay explicit
    // if the bound prevents collecting enough material; nothing counts as covered.
    const combined = uniqueResearchCandidates([...candidates, ...novel]);
    if (combined.length > 120) throw new Error("recovery_candidate_budget_exceeded");
    options.onNovelEvidence?.(novel);
    for (const c of novel) visitedSources.add(candidateIdentity(c));
    candidates = combined;
    const assessed = await abortable(options.assess(candidates, options.signal), options.signal);
    value = assessed;
  }
  const remainingGaps = options.gaps(value);
  options.onEvent?.({ code: "finished", round: rounds, pool: candidates.length, remainingGaps: remainingGaps.length });
  return { value, candidates, rounds, remainingGaps };
}
