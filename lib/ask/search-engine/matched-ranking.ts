import { createHash } from "node:crypto";
import type { PipelineDeps } from "../core";
import type { PassageForSelection, QuestionFrame } from "../retrieval";
import type { MeaningReranker } from "./hybrid";
import { researchCandidatePool } from "./research-candidate-pool";
import { eligibleCorpusCandidates } from "./pipeline-corpus";
import { pipelineMeaningRanker } from "./pipeline-ranking";
import { selectPatientEvidence } from "../patient-models";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export type MatchedRankingInput = { id: string; frame: QuestionFrame; candidates: PassageForSelection[]; limit: number };
export type RankingMode = "concern_family_order" | "meaning_ranked";
export type MatchedRankingReview = { inputHash: string; status: "pending" | "accepted"; reviewer: string | null; reviewedAt: string | null;
  sourceReview: "pending" | "reviewed"; languageReview: "pending" | "reviewed";
  units: { id: string; kind: "answer" | "qualification"; alternatives: string[][] }[] };

/** Jointly necessary excerpts stay joint. Labels must bind this exact frozen
 * input; retention is never claim support or a conclusion about corpus recall. */
export function matchedRankingRetention(input: ReturnType<typeof prepareMatchedRanking>, rankedIds: string[], selectedIds: string[], review?: MatchedRankingReview) {
  if (!review || review.status === "pending") return { status: "review_pending", units: null, retained: null };
  const pool = new Set(input.input.candidates.map(p => p.id));
  if (review.status !== "accepted" || review.inputHash !== input.inputHash || typeof review.reviewer !== "string" || !review.reviewer.trim() || !Number.isFinite(Date.parse(review.reviewedAt ?? ""))
    || review.sourceReview !== "reviewed" || review.languageReview !== "reviewed" || !Array.isArray(review.units) || !review.units.length || review.units.length > 32
    || new Set(review.units.map(u => u.id)).size !== review.units.length
    || review.units.some(u => !u.id || !["answer", "qualification"].includes(u.kind) || !Array.isArray(u.alternatives) || !u.alternatives.length || u.alternatives.length > 8
      || u.alternatives.some(a => !Array.isArray(a) || !a.length || a.length > 14 || new Set(a).size !== a.length || a.some(id => typeof id !== "string" || !id.trim() || id.length > 150)))) throw Error("matched_ranking_review_invalid");
  if (new Set(rankedIds).size !== rankedIds.length || rankedIds.some(id => !pool.has(id)) || new Set(selectedIds).size !== selectedIds.length
    || selectedIds.some(id => !rankedIds.includes(id))) throw Error("matched_ranking_measurement_invalid");
  const has = (ids: Set<string>, alternatives: string[][]) => alternatives.some(alt => alt.every(id => ids.has(id)));
  const ranked = new Set(rankedIds), selected = new Set(selectedIds);
  const units = review.units.map(u => ({ id: u.id, kind: u.kind, stage: !has(pool, u.alternatives) ? "missing_from_frozen_pool"
    : !has(ranked, u.alternatives) ? "lost_at_ranking" : !has(selected, u.alternatives) ? "lost_at_selection" : "retained" }));
  return { status: "reviewed_input_retention_only", units, retained: units.filter(u => u.stage === "retained").length,
    note: "A pool gap cannot distinguish missing corpus content from a discovery miss. Retained source IDs do not prove supported wording, answer completeness or religious accuracy." };
}

/** Component isolation: common original/context access AND downstream cap. The
 * order-only baseline is explicit; this is not a replay of the whole old website. */
export function prepareMatchedRanking(input: MatchedRankingInput) {
  if (!input || typeof input.id !== "string" || !input.id || input.id.length > 120 || !input.frame || input.frame.kind !== "question" || input.frame.clarificationNeeded
    || !Array.isArray(input.candidates) || input.candidates.length > 120
    || !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 30) throw Error("matched_ranking_input_invalid");
  const candidates = [input.candidates.slice(0, 60), input.candidates.slice(60)].flatMap(batch => eligibleCorpusCandidates(batch));
  if (candidates.length !== input.candidates.length) throw Error("matched_ranking_requires_eligible_common_pool");
  const pool = researchCandidatePool(input.frame, candidates).candidates;
  if (pool.length !== candidates.length) throw Error("matched_ranking_common_pool_changed");
  const frozen = structuredClone({ ...input, candidates: pool });
  return { input: frozen, inputHash: hash(frozen), commonPoolHash: hash(pool), baselineIds: researchCandidatePool(input.frame, pool, input.limit).candidates.map(p => p.id),
    modelCalls: 0, sourceFaithfulness: "not_established", measurementScope: "ranking_and_selection_on_fixed_candidates_not_discovery_or_answer_accuracy" };
}

