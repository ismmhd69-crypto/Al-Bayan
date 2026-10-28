import { createHash } from "node:crypto";
import type { PipelineDeps, AskResult } from "./core";
import type { EvidencePackage, PassageForSelection, QuestionFrame } from "./retrieval";
import type { RichSection, RichFailureKind } from "./rich-answer";
import { validRichAnswer } from "./rich-answer";
import { pointSearchPlans } from "./library-flow";
import { uniqueResearchCandidates } from "./search-engine/candidate-identity";
import { researchCandidatePool } from "./search-engine/research-candidate-pool";
import { eligibleCorpusCandidates } from "./search-engine/pipeline-corpus";
import { novelRecoveryQueries, type RecoveryQuery } from "./search-engine/recovery";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { resolveHadithHints } from "./hadith-hints";
import { originalSection } from "./original-sections";
import { simpleSelection } from "./simple-selection";
import { runRichAnswer } from "./rich-engine";
import { abortable } from "./abort";
import { researchFailure } from "./research-failure";
import type { ProgressiveCheckpoint } from "./progressive-checkpoint";

const groups = ["quran", "hadith", "scholar"] as const;
type Group = typeof groups[number];
type Hints = { quran:string[]; hadith:string[]; scholars:string[] };
const hash = (v:unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
/** Reordering the same source records is not new evidence. Changes to any
 * candidate's original, context or metadata still require reassessment. */
export const candidateFingerprint = (a:PassageForSelection[]) => hash([...a].sort((x,y)=>x.id.localeCompare(y.id)));
export const sameResearchCandidates = (a:PassageForSelection[], b:PassageForSelection[]) => candidateFingerprint(a) === candidateFingerprint(b);

/** Deterministic, concern-balanced round robin. Named units and prior useful
 * selections reserve space before the remaining candidates are balanced. */
export function simpleCandidatePool(frame:QuestionFrame, pool:PassageForSelection[], named:string[][] = [], preserve:string[] = []) {
  const unique = uniqueResearchCandidates(pool);
  const required = [...new Set(named.flat())];
  if (required.length > 30 || required.some(id => !unique.some(p => p.id === id))) throw Error("named_evidence_incomplete");
  const preserved = [...new Set(preserve)].filter(id => !required.includes(id) && unique.some(p => p.id === id)).slice(0, 30 - required.length);
  const chosen = new Map([...required, ...preserved].map(id => [id, unique.find(p => p.id === id)!]));
  const queues = groups.map(group => researchCandidatePool(frame, unique.filter(p => p.source.kind === group), 30).candidates);
  const quotas = groups.map(group => [...chosen.values()].filter(p => p.source.kind === group).length);
  for(let slots=chosen.size; slots<Math.min(30,unique.length); slots++) {
    const available=groups.map((_,i)=>i).filter(i=>quotas[i]<queues[i].length);
    available.sort((a,b)=>quotas[a]-quotas[b] || a-b);
    if(!available.length) break;
    quotas[available[0]]++;
  }
  for(const [i,queue] of queues.entries()) {
    let count=[...chosen.values()].filter(p=>p.source.kind===groups[i]).length;
    for(const p of queue) if(count<quotas[i] && !chosen.has(p.id)) {chosen.set(p.id,p);count++;}
  }
  return [...chosen.values()];
}

/** Use only phrases from the existing validated plan if the planner supplied
 * no usable backup. Search discovery is never treated as evidence approval. */
export function simpleRecoveryQueries(frame:QuestionFrame, requirementId:string, previous:RecoveryQuery[], availability:PipelineDeps["sourceAvailability"]):RecoveryQuery[] {
  const concern=frame.requirements.find(r=>r.id===requirementId);
  if(!concern) throw Error("recovery_concern_invalid");
  const gap={requirementId,concern:concern.text,reason:"missing_direct_support" as const,families:[...groups]};
  const allowed=(q:RecoveryQuery)=>q.requirementId===requirementId && q.language!=="de"
    && (q.family==="quran" || availability?.[q.family]!==false) && (q.family!=="scholar" || q.language==="ar");
  const backups=novelRecoveryQueries((frame.backupQueries ?? []).filter(allowed),[gap],previous);
  if(backups.length) return backups;
  const queues:RecoveryQuery[][]=[
    (frame.searchQueries.ar ?? []).map(text=>({requirementId,family:"scholar",language:"ar",text})),
    (frame.searchQueries.ar ?? []).map(text=>({requirementId,family:"quran",language:"ar",text})),
    (frame.searchQueries.ar ?? []).map(text=>({requirementId,family:"hadith",language:"ar",text})),
    (frame.searchQueries.en ?? []).map(text=>({requirementId,family:"quran",language:"en",text})),
    (frame.searchQueries.en ?? []).map(text=>({requirementId,family:"hadith",language:"en",text})),
  ];
  const chosen:RecoveryQuery[]=[];
  for(let rank=0;rank<6 && chosen.length<6;rank++) for(const queue of queues) {
    const candidate=queue[rank];if(!candidate || !allowed(candidate)) continue;
    const novel=novelRecoveryQueries([candidate],[gap],[...previous,...chosen]);
    if(novel.length && chosen.length<6) chosen.push(novel[0]);
  }
  return chosen;
}

/** The session ledger counts actual transport attempts, including all provider fallbacks.
 * This engine owns task allowances. It never calls a model ranker or recovery planner. */
export async function runSimplePipeline(question:string, frame:QuestionFrame, original:PipelineDeps, signal:AbortSignal, hints:Hints):Promise<AskResult> {
  const checkpoint:ProgressiveCheckpoint = original.progressiveCheckpoint ?? { lanes:{},retry:0,meaningApprovals:new Set() };
  checkpoint.frame = structuredClone(frame);
  const state = checkpoint.simple ??= { version:1,recoveryUsed:false,correctionUsed:false,gaps:[],queries:[] };
  const deps:PipelineDeps = { ...original,progressiveCheckpoint:checkpoint,simpleResearch:true,meaningRankCandidates:undefined,
    focusedChecks:false,meaningReview:false,fixedSelectionReferences:true,deriveAuditReasons:true,
    onDiagnostic:(stage,code,elapsed,details)=>{
      if(code==="rich_coverage_map" && details && typeof details==="object" && Array.isArray((details as {coverage?:unknown}).coverage)) {
        const rows=(details as {coverage:{requirement_id:string;checks:{verdict:string}[]}[]}).coverage;
        state.gaps=frame.requirements.filter(r=>!rows.some(row=>row.requirement_id===r.id && row.checks.every(c=>c.verdict==="yes"))).map(r=>r.id);
      }
      original.onDiagnostic?.(stage,code,elapsed,details);
    } };
  const emit = (section:RichSection) => deps.rich?.onSection?.(section, hash({policy:"simple-research-1",frame,section,pack:state.pack}));
  const incomplete = (failureKind:RichFailureKind, terminal=false):AskResult => {
    state.lastFailure=failureKind;
    if(terminal) { state.terminalNegative=true; state.summaryState="rejected"; } else state.summaryState="partial";
    deps.onDiagnostic?.("answer","simple_research_incomplete",0,{failure_kind:failureKind,recovery_used:state.recoveryUsed,correction_used:state.correctionUsed});
    return {status:"incomplete",language:frame.language,withdraw:false,sections:state.frozen ?? [],failureKind};
  };
  const fingerprint = (answer:unknown) => hash({policy:"simple-summary-review-5",question,frame,pack:state.pack,answer,
    writer:deps.writer.id,verifier:deps.verifier.id,context:deps.previousUserMessages ?? []});
  const refresh = async (pack:EvidencePackage) => {
    if (!deps.revalidateStable) return {unavailable:true,rejectedIds:[] as string[]};
    return deps.revalidateStable(pack.passages,signal);
  };
  const publishFrozen = () => { for(const section of state.frozen ?? []) emit(section); };
  try {
    if(state.terminalNegative && !state.frozen) return incomplete(state.lastFailure ?? "selection_failure",true);
    if(state.version!==1) return incomplete("checkpoint_incompatible",true);
    if(state.frozen && state.pack) {
      const recheck=await refresh(state.pack); signal.throwIfAborted();
      publishFrozen();
      if(recheck.rejectedIds.length) {
        delete state.approved; checkpoint.integrityBlocked=true;
        for(const group of groups) {
          const sourceIds=state.frozen.find(s=>s.group===group)?.sources.filter(s=>recheck.rejectedIds.includes(s.id)).map(s=>s.id) ?? [];
          if(sourceIds.length) deps.rich?.onIntegrity?.({group,claimIndexes:[],sourceIds,reason:"source_changed"});
        }
        return incomplete("source_support",true);
      }
      if(recheck.unavailable) return incomplete("source_revalidation_unavailable");
      // A cached display translation is an exact evidence dependency too. Reuse never
      // commissions a new translation or obtains a fresh AI opinion about changed text.
      const translated=state.frozen.flatMap(s=>s.sources).filter(s=>s.displayTranslation?.status==="ready");
      if(translated.length) {
        if(!deps.displayTranslationLookup) return incomplete("source_revalidation_unavailable");
        const current=await deps.displayTranslationLookup(translated,frame.language,signal);
        if(translated.some(s=>current.get(s.id)?.status!=="ready")) return incomplete("source_revalidation_unavailable");
        if(translated.some(s=>JSON.stringify(current.get(s.id))!==JSON.stringify(s.displayTranslation))) {
          delete state.approved;checkpoint.integrityBlocked=true;
          for(const source of translated) if(JSON.stringify(current.get(source.id))!==JSON.stringify(source.displayTranslation))
            deps.rich?.onIntegrity?.({group:"scholar",claimIndexes:[],sourceIds:[source.id],reason:"source_changed"});
          return incomplete("source_support",true);
        }
      }
      if(state.approved) {
        if(state.approved.fingerprint!==fingerprint(state.approved.answer) || !validRichAnswer(state.approved.answer)) return incomplete("checkpoint_incompatible",true);
        const summary=state.approved.answer.sections.find(s=>s.group==="summary")!;
        emit(summary);deps.onDiagnostic?.("answer","simple_approved_research_reused",0);
        return {status:"rich_answer",answer:structuredClone(state.approved.answer)};
      }
      if(state.terminalNegative) return incomplete(state.lastFailure ?? "question_coverage",true);
    } else {
      groups.forEach(g=>deps.rich?.onGroupStatus?.(g,"searching"));
      const problems=new Set<Group>();
      const plans=pointSearchPlans(frame);
      const query = async (group:Group, requirementId:string, q:{quran:string[];hadith:Partial<Record<"ar"|"en"|"de",string[]>>;scholar:string[]}, recovery=false):Promise<PassageForSelection[]> => {
        if(group!=="quran" && deps.sourceAvailability?.[group]===false) return [];
        if(group==="quran") {
          const found=await abortable(deps.search(q.quran,16),signal);
          const keys=[...new Set([...(!recovery?hints.quran:[]),...found])].slice(0,16);
          const verseResults=await Promise.allSettled(keys.map(key=>abortable(deps.getVerse(key),signal)));
          signal.throwIfAborted();
          if(verseResults.some(v=>v.status==="rejected")) problems.add(group);
          const verses=verseResults.flatMap(v=>v.status==="fulfilled" && v.value ? [v.value] : []);
          const context=await Promise.allSettled(verses.map(async verse=>({id:`Q${verse.key}`,
            source:{kind:"quran" as const,verse},context:(await abortable(deps.neighbours(verse.key),signal)).filter(v=>v.key!==verse.key),retrievedFor:[requirementId]})));
          // A Stop or dropped connection mid-lookup must never look like a finished search.
          signal.throwIfAborted();
          const contextFailures=context.filter(v=>v.status==="rejected").length;
          if(contextFailures) { problems.add(group); deps.onDiagnostic?.("retrieval","quran_context_unavailable",0,{count:contextFailures}); }
          return context.flatMap(v=>v.status==="fulfilled"?[v.value]:[]);
        }
        if(group==="hadith") {
          const [found,mapped]=await Promise.all([deps.searchHadith?abortable(deps.searchHadith({en:q.hadith.en ?? [],ar:q.hadith.ar ?? []}),signal):[],
            !recovery?resolveHadithHints(deps,hints.hadith,signal):[]]);
          return [...mapped,...found].filter(hadithAllowed).map(hadith=>({id:hadith.id,source:{kind:"hadith" as const,hadith},context:[],retrievedFor:[requirementId]}));
        }
        const found=deps.searchScholars?await abortable(deps.searchScholars(q.scholar,!recovery?hints.scholars:[]),signal):[];
        return found.filter(scholarQuoteAllowed).map(quote=>({id:quote.id,source:{kind:"scholar" as const,quote},context:[],
          contextAvailability:"stored_excerpt_only" as const,retrievedFor:[requirementId]}));
      };
      let pool=state.candidates;
      // Search problems from the original run stay visible after Continue.
      for(const group of state.searchProblems ?? []) problems.add(group);
      if(pool?.length) {
        const recheck=deps.revalidateStable?await deps.revalidateStable(pool,signal):{unavailable:true,rejectedIds:[]};
        if(recheck.unavailable) return incomplete("source_revalidation_unavailable");
        // The saved assessment applies to the exact original candidates. If
        // any changed while interrupted, it cannot safely drive recovery.
        if(state.recoveryPending && recheck.rejectedIds.length) return incomplete("source_support",true);
        pool=pool.filter(p=>!recheck.rejectedIds.includes(p.id));
        delete state.pack;
      }
      if(!pool?.length) {
        const tasks=plans.flatMap(plan=>groups.map(async group=>{
          try { return await query(group,plan.id,plan); } catch {signal.throwIfAborted();problems.add(group);return [];}
        }));
        const corpus=deps.retrieveCorpusCandidates?abortable(deps.retrieveCorpusCandidates(frame,signal),signal)
          .then(c=>eligibleCorpusCandidates(c,deps.sourceAvailability)).catch(()=>{signal.throwIfAborted();return [];}):Promise.resolve([]);
        const [results,extras]=await Promise.all([Promise.all(tasks),corpus]);
        pool=simpleCandidatePool(frame,[...results.flat(),...extras],deps.namedEvidencePassages);
        // Never save an interrupted search as the finished candidate list.
        signal.throwIfAborted();
        state.candidates=structuredClone(pool);state.searchProblems=[...problems];
        state.queries=plans.flatMap(p=>groups.flatMap(family=>(family==="quran"?p.quran:family==="scholar"?p.scholar:[...p.hadith.ar ?? [],...p.hadith.en ?? []])
          .map(text=>({requirementId:p.id,family,language:/\p{Script=Arabic}/u.test(text)?"ar" as const:"en" as const,text}))));
      }
      groups.forEach(g=>deps.rich?.onGroupStatus?.(g,"checking"));
      const selectWithRepair = async (candidates: PassageForSelection[]) => {
        const recoverable = ["assessments_missing", "assessments_invalid_or_empty", "source_scope_mismatch", "non_direct_requirement_assignment", "named_passage_scope_unresolved", "combined_selection_format_invalid", "gap_map_inconsistent", "gap_map_unsubstantiated",
          // Scholars differ but a position label is missing: a format slip the single reassessment can fix.
          "scholar_position_missing", "sealed_scholar_position_missing", "scholar_difference_positions_missing"];
        const fingerprint = candidateFingerprint(candidates);
        // A reassessment interrupted before it returned resumes with the same reason, for the
        // same unchanged candidates. Changed candidates need a fresh assessment instead.
        const pendingRepair = state.pendingReassessment?.candidates === fingerprint && !state.reassessmentUsed ? state.pendingReassessment.reason : undefined;
        if (state.pendingReassessment && !pendingRepair) delete state.pendingReassessment;
        let result = pendingRepair ? undefined : await simpleSelection(frame,candidates,deps,signal);
        const reason = pendingRepair ?? (result && !result.pack && !state.reassessmentUsed && result.rejection && recoverable.includes(result.rejection) ? result.rejection : undefined);
        if (reason) {
          state.pendingReassessment = { reason, candidates: fingerprint };
          deps.onDiagnostic?.("retrieval", pendingRepair ? "simple_selection_reassessment_resumed" : "simple_selection_reassessment_started", 0, { reason });
          deps.rich?.onProgress?.("retrying_selection");
          result = await simpleSelection(frame,candidates,deps,signal,reason);
          // Spent only once a reassessment has actually returned.
          state.reassessmentUsed = true; delete state.pendingReassessment;
          deps.rich?.onProgress?.("checking_evidence");
          deps.onDiagnostic?.("retrieval", result.pack ? "simple_selection_reassessment_succeeded" : "simple_selection_reassessment_failed", 0);
        }
        return result!;
      };
      const pending=state.recoveryPending;
      // A resumed selection's optional display translations have not been
      // re-fetched yet. Omit them unless a fresh selection checks them again.
      let assessment=pending ? {...pending.assessment,translations:new Map<string,import("./rich-answer").DisplayTranslation>()} : await selectWithRepair(pool);
      state.gaps=assessment.missingRequirementIds ?? [];
      if(pending || assessment.missingRequirementIds?.length && !state.recoveryUsed) {
        let queries=pending?.queries;
        if(!queries) {
          state.recoveryUsed=true;
          const concern=frame.requirements.find(r=>state.gaps.includes(r.id))!;
          queries=simpleRecoveryQueries(frame,concern.id,state.queries,deps.sourceAvailability);
          deps.onDiagnostic?.("retrieval",queries.length ? "simple_recovery_searches_started" : "simple_recovery_no_new_queries",0,{query_count:queries.length,requirement_id:concern.id});
          state.queries.push(...queries);checkpoint.recoveryQueries=[...queries];
          state.recoveryPending={queries:[...queries],assessment:{...assessment,translations:[...assessment.translations]}};
        } else deps.onDiagnostic?.("retrieval","simple_recovery_searches_resumed",0,{query_count:queries.length});
        const results=await Promise.all(queries.map(async q=>{
          try {return await query(q.family,q.requirementId,{quran:[q.text],scholar:[q.text],hadith:{[q.language]:[q.text]}},true);}
          catch {signal.throwIfAborted();problems.add(q.family);return [];}
        }));
        // A new search can fill a source-family quota and otherwise evict a
        // previously useful candidate before the second assessment sees it.
        // This preserves candidates, never their earlier selection verdicts.
        const next=simpleCandidatePool(frame,[...pool,...results.flat()],deps.namedEvidencePassages,assessment.pack?.passages.map(p=>p.id));
        if(!sameResearchCandidates(next,pool)) {
          const recovered=await selectWithRepair(next);
          state.candidates=structuredClone(next);pool=next;
          // A failed recovery selection never discards an earlier valid selection.
          if(recovered.pack || !assessment.pack) { assessment=recovered; state.gaps=assessment.missingRequirementIds ?? []; }
          else deps.onDiagnostic?.("retrieval","simple_recovery_selection_failed_kept_previous",0,{reason:recovered.rejection});
        }
        delete state.recoveryPending;
      }
      if(!assessment.pack) return incomplete(assessment.rejection==="no_candidates"?"question_coverage":"selection_failure",true);
      // Approved scholars differ: publish the checked sources and write an equal-weight summary.
      // Revelation conflicts and uncertain conflicts are refused earlier, by the selection parser.
      if(assessment.pack.scholarDifference) deps.onDiagnostic?.("retrieval","simple_scholar_difference_presented",0,{count:Object.keys(assessment.pack.scholarDifference.positions).length});
      // Planning incompleteness never approves wording. Final review must independently
      // prove every actual summary concern against these exact frozen originals.
      const {partial:_partial,...selected}=assessment.pack;
      state.pack=structuredClone(selected);
      const sections=await Promise.all(groups.map(async group=>{
        const section=await originalSection(group,state.pack!,frame.language,deps,signal,assessment.translations);
        if(!section.sources.length && group!=="quran" && deps.sourceAvailability?.[group]===false) section.outcome="unavailable";
        else if(problems.has(group) || deps.sourceProblems?.[group]) {
          if(section.sources.length) section.searchOutcome="search_failed";else section.outcome="search_failed";
          section.searchFailureStage="source_search";
        }
        return section;
      }));
      state.frozen=structuredClone(sections); publishFrozen();
    }
    if(!state.pack || !state.frozen?.some(s=>s.outcome==="ready")) return incomplete("question_coverage",true);
    state.summaryState="draft";
    const result=await runRichAnswer(state.pack,frame.language,{...deps,rich:{...deps.rich,
      onSection:(section)=>{if(section.group==="summary" && section.outcome==="ready") emit(section);},
      onWithdraw:()=>{},onIntegrity:notice=>{checkpoint.integrityBlocked=true;deps.rich?.onIntegrity?.(notice);}}},signal,question,{},Infinity,
      {checkedSections:state.frozen.filter(s=>s.outcome==="ready"),committedSources:true});
    if(result.status!=="rich_answer") {
      const kind=result.failureKind ?? "checker_failure";
      const resumable=["transport_failure","connection_interrupted","cancelled","billing_uncertain","spending_limit","source_revalidation_unavailable","summary_provider_rejection"].includes(kind);
      return incomplete(kind,!resumable);
    }
    const answer={...result.answer,sections:[...state.frozen,result.answer.sections.find(s=>s.group==="summary")!]};
    if(!validRichAnswer(answer)) return incomplete("checker_failure",true);
    state.summaryState="approved";state.gaps=[];delete state.lastFailure;
    state.approved={answer:structuredClone(answer),fingerprint:fingerprint(answer)};
    return {status:"rich_answer",answer};
  } catch(error) {
    signal.throwIfAborted();
    if(error instanceof Error && ["invalid_original_section","named_evidence_incomplete","research_candidate_identity_changed","research_context_identity_changed"].includes(error.message))
      return incomplete("selection_failure",true);
    return incomplete(researchFailure(error));
  }
}
