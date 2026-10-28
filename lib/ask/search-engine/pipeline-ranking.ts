import type { PassageForSelection, QuestionFrame } from "../retrieval";
import type { MeaningReranker } from "./hybrid";
import { abortable } from "../abort";
import { checkedRerankerScores } from "./reranker-result";
import { concernMeaning } from "./concern-meaning";
import { researchCandidatePool } from "./research-candidate-pool";

export type PipelineRankingAudit = { concerns: number; before: number; after: number; modelCalls: number; droppedIds: string[]; ignoredUnknownCount: number; fallbackReason?: string };
export type PipelineMeaningRanker = (frame: QuestionFrame, candidates: PassageForSelection[], signal: AbortSignal) => Promise<PassageForSelection[]>;

/** Re-ranks the existing, already source-filtered candidates before lexical caps.
 * This adapter does not claim to provide corpus-wide semantic retrieval. */
export function pipelineMeaningRanker(reranker: MeaningReranker, onAudit?: (audit: PipelineRankingAudit) => void, limit = 30,
  options: { retainCandidatesOnInvalidResult?: boolean } = {}): PipelineMeaningRanker {
  return async (frame, candidates, signal) => {
    signal.throwIfAborted();
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 30 || candidates.length > 120 || new Set(candidates.map(c => c.id)).size !== candidates.length || !frame.requirements.length || frame.requirements.length > 4) throw new Error("meaning_ranking_budget_invalid");
    const passages = candidates.map(c => ({ id: c.id, title: c.source.kind === "scholar" ? c.source.quote.title ?? "" : c.id,
      original: c.source.kind === "quran" ? c.source.verse.arabic : c.source.kind === "hadith" ? c.source.hadith.arabic : c.source.quote.arabic,
      before: c.context.filter(v => v.key !== (c.source.kind === "quran" ? c.source.verse.key : "")).map(v => `${v.key}: ${v.arabic}`).join("\n"), after: "",
    }));
    if (JSON.stringify(passages).length > 100_000) throw new Error("meaning_ranking_context_budget_exceeded");
    if (!candidates.length) return [];
    const rankings: { id: string; score: number }[][] = [];
    const concerns = frame.requirements.map(r => ({ id: r.id, text: concernMeaning(frame, r) }));
    let ignoredUnknownCount = 0;
    // One bounded request can score all concerns without changing the fair merge.
    // Existing custom/saved rerankers keep their sequential interface.
    let batch: { id: string; score: number }[][] | undefined;
    try {
      batch = reranker.batch && concerns.length > 1 ? await abortable(reranker.batch(concerns, passages, signal), signal) : undefined;
      if (batch && batch.length !== concerns.length) throw Error("invalid_reranker_result");
    } catch (error) {
      signal.throwIfAborted();
      const reason = error instanceof Error ? error.message : "";
      if (!options.retainCandidatesOnInvalidResult || !["invalid_reranker_result", "invalid_reranker_score", "unreadable_reranker_result"].includes(reason)) throw error;
      const retained = researchCandidatePool(frame, candidates, limit).candidates;
      onAudit?.({ concerns: concerns.length, before: candidates.length, after: retained.length, modelCalls: 1,
        droppedIds: candidates.filter(c => !retained.some(p => p.id === c.id)).map(c => c.id), ignoredUnknownCount: 0, fallbackReason: reason });
      return retained;
    }
    for (const [index, concern] of concerns.entries()) {
      signal.throwIfAborted();
      let checked: ReturnType<typeof checkedRerankerScores>;
      try {
        const result = batch ? batch[index] : await abortable(reranker(concern, passages, signal), signal);
        checked = checkedRerankerScores(result, candidates.map(c => c.id));
      } catch (error) {
        signal.throwIfAborted();
        // An invalid discovery score is not a verdict against any original. Discard
        // the whole score set, retain a fair bounded source pool, and let the
        // independent selector decide support. Never catch billing/storage/transport
        // failures here or issue an automatic replacement model call.
        const reason = error instanceof Error ? error.message : "";
        if (!options.retainCandidatesOnInvalidResult || !["invalid_reranker_result", "invalid_reranker_score", "unreadable_reranker_result"].includes(reason)) throw error;
        const retained = researchCandidatePool(frame, candidates, limit).candidates;
        onAudit?.({ concerns: frame.requirements.length, before: candidates.length, after: retained.length,
          modelCalls: batch ? 1 : rankings.length + 1, droppedIds: candidates.filter(c => !retained.some(p => p.id === c.id)).map(c => c.id), ignoredUnknownCount: 0, fallbackReason: reason });
        return retained;
      }
      ignoredUnknownCount += checked.ignoredUnknownCount;
      rankings.push(checked.scores.filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)));
    }
    const byId = new Map(candidates.map(c => [c.id, c])), chosen = new Set<string>();
    // Preserve each concern's strongest useful contribution from each family.
    for (const ranking of rankings) for (const family of ["quran", "hadith", "scholar"] as const) {
      const best = ranking.find(r => byId.get(r.id)!.source.kind === family);
      if (best && chosen.size < limit) chosen.add(best.id);
    }
    for (let rank = 0; rank < candidates.length && chosen.size < limit; rank++) for (const ranking of rankings) {
      const item = ranking[rank]; if (item && chosen.size < limit) chosen.add(item.id);
    }
    const result = [...chosen].map(id => byId.get(id)!);
    onAudit?.({ concerns: frame.requirements.length, before: candidates.length, after: result.length, modelCalls: batch ? 1 : rankings.length, droppedIds: candidates.filter(c => !chosen.has(c.id)).map(c => c.id), ignoredUnknownCount });
    return result;
  };
}
