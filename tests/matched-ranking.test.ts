// Scripted model output and invented source wording; no semantic accuracy labels.
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { compareMatchedRanking, prepareMatchedRanking, matchedRankingRetention, type MatchedRankingInput, type MatchedRankingReview } from "@/lib/ask/search-engine/matched-ranking";
import { modelMeaningReranker, meaningRerankingRequest } from "@/lib/ask/search-engine/reranker";
import { pack, dependencies } from "./fixtures/rich";

const input: MatchedRankingInput = { id: "invented-ranking-isolation", frame: { ...pack.question, kind: "question", searchQueries: { en: ["care"] } }, candidates: pack.passages, limit: 1 };
function setup() {
  const deps = dependencies(), selectionInputs: string[][] = [];
  deps.meaningRankCandidates = vi.fn(async () => { throw Error("must not rank twice"); });
  deps.verifier.generateJson = vi.fn(async req => {
    const data = JSON.parse(req.prompt), ids = data.candidates.map((p: { source: { id: string } }) => p.source.id);
    selectionInputs.push(ids);
    return { status: "ready", coverage: "complete", conflict_type: "none", assessments: ids.map((id: string) => ({ source_id: id,
      relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] },
      scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) };
  });
  return { deps, selectionInputs };
}

it("uses identical authoritative candidate/context access and the same cap, then actual shared selection", async () => {
  const { deps, selectionInputs } = setup(), original = structuredClone(input);
  const seen: string[][] = [];
  const result = await compareMatchedRanking(input, deps, async (_concern, passages) => {
    seen.push(passages.map(p => p.id));
    return passages.map(p => ({ id: p.id, score: p.id === "HE9001" ? 100 : 0 }));
  }, new AbortController().signal);
  expect(seen).toEqual([pack.passages.map(p => p.id)]);
  expect(selectionInputs).toEqual([["Q2:183"], ["HE9001"]]);
  expect(deps.meaningRankCandidates).not.toHaveBeenCalled();
  expect(result.equalCandidateAccess).toBe(true);
  expect(result.rows[0].inputHash).toBe(result.rows[1].inputHash);
  expect(result.rows.every(r => r.limit === 1 && r.rankedIds.length <= 1)).toBe(true);
  expect(result.rows.map(r => r.selectedIds)).toEqual([["Q2:183"], ["HE9001"]]);
  expect(result.rows.every(r => r.costUsd === null)).toBe(true);
  expect(result).toMatchObject({ recall: null, answerAccuracy: null, sourceFaithfulness: "not_established" });
  expect(input).toEqual(original);
});

it("can counterbalance order while keeping the same evidence fingerprint", async () => {
  const { deps } = setup();
  const result = await compareMatchedRanking(input, deps, async (_q, passages) => passages.map(p => ({ id: p.id, score: 50 })), new AbortController().signal, { first: "meaning_ranked" });
  expect(result.rows.map(r => r.mode)).toEqual(["meaning_ranked", "concern_family_order"]);
  expect(new Set(result.rows.map(r => r.commonPoolHash)).size).toBe(1);
});

it("rejects malformed ranking rather than silently changing to the baseline", async () => {
  const { deps } = setup();
  await expect(compareMatchedRanking(input, deps, async () => [{ id: "invented-id", score: 100 }], new AbortController().signal,
    { first: "meaning_ranked" })).rejects.toThrow("invalid_reranker_result");
  expect(deps.verifier.generateJson).not.toHaveBeenCalled();
});

it("rejects cancellation and invalid cost tracking before model work", async () => {
  const { deps } = setup(), ranker = vi.fn(), stop = new AbortController(); stop.abort();
  await expect(compareMatchedRanking(input, deps, ranker, stop.signal)).rejects.toMatchObject({ name: "AbortError" });
  await expect(compareMatchedRanking(input, deps, ranker, new AbortController().signal, { costUsd: () => NaN })).rejects.toThrow("matched_ranking_cost_invalid");
  expect(ranker).not.toHaveBeenCalled(); expect(deps.verifier.generateJson).not.toHaveBeenCalled();
});