/** No provider construction, IO or retries. Real callers must install the shared
 * spending guard and validate current permissions before invoking paid providers. */
export async function compareMatchedRanking(input: MatchedRankingInput, deps: PipelineDeps, ranker: MeaningReranker, signal: AbortSignal,
  options: { first?: RankingMode; costUsd?: () => number; review?: MatchedRankingReview } = {}) {
  if (options.first !== undefined && !["meaning_ranked", "concern_family_order"].includes(options.first)) throw Error("matched_ranking_order_invalid");
  const prepared = prepareMatchedRanking(input), frozenHash = prepared.inputHash;
  // Reject stale review labels before any supplied model could be called.
  matchedRankingRetention(prepared, [], [], options.review);
  const order: RankingMode[] = options.first === "meaning_ranked" ? ["meaning_ranked", "concern_family_order"] : ["concern_family_order", "meaning_ranked"];
  const rows = [];
  for (const mode of order) {
    signal.throwIfAborted();
    const copy = structuredClone(prepared.input), beforeCost = options.costUsd?.() ?? null;
    if (beforeCost !== null && (!Number.isFinite(beforeCost) || beforeCost < 0)) throw Error("matched_ranking_cost_invalid");
    let rankingCalls = 0, rankingAudit: object | null = null;
    const rankingStarted = performance.now();
    const ranked = mode === "meaning_ranked" ? await pipelineMeaningRanker(async (...args) => { rankingCalls++; return ranker(...args); }, audit => { rankingAudit = audit; }, copy.limit)(copy.frame, copy.candidates, signal)
      : researchCandidatePool(copy.frame, copy.candidates, copy.limit).candidates;
    const rankingMs = performance.now() - rankingStarted;
    if (hash(copy) !== frozenHash) throw Error("matched_ranking_input_mutated");
    // Ranking controls candidate order/retention only. Never accept replacement originals.
    const original = new Map(copy.candidates.map(p => [p.id, p]));
    if (ranked.length > copy.limit || new Set(ranked.map(p => p.id)).size !== ranked.length
      || ranked.some(p => !original.has(p.id) || hash(original.get(p.id)) !== hash(p))) throw Error("matched_ranking_candidates_changed");
    const selectionStarted = performance.now();
    let rejection: string | null = null;
    // Skip a second implicit ranking pass: both sides call the actual selector on
    // their respective outputs from the same frozen input and same explicit cap.
    const pack = await selectPatientEvidence(copy.frame, ranked, { ...deps, meaningRankCandidates: undefined }, signal, false, code => { rejection = code; });
    if (hash(copy) !== frozenHash) throw Error("matched_ranking_input_mutated");
    const afterCost = options.costUsd?.() ?? null;
    if (beforeCost !== null && (afterCost === null || !Number.isFinite(beforeCost) || !Number.isFinite(afterCost) || beforeCost < 0 || afterCost < beforeCost)) throw Error("matched_ranking_cost_invalid");
    rows.push({ mode, inputHash: frozenHash, commonPoolHash: prepared.commonPoolHash, limit: copy.limit, rankingCalls, rankingAudit,
      rankingMs, selectionMs: performance.now() - selectionStarted, costUsd: beforeCost === null ? null : afterCost! - beforeCost,
      rankedIds: ranked.map(p => p.id), selectedIds: pack?.passages.map(p => p.id) ?? [], automaticSelection: pack ? "ready" : "rejected", rejection,
      retention: matchedRankingRetention(prepared, ranked.map(p => p.id), pack?.passages.map(p => p.id) ?? [], options.review),
      selectorProvider: deps.verifier.id, distinctSelection: deps.distinctSelection === true });
  }
  return { id: input.id, rows, equalCandidateAccess: rows.every(r => r.commonPoolHash === prepared.commonPoolHash && r.limit === input.limit),
    sourceFaithfulness: "not_established", recall: null, answerAccuracy: null, note: "Counts and ready selections are not reviewed relevance labels or completed answers. No writer/checker answer evaluation is performed." };
}
