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
import { parseRichClaims, withoutQuotationMarks, RANKING_LANGUAGE } from "@/lib/ask/rich-engine";
import { checkScholarAttributions } from "@/lib/ask/scholar-attribution-check";
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

// Reliability plan Phase 2: complete more answers without weakening evidence.

const scholar = pack.passages[2];
const differing = (positions: Record<string, string[]>) => ({ ...pack, scholarDifference: { positions } });
it("rejects a summary that ranks one scholarly position when scholars differ", () => {
  const reasons: string[] = [];
  const claims = [{ text: "The strongest view, held by Ibn Baz, is that care is a thoughtful responsibility.", source_ids: [scholar.id], requirement_id: "R1" }];
  expect(parseRichClaims(claims, "summary", differing({ a: [scholar.id] }) as any, "en", r => reasons.push(r))).toBeNull();
  expect(reasons).toContain("ranking_language");
});
it("rejects a summary that leaves out one of the positions", () => {
  const reasons: string[] = [];
  const claims = [{ text: "Ibn Baz explains care as a thoughtful responsibility.", source_ids: [scholar.id], requirement_id: "R1" }];
  expect(parseRichClaims(claims, "summary", differing({ a: [scholar.id], b: ["S-other-position"] }) as any, "en", r => reasons.push(r))).toBeNull();
  expect(reasons).toContain("position_omitted");
});
it("accepts an attributed, unranked summary when every position is cited", () => {
  const claims = [{ text: "Ibn Baz explains care as a thoughtful responsibility.", source_ids: [scholar.id], requirement_id: "R1" }];
  expect(parseRichClaims(claims, "summary", differing({ a: [scholar.id] }) as any, "en")).toHaveLength(1);
});
it("recognises ranking words in English and Arabic", () => {
  for (const t of ["the preferred opinion", "majority view", "القول الراجح هو", "أجمع العلماء على"]) expect(RANKING_LANGUAGE.test(t)).toBe(true);
  for (const t of ["Ibn Baz explains", "يرى ابن باز أن", "a strong reminder"]) expect(RANKING_LANGUAGE.test(t)).toBe(false);
});
it("removes typographic quotation marks from summary text without changing its words", () => {
  expect(withoutQuotationMarks([{ text: "يذكّر «الصبر» المؤمن.", source_ids: [] }])).toEqual([{ text: "يذكّر الصبر المؤمن.", source_ids: [] }]);
  expect(withoutQuotationMarks([{ text: "No quotes here.", source_ids: [] }])).toEqual([{ text: "No quotes here.", source_ids: [] }]);
});
it("still rejects a quotation lead-in such as 'said:' after removing marks", () => {
  const reasons: string[] = [];
  parseRichClaims([{ text: "Ibn Baz said: care is a thoughtful responsibility.", source_ids: [scholar.id], requirement_id: "R1" }], "summary", pack, "en", r => reasons.push(r));
  expect(reasons).toContain("quotation");
});
it("accepts common spellings of an approved scholar's name, but not a generic reference", () => {
  const sources = [{ id: scholar.id, scholarId: "ibn-baz", name: "عبد العزيز بن باز" }];
  const named = (text: string) => checkScholarAttributions([{ text, refs: [scholar.id] } as any], sources, "ar").blocked.length === 0;
  expect(named("ويرى الشيخ عبدالعزيز بن باز أن الرعاية مسؤولية.")).toBe(true);
  expect(named("ويرى بن باز أن الرعاية مسؤولية.")).toBe(true);
  expect(named("ويرى العلماء أن الرعاية مسؤولية.")).toBe(false);
});
it("publishes sources and writes an equal-weight summary when approved scholars differ", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson, second = structuredClone((pack.passages[2].source as any).quote);
  second.id = "S00000000-0000-4000-8000-000000000002"; second.arabic = "نص تجريبي آخر مستقل عن أي فتوى"; second.url = "https://binothaimeen.net/content/9"; second.scholarId = "ibn-uthaymeen"; second.scholarName = { en: "Ibn Uthaymeen", ar: "ابن عثيمين", de: "Ibn Uthaymeen" };
  t.deps.searchScholars = async () => [(pack.passages[2].source as any).quote, second];
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.conflict_type = "scholar_difference";
    let k = 0; raw.assessments.forEach((a: any, i: number) => { if (JSON.stringify(input.candidates[i]).includes('"type":"scholar"')) a.position = k++ % 2 ? "view-b" : "view-a"; });
    return raw;
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const result: any = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("simple_scholar_difference_presented");
  expect(t.checkpoint.simple?.frozen?.some(s => s.outcome === "ready")).toBe(true);
  const writer = t.requests.map(r => JSON.parse(r.prompt)).find(p => p.sections_to_write);
  expect(writer.evidence_package.scholar_difference.positions).toBeTruthy();
  expect(["rich_answer", "incomplete"]).toContain(result.status);
  if (result.status === "incomplete") expect(result.failureKind).not.toBe("selection_failure");
});
function differingSetup(mutate: (raw: any, input: any, call: number) => void) {
  const t = setup(), verify = t.deps.verifier.generateJson, second = structuredClone((pack.passages[2].source as any).quote);
  second.id = "S00000000-0000-4000-8000-000000000002"; second.arabic = "نص تجريبي آخر مستقل عن أي فتوى"; second.url = "https://binothaimeen.net/content/9";
  second.scholarId = "ibn-uthaymeen"; second.scholarName = { en: "Ibn Uthaymeen", ar: "ابن عثيمين", de: "Ibn Uthaymeen" };
  t.deps.searchScholars = async () => [(pack.passages[2].source as any).quote, second];
  let calls = 0;
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.conflict_type = "scholar_difference";
    let k = 0; raw.assessments.forEach((a: any, i: number) => { if (JSON.stringify(input.candidates[i]).includes('"type":"scholar"')) a.position = k++ % 2 ? "view-b" : "view-a"; });
    mutate(raw, input, ++calls); return raw;
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  return { t, codes, calls: () => calls };
}
it("accepts a partial selection whose status is 'conflicting' because approved scholars differ (live L09)", async () => {
  const { t, codes } = differingSetup(raw => { raw.status = "conflicting"; raw.coverage = "incomplete"; raw.missing_requirement_ids = ["R1"]; });
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).not.toContain("patient_selection_partial_status_unsafe");
  expect(codes).toContain("simple_scholar_difference_presented");
});
it("uses the single reassessment when a differing scholar quote lacks its position label (live L05)", async () => {
  const { t, codes, calls } = differingSetup((raw, _input, call) => { if (call === 1) raw.assessments.forEach((a: any) => { if (a.position) a.position = ""; }); });
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("simple_selection_reassessment_started");
  expect(calls()).toBe(2); expect(codes).toContain("simple_scholar_difference_presented");
});
it("keeps the earlier valid selection when the recovery selection fails (live L05)", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson; let selections = 0;
  t.deps.searchHadith = async q => q.en?.includes("backup new phrase")
    ? [{ ...(pack.passages[1].source as any).hadith, id: "HE9002", url: "https://hadeethenc.com/en/browse/hadith/9002" }]
    : [(pack.passages[1].source as any).hadith];
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    if (++selections === 1) { raw.status = "insufficient"; raw.coverage = "incomplete"; raw.missing_requirement_ids = ["R1"]; return raw; }
    return { selection_contract: "candidate_refs_v1", assessments: [{ source_ref: "P999" }] };
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const planned = { ...frame, backupQueries: [{ requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "backup new phrase" }] };
  const result: any = await runSimplePipeline("Explain care", planned, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("simple_recovery_selection_failed_kept_previous");
  expect(result.failureKind).not.toBe("selection_failure");
  expect(t.checkpoint.simple?.frozen?.some(s => s.outcome === "ready")).toBe(true);
});
import { previousReviewContext, richReviewRequest } from "@/lib/ask/rich-review-request";
it("tells the second summary review which unchanged sentences and concerns the first review accepted", () => {
  const yes = { direct_support: "yes", audience_preserved: "yes", conditions_preserved: "yes", scope_preserved: "yes", causal_meaning_preserved: "yes" };
  const kept = { text: "These sources describe care as a thoughtful responsibility.", refs: ["Q2:183"], requirementId: "R1" };
  const old = { text: "An earlier second sentence.", refs: ["HE9001"], requirementId: "R1" };
  const raw = { claim_assessments: [{ claim_id: "C1", ...yes }, { claim_id: "C2", ...yes, conditions_preserved: "no" }],
    requirement_coverage: [{ requirement_id: "R1", claim_ids: ["C1"], fully_answered: "yes" }] };
  const replacement = { text: "A corrected sentence.", refs: ["HE9001"], requirementId: "R1" };
  // The unchanged sentence moved from C1 to C2 in the corrected summary.
  expect(previousReviewContext([kept, old], raw, [replacement, kept])).toEqual({ accepted_unchanged_claim_ids: ["C2"], answered_by_unchanged_claims: [{ requirement_id: "R1", claim_ids: ["C2"] }] });
  expect(previousReviewContext([kept, old], raw, [replacement])).toBeUndefined();
  const request = richReviewRequest({ items: [replacement, kept] as any, language: "en", full: true, question: "Explain care", serialized: { passages: [] }, guidance: null,
    translationCandidates: [], summaryCount: 2, earlierCount: 0, previousReview: previousReviewContext([kept, old], raw, [replacement, kept]) });
  expect(JSON.parse(request.prompt).previous_review.accepted_unchanged_claim_ids).toEqual(["C2"]);
  expect(request.system).toContain("only with a grounded finding");
  expect(request.system).not.toContain("No previous checker verdicts are supplied");
  const fresh = richReviewRequest({ items: [kept] as any, language: "en", full: true, question: "Explain care", serialized: { passages: [] }, guidance: null, translationCandidates: [], summaryCount: 1, earlierCount: 0 });
  expect(fresh.system).toContain("No previous checker verdicts are supplied");
});
it("continues, still marked as a difference, when only one scholarly position survives (live L09)", async () => {
  const { t, codes } = differingSetup(raw => { raw.assessments.forEach((a: any) => { if (a.position) a.position = "view-a"; }); });
  const result: any = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("patient_selection_scholar_difference_single_position");
  expect(result.failureKind).not.toBe("selection_failure");
  // Still marked, so the one view is never written or approved as agreed or the only view.
  expect(codes).toContain("simple_scholar_difference_presented");
  const writer = t.requests.map(r => JSON.parse(r.prompt)).find(p => p.sections_to_write);
  expect(writer?.evidence_package.scholar_difference.rule).toContain("never as the only view");
});
it("accepts a source condition longer than 200 characters (live L03, L07)", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson, long = "A condition stated in the source ".repeat(9).trim();
  t.deps.verifier.generateJson = async r => { const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (input.candidates) raw.assessments.forEach((a: any) => { a.contribution.conditions = [long]; }); return raw; };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  expect(long.length).toBeGreaterThan(200);
  await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).not.toContain("patient_selection_combined_selection_format_invalid");
  expect(codes).not.toContain("patient_selection_contribution_invalid");
});
it("keeps the earlier selection when the recovery selection downgrades its direct sources (live: travel prayer)", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson; let selections = 0;
  t.deps.searchHadith = async q => q.en?.includes("backup new phrase")
    ? [{ ...(pack.passages[1].source as any).hadith, id: "HE9002", url: "https://hadeethenc.com/en/browse/hadith/9002" }]
    : [(pack.passages[1].source as any).hadith];
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.status = "insufficient"; raw.coverage = "incomplete"; raw.missing_requirement_ids = ["R1"];
    if (++selections === 2) raw.assessments.forEach((a: any) => { a.relevance = "context"; a.supported_requirement_ids = []; a.related_requirement_ids = ["R1"];
      a.contribution = { role: "background", scope: "general", conditions: [] }; });
    return raw;
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const planned = { ...frame, backupQueries: [{ requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "backup new phrase" }] };
  await runSimplePipeline("Explain care", planned, t.deps, signal(), hints);
  expect(selections).toBe(2);
  expect(codes, codes.join(",")).toContain("simple_recovery_selection_weaker_kept_previous");
  const quran = t.checkpoint.simple?.frozen?.find(s => s.group === "quran");
  expect(quran?.outcome).toBe("ready");
});
it("keeps relevant case-specific sources as limited examples for a general question (live: zakat conditions)", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson;
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.status = "insufficient"; raw.coverage = "incomplete"; raw.missing_requirement_ids = ["R1"];
    raw.assessments.forEach((a: any) => { a.relevance = "partial"; a.contribution = { role: "direct", scope: "case_specific", conditions: [] }; a.scope_matches_question = "yes"; });
    return raw;
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const result: any = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("patient_selection_case_specific_kept_as_limited_example");
  const shown = (t.checkpoint.simple?.frozen ?? []).flatMap(s => s.sources);
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.every(s => s.role !== "direct")).toBe(true);
  expect(result.failureKind).not.toBe("selection_failure");
});
it("reports 'no direct evidence' honestly instead of an invalid assessment", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson;
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.status = "insufficient"; raw.coverage = "incomplete"; raw.missing_requirement_ids = ["R1"];
    raw.assessments.forEach((a: any) => { a.relevance = "unrelated"; a.supported_requirement_ids = []; a.contribution = { role: "background", scope: "general", conditions: [] }; });
    return raw;
  };
  const result: any = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(result.failureKind).toBe("question_coverage");
});
it("treats a 'complete' claim left without a direct source as a gap, not a broken selection (live round 4 L06)", async () => {
  const t = setup(), verify = t.deps.verifier.generateJson;
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt), raw: any = await verify(r);
    if (!input.candidates) return raw;
    raw.status = "ready"; raw.coverage = "complete"; raw.missing_requirement_ids = [];
    raw.assessments.forEach((a: any) => { a.relevance = "direct"; a.contribution = { role: "direct", scope: "case_specific", conditions: [] }; a.scope_matches_question = "yes"; });
    return raw;
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const planned = { ...frame, backupQueries: [{ requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "backup new phrase" }] };
  const result: any = await runSimplePipeline("Explain care", planned, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("patient_selection_unsupported_coverage_treated_as_gap");
  expect(codes).not.toContain("patient_selection_gap_map_unsubstantiated");
  expect(t.checkpoint.simple?.recoveryUsed).toBe(true);
  expect(result.failureKind).not.toBe("selection_failure");
});
it("reports nothing relevant honestly when the selector skips every candidate (live: smartphones control)", async () => {
  const t = setup();
  t.deps.verifier.generateJson = async r => {
    const input = JSON.parse(r.prompt);
    if (!input.candidates) return {};
    return { selection_contract: "candidate_refs_v1", status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [], missing_requirement_ids: ["R1"] };
  };
  const codes: string[] = []; t.deps.onDiagnostic = (_s, code) => { codes.push(code); };
  const result: any = await runSimplePipeline("Explain care", frame, t.deps, signal(), hints);
  expect(codes, codes.join(",")).toContain("patient_selection_nothing_relevant");
  expect(codes).not.toContain("simple_selection_reassessment_started");
  expect(result.failureKind).toBe("question_coverage");
});
