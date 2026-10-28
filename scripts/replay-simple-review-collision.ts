// Private captured-provider-response replay. No model calls, source reads or repaired approvals.
import assert from "node:assert/strict";
import {readFileSync,mkdirSync,copyFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {meaningAnchors,resolveAnchoredMeaning} from "../lib/ask/meaning-anchors";
import {combinedSummaryReview} from "../lib/ask/combined-summary-review";
import {normalizeRichReview,richReviewRequest} from "../lib/ask/rich-review-request";
const id="86c124b1-2033-4bab-9e84-2791df2a0e39",path=`work/local-ask-traces/${id}.jsonl`,bytes=readFileSync(path);
const rows=bytes.toString("utf8").trim().split(/\r?\n/).map(l=>JSON.parse(l));
const input=rows.find(r=>r.event==="model_request"&&r.data.call_id==="A4").data.prompt;
const wire=rows.find(r=>r.event==="model_response"&&r.data.call_id==="A4").data.value;
const items=input.claims.map((c:any)=>({text:c.claim,refs:c.source_ids,requirementId:c.requirement_id}));
const serialized={...input.evidence_package,passages:input.evidence_package.passages.map((p:any)=>({...p,...input.claim_evidence.flatMap((r:any)=>r.cited_originals).find((o:any)=>o.id===p.id)}))};
const old=meaningAnchors(items,serialized).originals;
const wrong=wire.claim_assessments.flatMap((r:any)=>r.condition_comparisons.filter((c:any)=>!old[r.claim_id].some(a=>a.anchor_id===c.source_anchor_id&&a.source_id===c.source_id)));
assert.equal(wrong.length,1);assert(normalizeRichReview(wire,items,serialized,true));
const row=wire.claim_assessments[0];
assert.equal(resolveAnchoredMeaning({meaning_contract:"condition_anchors_v3",claims:{C1:{verdict:"yes",explanation:row.explanation,finding:row.finding,condition_comparisons:row.condition_comparisons}}},items,serialized),null);
const request=combinedSummaryReview(richReviewRequest({items,language:"en",full:true,question:input.visitor_question,serialized,guidance:null,translationCandidates:[],summaryCount:items.length,earlierCount:0,deriveAuditReasons:true,publishedOriginalIds:input.published_original_ids}),items,serialized);
const prompt=JSON.parse(request.prompt);
for(const r of prompt.claim_evidence){
 const citationIds=r.excerpt_choices.map((a:any)=>a.anchor_id);
 assert(r.condition_excerpt_choices.every((a:any)=>!citationIds.includes(a.anchor_id)&&a.anchor_id.includes("K")));
 assert(r.negative_excerpt_choices.every((a:any)=>!citationIds.includes(a.anchor_id)&&a.anchor_id.includes("F")));
 assert(r.condition_excerpt_choices.some((a:any)=>a.anchor_id==="C1S2K1"));
}
const directory="work/private-ask-evaluation/reliability-20261026/frozen-failures";
mkdirSync(directory,{recursive:true});copyFileSync(path,`${directory}/${id}.jsonl`);
const accounting=rows.find(r=>r.event==="simple_research_accounting").data;
const report={capturedTrace:id,traceSha256:createHash("sha256").update(bytes).digest("hex"),oldPrimaryEnvelopeValid:true,wrongSourceConditionReferences:wrong.length,
 oldConditionIdentityCorrectlyRejected:true,newNamespacesDisjoint:true,recordedReviewNotRetroactivelyApproved:true,originalSummaryUnchanged:true,paidCalls:0,
 manualRun:{status:accounting.status,actualDispatches:accounting.actual_dispatches,costUsd:accounting.actual_usd,totalMs:accounting.elapsed_ms}};
writeFileSync(`${directory}/simple-review-collision-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
