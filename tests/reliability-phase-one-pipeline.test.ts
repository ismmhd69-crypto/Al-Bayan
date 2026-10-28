import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { runSimplePipeline, simpleCandidatePool, simpleRecoveryQueries, sameResearchCandidates } from "@/lib/ask/simple-pipeline";
import { runPipeline } from "@/lib/ask/core";
import { dependencies, pack, audit } from "./fixtures/rich";
import { selectionReply } from "./fixtures/selection";
import type { ProgressiveCheckpoint } from "@/lib/ask/progressive-checkpoint";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import type { JsonRequest } from "@/lib/ai/types";
const frame:QuestionFrame={...pack.question,kind:"question",checklistStatus:"complete",searchQueries:{en:["care responsibility"],ar:["عناية يومية"]},backupQueries:[]};
const signal=()=>new AbortController().signal, hints={quran:[],hadith:[],scholars:[]};
function setup(available=["quran","hadith","scholar"]) {
  const deps=dependencies(), shown:string[]=[], requests:JsonRequest[]=[];
  const checkpoint:ProgressiveCheckpoint={lanes:{},retry:0,meaningApprovals:new Set()};
  deps.simpleResearch=true;deps.progressiveCheckpoint=checkpoint;deps.rich={progressive:true,stable:true,onSection:s=>{shown.push(s.group);}};
  deps.sourceAvailability={hadith:available.includes("hadith"),scholar:available.includes("scholar")};
  deps.search=async()=>available.includes("quran")?["2:183"]:[];
  deps.getVerse=async()=>pack.passages[0].source.kind==="quran"?pack.passages[0].source.verse:undefined;
  deps.searchHadith=async()=>pack.passages[1].source.kind==="hadith"?[pack.passages[1].source.hadith]:[];
  deps.searchScholars=async()=>pack.passages[2].source.kind==="scholar"?[pack.passages[2].source.quote]:[];
  deps.revalidateStable=vi.fn(async()=>({unavailable:false,rejectedIds:[] as string[]}));
  deps.meaningRankCandidates=vi.fn(async()=>{throw Error("no separate ranking");});
  deps.planEvidenceRecovery=vi.fn(async()=>{throw Error("no extra planner");});
  deps.writer.generateJson=async request=>{
    requests.push(request);const input=JSON.parse(request.prompt);
    if(!input.sections_to_write) return {language:"en",kind:"question",question_type:"general",subjects:["care"],requested_points:[{text:"Explain care",facet:"general",scope:"general",
      essential_conditions:[],interpretation_id:"",search_queries:{en:["care responsibility"],ar:["عناية يومية"],de:[]},quran_ar:["عناية يومية"],hadith_ar:["عناية يومية"],hadith_search_queries:{en:["care responsibility"],ar:["عناية يومية"]}}],
      qualifiers:[],search_queries_en:["care responsibility"],search_queries_ar:["عناية يومية"],search_queries_de:[],interpretations:[],clarification_needed:false,checklist_status:"complete",backup_queries:[]};
    return {status:"answer",summary:[{text:available.includes("scholar")?"Ibn Baz explains care as a thoughtful responsibility.":"These sources describe care as a thoughtful responsibility.",
      source_ids:input.citable_source_ids_by_section.summary,requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};
  };
  deps.verifier.generateJson=async request=>{
    requests.push(request);const input=JSON.parse(request.prompt);
    if(input.candidates) return selectionReply(input,{status:"ready",coverage:"complete",conflict_type:"none",missing_requirement_ids:[],assessments:input.candidates.map((p:any)=>({
      source_id:p.source.id,relevance:"direct",supported_requirement_ids:["R1"],context_safe:"yes",position:"",contribution:{role:"direct",scope:"general",conditions:[]},
      scope_matches_question:"yes",related_requirement_ids:[],distinct_contribution:"yes"}))});
    const result:any=audit(request.prompt);
    return result;
  };
  return {deps,shown,requests,checkpoint};
}

// Reliability plan Phase 1: preserve work across Stop, interruption and Continue.
it("Stop during the Quran context lookup saves no candidates, and Continue searches the Quran again", async () => {
  const t = setup(), stop = new AbortController();
  t.deps.neighbours = () => new Promise((_, reject) => stop.signal.addEventListener("abort", () => reject(stop.signal.reason)));
  setTimeout(() => stop.abort(new Error("answer_stopped")), 20);
  await expect(runSimplePipeline("Explain care", frame, t.deps, stop.signal, hints)).rejects.toThrow("answer_stopped");
  expect(t.checkpoint.simple?.candidates).toBeUndefined();
  t.deps.neighbours = async () => [];
  const before = t.requests.length, result = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  const selection = t.requests.slice(before).map(r => JSON.parse(r.prompt)).find(p => p.candidates);
  expect(JSON.stringify(selection.candidates)).toContain("2:183");
  expect(result.status).toBe("rich_answer");
});
it("an interrupted automatic reassessment resumes with the same reason on Continue, without repeating the first selection", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson, interrupt = new AbortController();
  const calls: (string | undefined)[] = [];
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt);
    if (!input.candidates) return verify(r);
    calls.push(input.assessment_repair?.reason);
    const raw: any = await verify(r);
    if (calls.length === 1) { raw.assessments[0].relevance = "direct"; raw.assessments[0].contribution.role = "background"; return raw; }
    if (calls.length === 2) { interrupt.abort(new Error("connection_interrupted")); throw interrupt.signal.reason; }
    return raw;
  };
  await expect(runSimplePipeline("Explain care", frame, t.deps, interrupt.signal, hints)).rejects.toThrow();
  expect(t.checkpoint.simple?.reassessmentUsed).toBeFalsy();
  expect(t.checkpoint.simple?.pendingReassessment?.reason).toBe("source_scope_mismatch");
  const result = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(calls).toEqual([undefined, "source_scope_mismatch", "source_scope_mismatch"]);
  expect(result.status).toBe("rich_answer");
  expect(t.checkpoint.simple?.reassessmentUsed).toBe(true);
  expect(t.checkpoint.simple?.pendingReassessment).toBeUndefined();
});
it("a completed reassessment stays spent and Continue cannot grant another", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson; let selections = 0;
  t.deps.verifier.generateJson = async r => { const raw: any = await verify(r), input = JSON.parse(r.prompt);
    if (input.candidates) { selections++; raw.assessments[0].relevance = "direct"; raw.assessments[0].contribution.role = "background"; } return raw; };
  expect((await runSimplePipeline("Explain care", frame, t.deps, signal(), hints)).status).toBe("incomplete");
  expect(selections).toBe(2); expect(t.checkpoint.simple?.pendingReassessment).toBeUndefined();
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints); expect(selections).toBe(2);
});
it("keeps a family's search failure visible after Continue", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson, interrupt = new AbortController();
  t.deps.searchHadith = async () => { throw Error("hadith service unavailable"); };
  let first = true;
  t.deps.verifier.generateJson = async r => {
    if (JSON.parse(r.prompt).candidates && first) { first = false; interrupt.abort(new Error("connection_interrupted")); throw interrupt.signal.reason; }
    return verify(r);
  };
  await expect(runSimplePipeline("Explain care", frame, t.deps, interrupt.signal, hints)).rejects.toThrow();
  expect(t.checkpoint.simple?.searchProblems).toEqual(["hadith"]);
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  const hadith = t.checkpoint.simple?.frozen?.find(s => s.group === "hadith");
  expect(hadith?.outcome === "search_failed" || hadith?.searchOutcome === "search_failed").toBe(true);
});
it("records Quran verses dropped because their context could not be fetched", async () => {
  const t = setup(), codes: string[] = [];
  t.deps.onDiagnostic = (_stage, code) => { codes.push(code); };
  t.deps.neighbours = async () => { throw Error("context unavailable"); };
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes).toContain("quran_context_unavailable");
});