it("binds conditions and exact context into the comparison identity", () => {
  const baseline = prepareMatchedRanking(input);
  const changed = structuredClone(input);
  changed.frame.requirements[0].essentialConditions = ["Preserve this invented exception"];
  expect(prepareMatchedRanking(changed).inputHash).not.toBe(baseline.inputHash);
  changed.candidates[0].context.push({ ...(changed.candidates[0].source.kind === "quran" ? changed.candidates[0].source.verse : (() => { throw Error("fixture"); })()), key: "2:184", arabic: "سياق مخترع للاختبار" });
  expect(prepareMatchedRanking(changed).commonPoolHash).not.toBe(baseline.commonPoolHash);
});

it("refuses an ineligible common source and preserves legitimate pools above sixty candidates", () => {
  const bad = structuredClone(input); bad.candidates[1].id = "mismatched";
  expect(() => prepareMatchedRanking(bad)).toThrow("matched_ranking_requires_eligible_common_pool");
  const quran = pack.passages[0].source;
  if (quran.kind !== "quran") throw Error("fixture");
  const many = Array.from({ length: 80 }, (_, i) => ({ ...pack.passages[0], id: `Q2:${i + 1}`, source: { kind: "quran" as const, verse: { ...quran.verse, key: `2:${i + 1}` } }, retrievedFor: ["R1"] }));
  expect(prepareMatchedRanking({ ...input, candidates: many }).input.candidates).toHaveLength(80);
});

it("shares the exact ranking request builder with the provider adapter", async () => {
  const concern = { id: "R1", text: "Invented meaning with an exception" }, passages = [{ id: "Q2:183", title: "Fixture", original: "نص مخترع", before: "قيد مخترع", after: "" }];
  const provider = { id: "scripted", generateJson: vi.fn(async () => ({ rankings: [{ id: "Q2:183", score: 90 }] })) };
  const signal = new AbortController().signal;
  await modelMeaningReranker(provider)(concern, passages, signal);
  expect(provider.generateJson).toHaveBeenCalledWith(meaningRerankingRequest(concern, passages, signal));
});

it("separates pool gaps, ranking losses and selection losses without counting half a joint contribution", () => {
  const prepared = prepareMatchedRanking({ ...input, limit: 3 }), ids = pack.passages.map(p => p.id);
  const review: MatchedRankingReview = { inputHash: prepared.inputHash, status: "accepted", reviewer: "Invented test reviewer", reviewedAt: "2026-10-22T00:00:00Z",
    sourceReview: "reviewed", languageReview: "reviewed", units: [
      { id: "joint", kind: "answer", alternatives: [[ids[0], ids[1]]] },
      { id: "condition", kind: "qualification", alternatives: [[ids[2]]] },
      { id: "absent", kind: "answer", alternatives: [["HE999999"]] },
    ] };
  const measured = matchedRankingRetention(prepared, [ids[0], ids[1]], [ids[0]], review);
  expect(measured.units?.map(u => u.stage)).toEqual(["lost_at_selection", "lost_at_ranking", "missing_from_frozen_pool"]);
  expect(measured.retained).toBe(0);
  expect(matchedRankingRetention(prepared, ids, ids, review).retained).toBe(2);
});

it("withholds retention metrics for pending labels and rejects labels for different originals", () => {
  const prepared = prepareMatchedRanking(input);
  expect(matchedRankingRetention(prepared, [], [])).toMatchObject({ status: "review_pending", units: null, retained: null });
  const review: MatchedRankingReview = { inputHash: "wrong-input", status: "accepted", reviewer: "Invented test reviewer", reviewedAt: "2026-10-22T00:00:00Z",
    sourceReview: "reviewed", languageReview: "reviewed", units: [{ id: "point", kind: "answer", alternatives: [["Q2:183"]] }] };
  expect(() => matchedRankingRetention(prepared, ["Q2:183"], ["Q2:183"], review)).toThrow("matched_ranking_review_invalid");
  review.inputHash = prepared.inputHash;
  expect(() => matchedRankingRetention(prepared, ["Q2:183"], ["HE9001"], review)).toThrow("matched_ranking_measurement_invalid");
});
