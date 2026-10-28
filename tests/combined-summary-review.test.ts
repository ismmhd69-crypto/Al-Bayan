import {expect,it} from "vitest";
import {combinedAnchorChoices,combinedSummaryReview,combinedConditions,resolveCombinedFindings} from "@/lib/ask/combined-summary-review";
import {richReviewRequest,normalizeRichReview} from "@/lib/ask/rich-review-request";
import {CLAIM_AUDIT_FIELDS} from "@/lib/ask/checks";
import {structuredOutputContract} from "@/lib/ai/structured-output";
const items=[{text:"A test assertion describes responsibility while preserving both prerequisites.",refs:["S1","S2"],requirementId:"R1"}];
const serialized={question:{language:"en",requirements:[{id:"R1",text:"Explain responsibility",facet:"general"}]},passages:[
  {id:"S1",arabic:"نص اختباري عن مسؤولية مشروطة بوجود الشرط الأول والثاني. ".repeat(9),supported_requirement_ids:["R1"]},
  {id:"S2",arabic:"نص اختباري آخر عن العناية والحرص والمسؤولية في العمل. ".repeat(10),supported_requirement_ids:["R1"]},
]};
function request(){return combinedSummaryReview(richReviewRequest({items,language:"en",full:true,question:"Test responsibility",serialized,guidance:null,translationCandidates:[],summaryCount:1,earlierCount:0,deriveAuditReasons:true,publishedOriginalIds:["S1","S2"]}),items,serialized);}
function reply():any{const choices=combinedAnchorChoices(items,serialized);return {combined_review_contract:"summary_conditions_v2",audit_contract:"field_verdicts_anchors_v3",claim_assessments:[{claim_id:"C1",source_ids:["S1","S2"],...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f=>[f,"yes"])),explanation:"",finding:{category:"source_support",claim_quote:"",source_id:"",source_anchor_id:""},condition_comparisons:items[0].refs.map(id=>({source_id:id,source_anchor_id:choices.conditions.C1.find(a=>a.source_id===id)!.anchor_id,claim_excerpt:items[0].text,source_join:"all",claim_join:"all"}))}]};}
it("uses different identities for citation, condition and negative lists on multi-excerpt sources",()=>{
  const r=request(),input=JSON.parse(r.prompt),row=input.claim_evidence[0];
  expect(row.excerpt_choices[1].source_id).toBe("S2");
  expect(row.condition_excerpt_choices.filter((a:any)=>a.source_id==="S1").length).toBeGreaterThan(1);
  const conditionIds=row.condition_excerpt_choices.map((a:any)=>a.anchor_id),negativeIds=row.negative_excerpt_choices.map((a:any)=>a.anchor_id),citationIds=row.excerpt_choices.map((a:any)=>a.anchor_id);
  expect(conditionIds).toContain("C1S2K1");expect(conditionIds.some((id:string)=>citationIds.includes(id)||negativeIds.includes(id))).toBe(false);
  expect(negativeIds.some((id:string)=>citationIds.includes(id))).toBe(false);
  expect(row.condition_excerpt_choices.some((a:any)=>"original_anchor_id" in a)).toBe(false);
  structuredOutputContract(r.schema);
});
it("asks the reviewer to read the full original before interpreting Arabic conjunctions",()=>{
  expect(request().system).toContain("Read the complete cited original");
  expect(request().system).toContain("An Arabic conjunction alone does not establish");
  expect(request().system).toContain("Never approve a missing condition");
});
it("accepts exactly bound condition comparisons and preserves the primary verdict",()=>{
  const raw=reply(),conditions=combinedConditions(raw,items,serialized);
  expect(conditions?.safeIds).toEqual(["C1"]);expect(conditions?.failures).toEqual([]);
  expect(normalizeRichReview(resolveCombinedFindings(raw,items,serialized),items,serialized,true)).toMatchObject({claim_assessments:[{direct_support:"yes",conditions_preserved:"yes"}]});
});
it("reproduces the captured E2 collision without silently repairing that provider response",()=>{
  const raw=reply(),failures:string[]=[];
  raw.claim_assessments[0].condition_comparisons[1].source_anchor_id="C1E2";
  expect(combinedConditions(raw,items,serialized,code=>failures.push(code))).toBeNull();expect(failures).toContain("condition_reference_invalid");
  raw.claim_assessments[0].condition_comparisons[1].source_anchor_id="C1S1K2";
  expect(combinedConditions(raw,items,serialized)).toBeNull();
});
it("preserves an explicit negative and rejects a wrong-source negative anchor",()=>{
  const raw=reply(),row=raw.claim_assessments[0],choices=combinedAnchorChoices(items,serialized);
  row.conditions_preserved="no";row.explanation="The invented prerequisites are missing.";
  row.finding={category:"missing_qualification",claim_quote:items[0].text,source_id:"S1",source_anchor_id:choices.findings.C1[0].anchor_id};
  const result=combinedConditions(raw,items,serialized);expect(result?.safeIds).toEqual([]);expect(result?.failures[0].category).toBe("missing_qualification");
  expect(normalizeRichReview(resolveCombinedFindings(raw,items,serialized),items,serialized,true)).toMatchObject({claim_assessments:[{conditions_preserved:"no"}]});
  row.finding.source_id="S2";expect(resolveCombinedFindings(raw,items,serialized)).toBeNull();expect(combinedConditions(raw,items,serialized)).toBeNull();
});
