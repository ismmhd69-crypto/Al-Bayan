import type { PassageForSelection, QuestionFrame } from "../retrieval";
import type { MeaningReranker } from "./hybrid";
import { abortable } from "../abort";

export type PipelineRankingAudit = { concerns: number; before: number; after: number; modelCalls: number; droppedIds: string[] };
export type PipelineMeaningRanker = (frame: QuestionFrame, candidates: PassageForSelection[], signal: AbortSignal) => Promise<PassageForSelection[]>;

/** Re-ranks the existing, already source-filtered candidates before lexical caps.
 * This adapter does not claim to provide corpus-wide semantic retrieval. */
export function pipelineMeaningRanker(reranker: MeaningReranker, onAudit?: (audit: PipelineRankingAudit) => void, limit = 30): PipelineMeaningRanker {
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
    // Sequential and at most four calls. No unbounded per-passage paid fan-out.
    for (const concern of frame.requirements) {
      signal.throwIfAborted();
      const result = await abortable(reranker({ id: concern.id, text: concern.text }, passages, signal), signal);
      if (!Array.isArray(result) || result.length !== candidates.length || new Set(result.map(r => r.id)).size !== result.length
        || result.some(r => !candidates.some(c => c.id === r.id) || !Number.isFinite(r.score) || r.score < 0 || r.score > 100)) throw new Error("invalid_reranker_result");
      rankings.push(result.filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)));
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
    onAudit?.({ concerns: frame.requirements.length, before: candidates.length, after: result.length, modelCalls: rankings.length, droppedIds: candidates.filter(c => !chosen.has(c.id)).map(c => c.id) });
    return result;
  };
}
