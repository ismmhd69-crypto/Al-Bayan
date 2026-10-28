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
it("retains available verses when another verse lookup fails",async()=>{
  const t=setup(["quran"]), getVerse=t.deps.getVerse;
  t.deps.search=async()=>["2:183","2:184"];
  t.deps.getVerse=async key=>{if(key==="2:184") throw Error("source unavailable"); return getVerse(key);};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");
  if(result.status==="rich_answer") expect(result.answer.sections.find(s=>s.group==="quran")?.sources.length).toBeGreaterThan(0);
});
it.each([["quran"],["hadith"],["scholar"],["quran","hadith"],["quran","scholar"],["hadith","scholar"],["quran","hadith","scholar"]])("uses one selection, writer and combined review for families %j",async(...available)=>{
  const t=setup(available);
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");expect(t.requests).toHaveLength(3);
  expect(t.shown).toEqual(["quran","hadith","scholar","summary"]);
  expect(t.deps.meaningRankCandidates).not.toHaveBeenCalled();expect(t.deps.planEvidenceRecovery).not.toHaveBeenCalled();
  if(result.status==="rich_answer") expect(result.answer.sections.slice(0,3).every(s=>s.claims.length===0)).toBe(true);
});
it("reuses a completed answer with no AI calls after checking its originals",async()=>{
  const t=setup();expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("rich_answer");
  const count=t.requests.length;
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("rich_answer");
  expect(t.requests).toHaveLength(count);expect(t.deps.revalidateStable).toHaveBeenCalledOnce();
});
it("keeps Quran and all frozen sources when later evidence changes",async()=>{
  const t=setup(), integrity=vi.fn();t.deps.rich!.onIntegrity=integrity;
  await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  t.deps.revalidateStable=async()=>({unavailable:false,rejectedIds:["Q2:183"]});
  const count=t.requests.length,result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("incomplete");expect(t.requests).toHaveLength(count);expect(t.checkpoint.simple?.approved).toBeUndefined();
  expect(integrity).toHaveBeenCalledWith(expect.objectContaining({group:"quran",sourceIds:["Q2:183"]}));
  if(result.status==="incomplete") expect(result.sections?.[0].sources[0].id).toBe("Q2:183");
});
it("does not accept a review without the anchored audit contract",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson;
  t.deps.verifier.generateJson=async r=>{const value:any=await verify(r);if(!JSON.parse(r.prompt).candidates) delete value.audit_contract;return value;};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("incomplete");expect(t.requests).toHaveLength(3);expect(t.checkpoint.simple?.terminalNegative).toBe(true);
  const before=t.requests.length;const repeated=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);expect(t.requests).toHaveLength(before);
  expect(repeated).toMatchObject({status:"incomplete",failureKind:result.status==="incomplete"?result.failureKind:undefined});
});
it("blocks a grounded missing condition in the main review",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson;
  t.deps.verifier.generateJson=async r=>{const value:any=await verify(r),input=JSON.parse(r.prompt);if(!input.candidates){const row=value.claim_assessments[0],claim=input.claims[0];row.conditions_preserved="no";row.explanation="A necessary condition is missing.";row.finding={category:"missing_qualification",claim_quote:claim.claim,source_id:claim.source_ids[0],source_anchor_id:input.claim_evidence[0].negative_excerpt_choices[0].anchor_id};}return value;};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("incomplete");expect(t.checkpoint.simple?.correctionUsed).toBe(true);
  expect(t.requests.length).toBeLessThanOrEqual(5);expect(t.checkpoint.simple?.approved).toBeUndefined();
  const count=t.requests.length, repeated=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(repeated).toMatchObject({status:"incomplete",failureKind:result.status==="incomplete"?result.failureKind:undefined});
  expect(t.requests).toHaveLength(count);
});
it("routes a grounded uncertain claim to the single correction instead of checker failure",async()=>{
  const t=setup(["quran"]),verify=t.deps.verifier.generateJson,write=t.deps.writer.generateJson;
  let reviews=0,corrected=false;
  t.deps.verifier.generateJson=async r=>{
    const result:any=await verify(r),input=JSON.parse(r.prompt);if(input.candidates)return result;
    if(++reviews===1){const row=result.claim_assessments[0],claim=input.claims[0];
      row.direct_support="unsure";row.conditions_preserved="unsure";row.explanation="The condition is uncertain.";
      row.finding={category:"context_needed",claim_quote:claim.claim,source_id:claim.source_ids[0],source_anchor_id:input.claim_evidence[0].negative_excerpt_choices[0].anchor_id};
    }return result;
  };
  t.deps.writer.generateJson=async r=>{const input=JSON.parse(r.prompt);if(!input.correction)return write(r);
    corrected=true;return {status:"answer",summary:{P0:{text:"This source describes a thoughtful responsibility.",source_refs:[input.correction.summary_citation_choices[0].reference]}},next_step:[],no_answer_feedback:[]};};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(corrected).toBe(true);expect(reviews).toBe(2);expect(result.status).toBe("rich_answer");
  expect(t.checkpoint.simple?.correctionUsed).toBe(true);
});
it("reviews a copied provisional draft privately and repairs editorial and meaning findings together",async()=>{
  const t=setup(["quran"]),verify=t.deps.verifier.generateJson;let reviews=0,repairs=0;
  t.deps.writer.generateJson=async r=>{
    t.requests.push(r);const input=JSON.parse(r.prompt);
    if(!input.correction)return {status:"answer",summary:[
      {text:"Invented source wording solely for tests.",source_ids:["Q2:183"],requirement_id:"R1"},
      {text:"This passage promises an unlimited result.",source_ids:["Q2:183"],requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};
    repairs++;expect(input.correction.checker_findings.sentence_patches[0].replace_indices).toEqual([0,1]);
    const refs=[input.correction.summary_citation_choices[0].reference];
    return {status:"answer",summary:{P0:{text:"This text describes a measured duty.",source_refs:refs},P1:{text:"The passage presents another careful principle.",source_refs:refs}},next_step:[],no_answer_feedback:[]};
  };
  t.deps.verifier.generateJson=async r=>{const raw:any=await verify(r),input=JSON.parse(r.prompt);if(input.candidates)return raw;
    if(++reviews===1){const row=raw.claim_assessments[1],claim=input.claims[1];row.direct_support="no";row.explanation="The original does not promise this outcome.";
      row.finding={category:"source_support",claim_quote:claim.claim,source_id:claim.source_ids[0],source_anchor_id:input.claim_evidence[1].negative_excerpt_choices[0].anchor_id};}
    return raw;};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");expect(repairs).toBe(1);expect(reviews).toBe(2);
  if(result.status==="rich_answer")expect(result.answer.sections.find(s=>s.group==="summary")?.claims.map(c=>c.text)).not.toContain("Invented source wording solely for tests.");
});
it.each(["checker_failure","copied_repair"])("never publishes copied provisional wording on %s",async mode=>{
  const t=setup(["quran"]),verify=t.deps.verifier.generateJson;let reviews=0;
  t.deps.writer.generateJson=async r=>{const input=JSON.parse(r.prompt);if(!input.correction)return {status:"answer",summary:[{text:"Invented source wording solely for tests.",source_ids:["Q2:183"],requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};
    return {status:"answer",summary:{P0:{text:"Invented source wording solely for tests.",source_refs:[input.correction.summary_citation_choices[0].reference]}},next_step:[],no_answer_feedback:[]};};
  t.deps.verifier.generateJson=async r=>{const raw:any=await verify(r);if(!JSON.parse(r.prompt).candidates){reviews++;if(mode==="checker_failure")delete raw.audit_contract;}return raw;};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("incomplete");expect(t.shown).not.toContain("summary");expect(reviews).toBe(1);
});
it("uses one source-grounded review without the separate condition comparison form",async()=>{
  const t=setup(["quran"]);const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");
  const review=t.requests.find(r=>JSON.parse(r.prompt).full_answer===true)!;
  expect(review.schema.type).toBe("object");
  expect(review.system).toContain("Read each entire cited original");
  expect(review.system).toContain("important condition is missing");
  expect(review.system).not.toContain("condition_comparisons");
  const input=JSON.parse(review.prompt);
  expect(input.claim_evidence[0].condition_excerpt_choices).toBeUndefined();
});
it("rejects unknown candidate references without an automatic reassessment",async()=>{
  const t=setup();t.deps.verifier.generateJson=async r=>{t.requests.push(r);return {selection_contract:"candidate_refs_v1",assessments:[{source_ref:"P999"}]};};
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("incomplete");expect(t.requests).toHaveLength(1);
});
it.each([false,true])("automatically reassesses a source-scope mismatch once (after evidence recovery=%s)",async afterRecovery=>{
  const t=setup(), verify=t.deps.verifier.generateJson;let selections=0;const progress:string[]=[];
  t.deps.rich!.onProgress=stage=>progress.push(stage);
  if(afterRecovery) t.deps.searchHadith=async q=>q.en?.includes("backup new phrase")
    ? [{...(pack.passages[1].source as any).hadith,id:"HE9002",url:"https://hadeethenc.com/en/browse/hadith/9002"}]
    : [(pack.passages[1].source as any).hadith];
  t.deps.verifier.generateJson=async r=>{const input=JSON.parse(r.prompt),raw:any=await verify(r);if(!input.candidates)return raw;
    selections++;
    if(afterRecovery && selections===1){raw.status="insufficient";raw.coverage="incomplete";raw.missing_requirement_ids=["R1"];return raw;}
    if(selections===(afterRecovery?2:1)){raw.assessments[0].relevance="direct";raw.assessments[0].contribution.role="background";return raw;}
    expect(input.assessment_repair?.reason).toBe("source_scope_mismatch");return raw;
  };
  const planned=afterRecovery?{...frame,backupQueries:[{requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"backup new phrase"}]}:frame;
  const outcome=await runSimplePipeline("Explain care",planned,t.deps,signal(),hints);
  if (!afterRecovery) expect(outcome.status).toBe("rich_answer");
  else expect(t.checkpoint.simple?.frozen?.some(s=>s.outcome==="ready")).toBe(true);
  expect(selections).toBe(afterRecovery?3:2);expect(t.checkpoint.simple?.reassessmentUsed).toBe(true);
  expect(progress).toContain("retrying_selection");expect(progress.at(-1)).not.toBe("retrying_selection");
});
it("does not obtain another reassessment after repeated invalid selection or Continue",async()=>{
  const t=setup(),verify=t.deps.verifier.generateJson;let selections=0;
  t.deps.verifier.generateJson=async r=>{const raw:any=await verify(r),input=JSON.parse(r.prompt);if(input.candidates){selections++;raw.assessments[0].relevance="direct";raw.assessments[0].contribution.role="background";}return raw;};
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("incomplete");
  expect(selections).toBe(2);expect(t.checkpoint.simple?.reassessmentUsed).toBe(true);
  await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);expect(selections).toBe(2);
});
it("reassesses a non-direct source incorrectly assigned as direct support",async()=>{
  const t=setup(),verify=t.deps.verifier.generateJson;let selections=0;
  t.deps.verifier.generateJson=async r=>{const input=JSON.parse(r.prompt),raw:any=await verify(r);if(!input.candidates)return raw;
    if(++selections===1){raw.assessments[0].relevance="partial";raw.assessments[0].contribution.role="background";raw.assessments[0].supported_requirement_ids=["R1"];}
    else expect(input.assessment_repair?.reason).toBe("non_direct_requirement_assignment");return raw;};
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("rich_answer");expect(selections).toBe(2);
});
it("balances the thirty candidate places across families and retains named units",()=>{
  const pool=Array.from({length:90},(_,i)=>{
    const p=structuredClone(pack.passages[i%3]);p.id=`candidate-${i}`;
    delete (p as {requirementIds?:unknown}).requirementIds;
    delete (p as {contribution?:unknown}).contribution;
    if(p.source.kind==="scholar") p.source.quote.url=`https://binbaz.org.sa/fatwas/${i+10}/test`;
    return {...p,retrievedFor:["R1"]};
  });
  const selected=simpleCandidatePool(frame,pool,[["candidate-89"]]);
  expect(selected).toHaveLength(30);expect(selected.some(p=>p.id==="candidate-89")).toBe(true);
  for(const kind of ["quran","hadith","scholar"]) expect(selected.filter(p=>p.source.kind===kind)).toHaveLength(10);
});

it("keeps useful candidates during recovery without treating them as newly approved",()=>{
  const pool=Array.from({length:90},(_,i)=>{
    const p=structuredClone(pack.passages[i%3]);p.id=`candidate-${i}`;
    delete (p as {requirementIds?:unknown}).requirementIds;
    delete (p as {contribution?:unknown}).contribution;
    if(p.source.kind==="scholar") p.source.quote.url=`https://binbaz.org.sa/fatwas/${i+10}/test`;
    return {...p,retrievedFor:["R1"]};
  });
  const retained=["candidate-87","candidate-88","candidate-89"];
  const selected=simpleCandidatePool(frame,pool,[],retained);
  expect(selected).toHaveLength(30);
  expect(retained.every(id=>selected.some(p=>p.id===id))).toBe(true);
  for(const kind of ["quran","hadith","scholar"]) expect(selected.filter(p=>p.source.kind===kind)).toHaveLength(10);
  expect(selected.every(p=>!("requirementIds" in p))).toBe(true);
});

it("does not repeat selection for reordered candidates but notices changed evidence",()=>{
  const candidates=structuredClone(pack.passages);
  expect(sameResearchCandidates(candidates,[...candidates].reverse())).toBe(true);
  const changed=structuredClone(candidates);changed[0].context=[];
  changed[0].retrievedFor=["R2"];
  expect(sameResearchCandidates(candidates,changed)).toBe(false);
});

it("takes exactly four AI tasks through the real question-planning entry point",async()=>{
  const t=setup();const result=await runPipeline("Explain care","en",t.deps);
  expect(result.status).toBe("rich_answer");expect(t.requests).toHaveLength(4);
  expect(t.requests.map(r=>JSON.parse(r.prompt).sections_to_write ?? (JSON.parse(r.prompt).candidates?"selection":JSON.parse(r.prompt).full_answer?"review":"plan"))).toEqual(["plan","selection",["summary"],"review"]);
});
it("runs only one targeted recovery for the earliest uncovered concern and publishes afterwards",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson;let selections=0, recovered=false;
  const second={...frame.requirements[0],id:"R2",text:"Explain responsibility"};
  const planned={...frame,requirements:[...frame.requirements,second],backupQueries:[
    {requirementId:"R2",family:"hadith" as const,language:"en" as const,text:"later backup"},
    {requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"earlier backup"}]};
  t.deps.searchHadith=async q=>{
    if(q.en?.includes("later backup")) throw Error("wrong concern recovered first");
    if(q.en?.includes("earlier backup")) {recovered=true;expect(t.shown).toEqual([]);return [{...(pack.passages[1].source as any).hadith,id:"HE9002",url:"https://hadeethenc.com/en/browse/hadith/9002"}];}
    return [(pack.passages[1].source as any).hadith];
  };
  t.deps.verifier.generateJson=async r=>{
    const raw:any=await verify(r);if(JSON.parse(r.prompt).candidates) {selections++;raw.status="insufficient";raw.coverage="incomplete";raw.missing_requirement_ids=["R1","R2"];}return raw;
  };
  const first=await runSimplePipeline("Explain care and responsibility",planned,t.deps,signal(),hints);
  expect(first.status).toBe("incomplete");
  expect(recovered).toBe(true);expect(selections).toBe(2);expect(t.checkpoint.simple?.recoveryUsed).toBe(true);
  const before=selections;await runSimplePipeline("Explain care and responsibility",planned,t.deps,signal(),hints);expect(selections).toBe(before);
});
it("reassesses retained evidence when new source families fill the recovery pool",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson;
  const originalVerse=(pack.passages[0].source as any).verse;
  const originalHadith=(pack.passages[1].source as any).hadith;
  const originalScholar=(pack.passages[2].source as any).quote;
  const planned={...frame,backupQueries:[{requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"new recovery phrase"}]};
  t.deps.search=async()=>Array.from({length:16},(_,i)=>`2:${i+1}`);
  t.deps.getVerse=async key=>({...originalVerse,key,url:`https://quran.com/${key.replace(":","/")}`});
  t.deps.neighbours=async()=>[];
  t.deps.searchScholars=async()=>Array.from({length:14},(_,i)=>({...originalScholar,
    id:`S${String(i+1).padStart(8,"0")}-0000-4000-a000-000000000000`,url:`https://binbaz.org.sa/fatwas/${i+100}/test`}));
  t.deps.searchHadith=async q=>q.en?.includes("new recovery phrase")
    ? Array.from({length:12},(_,i)=>({...originalHadith,id:`HE${9001+i}`,url:`https://hadeethenc.com/en/browse/hadith/${9001+i}`})) : [];
  let selectionCount=0;
  t.deps.verifier.generateJson=async r=>{
    const input=JSON.parse(r.prompt);if(!input.candidates)return verify(r);
    selectionCount++;
    if(selectionCount===2) {
      expect(input.candidates.some((p:any)=>p.source.id==="Q2:16")).toBe(true);
      expect(input.candidates.some((p:any)=>p.source.id.startsWith("HE"))).toBe(true);
      expect(t.shown).toEqual([]);
    }
    return selectionReply(input,{status:selectionCount===1?"insufficient":"ready",coverage:selectionCount===1?"incomplete":"complete",conflict_type:"none",
      missing_requirement_ids:selectionCount===1?["R1"]:[],assessments:input.candidates.map((p:any)=>({
        source_id:p.source.id,relevance:(selectionCount===1?p.source.id==="Q2:16":p.source.id==="Q2:1")?"direct":"unrelated",
        supported_requirement_ids:(selectionCount===1?p.source.id==="Q2:16":p.source.id==="Q2:1")?["R1"]:[],context_safe:"yes",position:"",
        contribution:{role:"direct",scope:"general",conditions:[]},scope_matches_question:"yes",related_requirement_ids:[],distinct_contribution:"yes"}))});
  };
  const result=await runSimplePipeline("Explain care",planned,t.deps,signal(),hints);
  expect(selectionCount).toBe(2);
  const sections=result.status==="rich_answer"?result.answer.sections:result.status==="incomplete"?result.sections??[]:[];
  expect(sections.flatMap(s=>s.sources).some(s=>s.id==="Q2:16")).toBe(false);
});
it("resumes an interrupted recovery search without repeating the first selection",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson, controller=new AbortController();let selections=0, interrupted=false, recoverySearches=0;
  const planned={...frame,backupQueries:[{requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"new recovery phrase"}]};
  const originalHadith=(pack.passages[1].source as any).hadith;
  t.deps.searchHadith=async q=>{
    if(q.en?.includes("new recovery phrase")) {
      recoverySearches++;
      if(!interrupted){interrupted=true;return await new Promise<any[]>(resolve=>setTimeout(()=>{controller.abort(new Error("connection interrupted"));resolve([]);},0));}
      return [{...originalHadith,id:"HE9002",url:"https://hadeethenc.com/en/browse/hadith/9002"}];
    }
    return [originalHadith];
  };
  t.deps.writer.generateJson=async r=>{t.requests.push(r);const input=JSON.parse(r.prompt);return {status:"answer",summary:[{text:"These sources describe a thoughtful responsibility.",source_ids:[input.citable_source_ids_by_section.summary[0]],requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};};
  t.deps.verifier.generateJson=async r=>{
    const raw:any=await verify(r);
    if(JSON.parse(r.prompt).candidates){selections++;if(selections===1){raw.status="insufficient";raw.coverage="incomplete";raw.missing_requirement_ids=["R1"];}}
    return raw;
  };
  await expect(runSimplePipeline("Explain care",planned,t.deps,controller.signal,hints)).rejects.toThrow();
  expect(selections).toBe(1);expect(t.shown).toEqual([]);
  const result=await runSimplePipeline("Explain care",planned,t.deps,signal(),hints);
  expect(recoverySearches).toBe(2);expect(selections).toBe(2);expect(result.status).toBe("rich_answer");
  expect(t.checkpoint.simple?.recoveryUsed).toBe(true);
});
it("keeps the original recovery checkpoint if the second selection is interrupted",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson, controller=new AbortController();let selections=0;
  const planned={...frame,backupQueries:[{requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"new recovery phrase"}]};
  const h=(pack.passages[1].source as any).hadith;
  t.deps.searchHadith=async q=>q.en?.includes("new recovery phrase")?[{...h,id:"HE9002",url:"https://hadeethenc.com/en/browse/hadith/9002"}]:[h];
  t.deps.writer.generateJson=async r=>{t.requests.push(r);const input=JSON.parse(r.prompt);return {status:"answer",summary:[{text:"These sources describe a thoughtful responsibility.",source_ids:[input.citable_source_ids_by_section.summary[0]],requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};};
  t.deps.verifier.generateJson=async r=>{
    const input=JSON.parse(r.prompt);
    if(input.candidates){
      selections++;
      if(selections===2){expect(input.candidates.some((p:any)=>p.source.id==="HE9002")).toBe(true);return await new Promise(resolve=>setTimeout(()=>{controller.abort(new Error("connection interrupted"));resolve(null);},0));}
      if(selections===3) expect(input.candidates.some((p:any)=>p.source.id==="HE9002")).toBe(true);
    }
    const raw:any=await verify(r);if(input.candidates && selections===1){raw.status="insufficient";raw.coverage="incomplete";raw.missing_requirement_ids=["R1"];}
    return raw;
  };
  await expect(runSimplePipeline("Explain care",planned,t.deps,controller.signal,hints)).rejects.toThrow();
  expect(t.checkpoint.simple?.recoveryPending).toBeDefined();expect(t.shown).toEqual([]);
  expect((await runSimplePipeline("Explain care",planned,t.deps,signal(),hints)).status).toBe("rich_answer");
  expect(selections).toBe(3);expect(t.checkpoint.simple?.recoveryPending).toBeUndefined();
});
it("does not reuse an interrupted assessment when an original has changed",async()=>{
  const t=setup(), verify=t.deps.verifier.generateJson, controller=new AbortController();let selections=0;
  const planned={...frame,backupQueries:[{requirementId:"R1",family:"hadith" as const,language:"en" as const,text:"new recovery phrase"}]};
  const h=(pack.passages[1].source as any).hadith;
  t.deps.searchHadith=async q=>q.en?.includes("new recovery phrase")
    ? await new Promise<any[]>(resolve=>setTimeout(()=>{controller.abort(new Error("connection interrupted"));resolve([]);},0)) : [h];
  t.deps.verifier.generateJson=async r=>{const raw:any=await verify(r);if(JSON.parse(r.prompt).candidates){selections++;raw.status="insufficient";raw.coverage="incomplete";raw.missing_requirement_ids=["R1"];}return raw;};
  await expect(runSimplePipeline("Explain care",planned,t.deps,controller.signal,hints)).rejects.toThrow();
  t.deps.revalidateStable=async()=>({unavailable:false,rejectedIds:["Q2:183"]});
  const result=await runSimplePipeline("Explain care",planned,t.deps,signal(),hints);
  expect(result).toMatchObject({status:"incomplete",failureKind:"source_support"});
  expect(selections).toBe(1);expect(t.shown).toEqual([]);
});
it("blocks missing context and genuine conflicts before any cards appear",async()=>{
  const missing=setup(["quran"]);missing.deps.neighbours=async()=>{throw Error("context unavailable");};
  expect((await runSimplePipeline("Explain care",frame,missing.deps,signal(),hints)).status).toBe("incomplete");expect(missing.shown).toEqual([]);
  const conflict=setup(), verify=conflict.deps.verifier.generateJson;
  conflict.deps.verifier.generateJson=async r=>{const raw:any=await verify(r);raw.conflict_type="revelation_conflict";return raw;};
  expect((await runSimplePipeline("Explain care",frame,conflict.deps,signal(),hints)).status).toBe("incomplete");expect(conflict.shown).toEqual([]);
});
it("withholds cached approval when a source cannot be re-fetched",async()=>{
  const t=setup();await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);const count=t.requests.length;
  t.deps.revalidateStable=async()=>({unavailable:true,rejectedIds:[]});
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result).toMatchObject({status:"incomplete",failureKind:"source_revalidation_unavailable"});expect(t.requests).toHaveLength(count);
  expect(t.checkpoint.simple?.approved).toBeDefined();
  t.deps.revalidateStable=async()=>({unavailable:false,rejectedIds:[]});
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("rich_answer");expect(t.requests).toHaveLength(count);
});
it("keeps original Arabic text and writes an Arabic summary",async()=>{
  const t=setup(["quran"]),write=t.deps.writer.generateJson;
  t.deps.writer.generateJson=async r=>{const raw:any=await write(r);raw.summary[0].text="تربط هذه النصوص العناية بالمسؤولية المدروسة.";return raw;};
  const result=await runSimplePipeline("اشرح العناية",{...frame,language:"ar"},t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");expect(t.requests).toHaveLength(3);
  if(result.status==="rich_answer") {expect(result.answer.language).toBe("ar");expect(result.answer.sections[0].sources[0].evidence.arabic).toBe((pack.passages[0].source as any).verse.arabic);}
});

it("resumes the same interrupted summary request instead of spending its correction allowance",async()=>{
  const t=setup(),write=t.deps.writer.generateJson;let failed=false,prompt="";
  t.deps.writer.generateJson=async r=>{if(!failed){failed=true;prompt=r.prompt;throw Error("lost provider connection");}expect(r.prompt).toBe(prompt);return write(r);};
  expect(await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).toMatchObject({status:"incomplete",failureKind:"transport_failure"});
  expect(t.checkpoint.conclusion?.drafts).toBe(1);expect(t.checkpoint.conclusion?.pending).toBeDefined();expect(t.checkpoint.simple?.terminalNegative).not.toBe(true);
  expect((await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).status).toBe("rich_answer");
  expect(t.checkpoint.conclusion?.drafts).toBe(1);expect(t.checkpoint.simple?.correctionUsed).toBe(false);expect(t.checkpoint.conclusion?.pending).toBeUndefined();
});
it("preserves one pending correction through interruption without granting another correction",async()=>{
  const t=setup(),write=t.deps.writer.generateJson,verify=t.deps.verifier.generateJson;let rejected=false,interrupted=false,repairPrompt="";
  t.deps.verifier.generateJson=async r=>{const raw:any=await verify(r),input=JSON.parse(r.prompt);if(!input.candidates && !rejected){rejected=true;const row=raw.claim_assessments[0],claim=input.claims[0];row.conditions_preserved="no";row.explanation="A condition is missing.";row.finding={category:"missing_qualification",claim_quote:claim.claim,source_id:claim.source_ids[0],source_anchor_id:input.claim_evidence[0].negative_excerpt_choices[0].anchor_id};}return raw;};
  t.deps.writer.generateJson=async r=>{
    const input=JSON.parse(r.prompt);
    if(input.correction){
      if(!interrupted){interrupted=true;repairPrompt=r.prompt;throw Error("interrupted correction");}
      expect(r.prompt).toBe(repairPrompt);
      return {status:"answer",summary:{P0:{text:"Ibn Baz describes care as a considered responsibility.",source_refs:input.correction.summary_citation_choices.map((c:any)=>c.reference)}},next_step:[],no_answer_feedback:[]};
    }
    return write(r);
  };
  expect(await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).toMatchObject({status:"incomplete",failureKind:"transport_failure"});
  expect(t.checkpoint.simple?.correctionUsed).toBe(true);expect(t.checkpoint.conclusion?.drafts).toBe(2);expect(t.checkpoint.conclusion?.pending).toBeDefined();
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");expect(t.checkpoint.conclusion?.drafts).toBe(2);
});

it.each([false,true])("provides untouched summary context and retains new findings (new finding=%s)",async newFinding=>{
  const t=setup(["quran"]), verify=t.deps.verifier.generateJson;
  let reviews=0; const first="The source describes care as a thoughtful responsibility.";
  t.deps.writer.generateJson=async r=>{
    t.requests.push(r);const input=JSON.parse(r.prompt);
    if(input.correction){
      expect(input.correction.untouched_summary_sentences).toEqual([{index:0,text:first,source_ids:["Q2:183"],requirement_id:"R1"}]);
      expect(input.correction.instructions).toContain("do not repeat their points");
      return {status:"answer",summary:{P1:{text:"The passage also describes a specific daily practice.",source_refs:[input.correction.summary_citation_choices[0].reference]}},next_step:[],no_answer_feedback:[]};
    }
    return {status:"answer",summary:[{text:first,source_ids:["Q2:183"],requirement_id:"R1"},
      {text:"The passage promises an unlimited outcome.",source_ids:["Q2:183"],requirement_id:"R1"}],next_step:[],no_answer_feedback:[]};
  };
  t.deps.verifier.generateJson=async r=>{
    const raw:any=await verify(r),input=JSON.parse(r.prompt);if(input.candidates)return raw;
    reviews++;
    if(reviews===1 || newFinding){
      const i=reviews===1?1:0,row=raw.claim_assessments[i],claim=input.claims[i];
      row.direct_support="no";row.explanation="The original does not establish this claim.";
      row.finding={category:"source_support",claim_quote:claim.claim,source_id:claim.source_ids[0],source_anchor_id:input.claim_evidence[i].negative_excerpt_choices[0].anchor_id};
    }
    return raw;
  };
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(reviews).toBe(2);expect(result.status).toBe(newFinding?"incomplete":"rich_answer");
  expect(t.checkpoint.simple?.correctionUsed).toBe(true);
  if(result.status==="rich_answer")expect(result.answer.sections.find(s=>s.group==="summary")?.claims[0].text).toBe(first);
  else if(result.status==="incomplete") expect(result.sections?.[0].sources.length).toBeGreaterThan(0);
});

it.each([true,false])("checks available scholar translation in the selection call: aligned=%s",async aligned=>{
  const t=setup(),verify=t.deps.verifier.generateJson;
  const p=pack.passages[2];if(p.source.kind!=="scholar")throw Error("fixture");
  const original=p.source.quote.arabic,originalHash=createHash("sha256").update(original).digest("hex");
  const translation={status:"ready" as const,origin:"human" as const,language:"en" as const,original,originalHash,text:"Invented translated text for this fixture only."};
  t.deps.displayTranslationLookup=async()=>new Map([[p.id,translation]]);
  t.deps.verifier.generateJson=async r=>{
    const raw:any=await verify(r),input=JSON.parse(r.prompt);
    if(input.candidates) raw.translations=(input.display_translation_candidates ?? []).map((v:any)=>({source_id:v.source_id,original_hash:v.original_hash,faithful:aligned?"yes":"no",complete:"yes",conditions_preserved:"yes"}));
    return raw;
  };
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result.status).toBe("rich_answer");expect(t.requests).toHaveLength(3);
  if(result.status==="rich_answer") expect(result.answer.sections[2].sources[0].displayTranslation?.status).toBe(aligned?"ready":"unavailable");
  if(aligned) {
    t.deps.displayTranslationLookup=async()=>new Map([[p.id,{...translation,text:"Different translation"}]]);
    expect(await runSimplePipeline("Explain care",frame,t.deps,signal(),hints)).toMatchObject({status:"incomplete",failureKind:"source_support"});
    expect(t.requests).toHaveLength(3);
  }
});
it("redistributes unused candidate places without displacing named units",()=>{
  const pool=Array.from({length:60},(_,i)=>{
    const p=structuredClone(pack.passages[i%2]);p.id=`candidate-${i}`;return {...p,retrievedFor:["R1"]};
  });
  const named=pool.filter(p=>p.source.kind==="quran").slice(0,10).map(p=>p.id);
  const selected=simpleCandidatePool(frame,pool,[named]);expect(selected).toHaveLength(30);
  expect(selected.filter(p=>p.source.kind==="quran")).toHaveLength(15);expect(selected.filter(p=>p.source.kind==="hadith")).toHaveLength(15);
  expect(named.every(id=>selected.some(p=>p.id===id))).toBe(true);
});

it("uses unused planned phrases when the planner returns no backup queries",()=>{
  const planned={...frame,backupQueries:[],searchQueries:{ar:["رعاية الوالدين", "حقوق الوالدين"],en:["parents care", "family kindness"]}};
  const previous=[{requirementId:"R1",family:"scholar" as const,language:"ar" as const,text:"رعاية الوالدين"}];
  const queries=simpleRecoveryQueries(planned,"R1",previous,{hadith:true,scholar:true});
  expect(queries.length).toBeGreaterThan(0);expect(queries.length).toBeLessThanOrEqual(6);
  expect(queries.some(q=>q.family==="scholar" && q.text==="حقوق الوالدين")).toBe(true);
  expect(queries.every(q=>q.requirementId==="R1" && q.language!=="de")).toBe(true);
  expect(queries.some(q=>q.family==="scholar" && q.text==="رعاية الوالدين")).toBe(false);
});
it("does not ask the writer twice when it clearly says the evidence is missing",async()=>{
  const t=setup();t.deps.writer.generateJson=async r=>{t.requests.push(r);return {status:"no_answer",summary:[],next_step:[],no_answer_feedback:[{group:"summary",reason:"missing_evidence",missing_requirement_ids:["R1"]}]};};
  const result=await runSimplePipeline("Explain care",frame,t.deps,signal(),hints);
  expect(result).toMatchObject({status:"incomplete",failureKind:"question_coverage"});
  expect(t.requests).toHaveLength(2);expect(t.checkpoint.simple?.correctionUsed).toBe(false);
  expect(t.shown).toEqual(["quran","hadith","scholar"]);
});
