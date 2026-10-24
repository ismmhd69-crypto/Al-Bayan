import type { PassageForSelection, QuestionFrame } from "../retrieval";
import { uniqueResearchCandidates } from "./candidate-identity";

/** Reserve discovery space by concern and family without a title/word-match gate.
 * Search provenance is not evidence coverage. Selection still checks every original. */
export function researchCandidatePool(frame: QuestionFrame, candidates: PassageForSelection[], limit = 120) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 120 || candidates.length > 500
    || !frame.requirements.length || frame.requirements.length > 4) throw new Error("research_candidate_budget_invalid");
  const unique = uniqueResearchCandidates(candidates);
  const families = ["quran", "hadith", "scholar"] as const;
  const streams = frame.requirements.flatMap(r => families.map(family => unique.filter(p => p.source.kind === family && p.retrievedFor?.includes(r.id))));
  // Named passages and other candidates without point provenance remain available too.
  streams.push(...families.map(family => unique.filter(p => p.source.kind === family)));
  const chosen = new Map<string, PassageForSelection>();
  for (let rank = 0; rank < unique.length && chosen.size < limit; rank++) for (const stream of streams) {
    const p = stream[rank]; if (p && chosen.size < limit) chosen.set(p.id, p);
  }
  return { candidates: [...chosen.values()], before: unique.length, after: chosen.size,
    unrepresentedRequirementIds: frame.requirements.filter(r => ![...chosen.values()].some(p => p.retrievedFor?.includes(r.id))).map(r => r.id) };
}
