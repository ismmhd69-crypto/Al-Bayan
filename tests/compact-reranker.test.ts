import { expect, it, vi } from "vitest";
import { decodeMeaningScores, meaningRerankingRequest, modelMeaningReranker } from "../lib/ask/search-engine/reranker";
import { checkedRerankerScores } from "../lib/ask/search-engine/reranker-result";
import { pipelineMeaningRanker } from "../lib/ask/search-engine/pipeline-ranking";
import recorded from "./fixtures/reranker-context-extra.json";
import missing from "./fixtures/reranker-missing-candidates.json";
import { pack } from "./fixtures/rich";
const concern = { id: "R1", text: "A test concern, not evidence" };
const passages = [{ id: "source-a", original: "Invented original A", title: "Test A", before: "context-only-id", after: "" },
  { id: "source-b", original: "Invented original B", title: "Test B", before: "", after: "A restrictive condition" }];

it("maps every position back to its exact source ID, including ties, zeros and fractional scores", () => {
  expect(decodeMeaningScores({ scores: [0, 95.5] }, ["source-a", "source-b"])).toEqual([{ id: "source-a", score: 0 }, { id: "source-b", score: 95.5 }]);
  expect(decodeMeaningScores({ scores: [25, 25] }, ["a", "b"])).toEqual([{ id: "a", score: 25 }, { id: "b", score: 25 }]);
});
it.each([null, {}, { scores: [90] }, { scores: [90, 80, 70] }, { scores: [90, "80"] }, { scores: [null, 0] }, { scores: [NaN, 0] }, { scores: [Infinity, 0] }, { scores: [-1, 80] }, { scores: [101, 80] }, { scores: { P1: 90, P2: 80 } }, { scores: [90, 80], id: "context-only-id" }, { rankings: [{ id: "source-a", score: 90 }, { id: "source-b", score: 80 }] }])("rejects the entire invalid response rather than filling/salvaging scores: %j", raw => {
  expect(() => decodeMeaningScores(raw, ["source-a", "source-b"])).toThrow();
});
it("never reconstructs the recorded missing-candidate scores or promotes a context reference", () => {
  expect(() => decodeMeaningScores({ scores: missing.rankings.map(r => r.score) }, missing.candidateIds)).toThrow("invalid_reranker_result");
  expect(() => decodeMeaningScores({ scores: [90, 100] }, ["source-a"])).toThrow();
  expect(() => decodeMeaningScores({ scores: [90] }, ["source-a", "source-a"])).toThrow("invalid_reranker_result");
});
it("preserves complete recorded scores exactly while making their visible response substantially smaller", () => {
  const checked = checkedRerankerScores(recorded.rankings, recorded.candidateIds).scores;
  const ordered = recorded.candidateIds.map(id => checked.find(s => s.id === id)!);
  const compact = { scores: ordered.map(s => s.score) };
  expect(decodeMeaningScores(compact, recorded.candidateIds)).toEqual(ordered);
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(Buffer.byteLength(JSON.stringify({ rankings: ordered })) * .4);
});
it("retains every original/context/concern and the unchanged normal output allowance", () => {
  const request = meaningRerankingRequest(concern, passages), input = JSON.parse(request.prompt);
  expect(input.concern).toEqual(concern);
  expect(input.passages.map(({ score_index, ...p }: any) => p)).toEqual(passages);
  expect(input.passages.map((p: any) => p.score_index)).toEqual([0, 1]);
  expect(request.maxOutputTokens).toBe(128 + passages.length * 65); expect(request.thinking).toBe("minimal");
  expect(request.structuredOutput).toBe(true); expect(request.system).toContain("Scores do not approve evidence");
});
it.each(["id", "original", "before", "order", "concern"])("refuses scores after the pending request's %s changes", async change => {
  const current = structuredClone(passages), topic = { ...concern };
  const generateJson = vi.fn(async () => {
    if (change === "concern") topic.text += " changed";
    else if (change === "order") current.reverse();
    else current[0][change as "id" | "original" | "before"] += " changed";
    return { scores: [80, 10] };
  });
  await expect(modelMeaningReranker({ id: "fixture", generateJson })(topic, current, new AbortController().signal)).rejects.toThrow("invalid_reranker_result");
  expect(generateJson).toHaveBeenCalledOnce();
});
it("does not dispatch when cancelled, accept a late response or retry malformed output", async () => {
  const aborted = new AbortController(); aborted.abort(); const generateJson = vi.fn(async () => ({ scores: [80, 10] }));
  await expect(modelMeaningReranker({ id: "fixture", generateJson })(concern, passages, aborted.signal)).rejects.toThrow(); expect(generateJson).not.toHaveBeenCalled();
  const late = new AbortController(), lateProvider = vi.fn(async () => { late.abort(); return { scores: [80, 10] }; });
  await expect(modelMeaningReranker({ id: "fixture", generateJson: lateProvider })(concern, passages, late.signal)).rejects.toThrow();
  const invalid = vi.fn(async () => ({ scores: [80] }));
  await expect(modelMeaningReranker({ id: "fixture", generateJson: invalid })(concern, passages, new AbortController().signal)).rejects.toThrow(); expect(invalid).toHaveBeenCalledOnce();
});
it("keeps actual bounded candidate ordering unchanged for the same scores, without approving evidence", async () => {
  const candidates = pack.passages.map(p => ({ id: p.id, source: p.source, context: p.context }));
  const scores = [30, 90, 0], rows = candidates.map((p, i) => ({ id: p.id, score: scores[i] }));
  const frame = { ...pack.question, kind: "question" as const, searchQueries: {} }, signal = new AbortController().signal;
  const before = await pipelineMeaningRanker(async () => rows)(frame, candidates, signal);
  const provider = { id: "fixture", generateJson: vi.fn(async () => ({ scores })) };
  const after = await pipelineMeaningRanker(modelMeaningReranker(provider))(frame, candidates, signal);
  expect(after).toEqual(before); expect(after.every(p => candidates.includes(p))).toBe(true); expect(provider.generateJson).toHaveBeenCalledOnce();
});
