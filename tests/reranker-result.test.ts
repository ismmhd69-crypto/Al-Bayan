import { describe, expect, it, vi } from "vitest";
import { checkedRerankerScores } from "@/lib/ask/search-engine/reranker-result";
import { pipelineMeaningRanker } from "@/lib/ask/search-engine/pipeline-ranking";
import { modelMeaningReranker } from "@/lib/ask/search-engine/reranker";
import type { PassageForSelection } from "@/lib/ask/retrieval";
import { pack } from "./fixtures/rich";
import type { AIProvider } from "@/lib/ai/types";
import recorded from "./fixtures/reranker-context-extra.json";
import missing from "./fixtures/reranker-missing-candidates.json";

describe("ranking context IDs cannot become evidence",()=>{
  it("reproduces the recorded 29-input/26-score failure without inventing the missing scores", () => {
    expect(missing.candidateIds).toHaveLength(29); expect(missing.rankings).toHaveLength(26);
    expect(missing.candidateIds.filter(id => !missing.rankings.some(r => r.id === id))).toEqual(["Q4:106", "Q4:54", "HE6035"]);
    expect(() => checkedRerankerScores(missing.rankings, missing.candidateIds)).toThrow("invalid_reranker_result");
  });
  it("can discard a malformed discovery ranking and retain bounded originals for independent selection without a retry", async () => {
    const candidates: PassageForSelection[] = pack.passages.map(p => ({ id: p.id, source: p.source, context: [], retrievedFor: ["R1"] }));
    const rank = vi.fn(async () => candidates.slice(0, 2).map(p => ({ id: p.id, score: 90 })));
    const audit = vi.fn();
    const result = await pipelineMeaningRanker(rank, audit, 30, { retainCandidatesOnInvalidResult: true })({ ...pack.question, kind: "question", searchQueries: {} }, candidates, new AbortController().signal);
    expect(result).toEqual(candidates); expect(rank).toHaveBeenCalledOnce();
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ fallbackReason: "invalid_reranker_result", modelCalls: 1, before: 3, after: 3 }));
    // The measurement adapter stays strict: a broken ranker cannot earn ranking-quality credit.
    await expect(pipelineMeaningRanker(rank)({ ...pack.question, kind: "question", searchQueries: {} }, candidates, new AbortController().signal)).rejects.toThrow("invalid_reranker_result");
  });
  it.each(["ModelReconciliationRequired", "ResearchStorageError", "network unavailable"])("does not hide %s behind discovery fallback", async reason => {
    const error = Object.assign(Error(reason), { name: reason });
    const rank = vi.fn(async () => { throw error; });
    await expect(pipelineMeaningRanker(rank, undefined, 30, { retainCandidatesOnInvalidResult: true })({ ...pack.question, kind: "question", searchQueries: {} }, pack.passages, new AbortController().signal)).rejects.toBe(error);
    expect(rank).toHaveBeenCalledOnce();
  });
  it("replays the actual failed 25-candidate result without promoting its extra context verse",()=>{
    const result=checkedRerankerScores(recorded.rankings,recorded.candidateIds);
    expect(result.scores).toHaveLength(25);
    expect(result.ignoredUnknownCount).toBe(1);
    expect(result.scores.some(s=>s.id==="Q3:97")).toBe(false);
    expect(new Set(result.scores.map(s=>s.id))).toEqual(new Set(recorded.candidateIds));
  });
  it("discards an extra context reference only when all real candidates have valid scores",()=>{
    const result=checkedRerankerScores([{id:"Q3:98",score:20},{id:"Q3:97",score:99},{id:"HE1",score:80}],["Q3:98","HE1"]);
    expect(result).toEqual({scores:[{id:"Q3:98",score:20},{id:"HE1",score:80}],ignoredUnknownCount:1});
  });
  it.each([
    [{id:"Q3:97",score:99}],
    [{id:"Q3:98",score:20},{id:"Q3:98",score:30}],
    [{id:"Q3:98",score:NaN}],
    [{id:"Q3:98",score:101}],
    [{id:"Q3:98",score:20},{id:"unknown",score:Infinity}],
    [{id:"Q3:98",score:20},{id:"unknown",score:30},{id:"unknown",score:40}],
  ].map(raw=>({raw})))("still rejects incomplete, duplicate or malformed ranking: %j",({raw})=>{
    expect(()=>checkedRerankerScores(raw,["Q3:98"])).toThrow("invalid_reranker_result");
  });
  it("keeps all original safety gates and does not retry the model",async()=>{
    const candidates:PassageForSelection[]=pack.passages.map(p=>({id:p.id,source:p.source,context:[]}));
    const rank=vi.fn(async()=>[...candidates.map((c,i)=>({id:c.id,score:90-i})),{id:"Q3:97",score:100}]);
    const audit=vi.fn();
    const result=await pipelineMeaningRanker(rank,audit)({...pack.question,kind:"question",searchQueries:{}},candidates,new AbortController().signal);
    expect(rank).toHaveBeenCalledTimes(1);
    expect(result.every(c=>candidates.includes(c))).toBe(true);
    expect(result.map(c=>c.id)).not.toContain("Q3:97");
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ignoredUnknownCount:1}));
  });
  it("constrains the provider schema to the candidate IDs, excluding context references",async()=>{
    const generateJson=vi.fn<AIProvider["generateJson"]>(async()=>({scores:[50]}));
    await modelMeaningReranker({id:"fixture",generateJson})({id:"R1",text:"Invented concern"},[{id:"Q3:98",original:"invented original",before:"Q3:97: context only",after:"",title:"fixture"}],new AbortController().signal);
    expect(generateJson.mock.calls[0][0].schema).toMatchObject({properties:{scores:{type:"array",maxItems:1,items:{type:"number"}}}});
    expect(JSON.parse(generateJson.mock.calls[0][0].prompt).passages[0]).toMatchObject({id:"Q3:98",score_index:0});
  });
});
