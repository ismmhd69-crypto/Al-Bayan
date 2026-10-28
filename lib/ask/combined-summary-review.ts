import type { JsonRequest, JsonSchema } from "@/lib/ai/types";
import type { Claim } from "./checks";
import { CLAIM_AUDIT_FIELDS } from "./checks";
import { meaningAnchors } from "./meaning-anchors";
import { meaningReviewRequest, parseMeaningReview } from "./meaning-review";

/** One verdict envelope, with the former narrow review's explicit condition comparisons.
 * The existing parsers still enforce code-owned source anchors and every qualification. */
export function combinedSummaryReview(request: JsonRequest, items: Claim[], serialized: unknown): JsonRequest {
  const conditions = meaningReviewRequest(items, serialized, request.signal!, "anchored");
  const schema = structuredClone(request.schema);
  if (schema.type !== "object" || schema.properties.claim_assessments.type !== "array"
    || schema.properties.claim_assessments.items.type !== "object" || conditions.schema.type !== "object"
    || conditions.schema.properties.claims.type !== "object") throw Error("combined_review_schema_invalid");
  const anchors = combinedAnchorChoices(items, serialized);
  const fields = items.map((_, i) => {
    const row = conditions.schema.type === "object" && conditions.schema.properties.claims;
    if (!row || row.type !== "object" || row.properties[`C${i + 1}`].type !== "object") throw Error("condition_schema_invalid");
    const claim = row.properties[`C${i + 1}`];
    if (claim.type !== "object") throw Error("condition_schema_invalid");
    return claim.properties.condition_comparisons;
  });
  const arrays = fields.filter((f): f is Extract<JsonSchema, {type:"array"}> => f.type === "array");
  const rows = arrays.map(f => f.items).filter((f): f is Extract<JsonSchema, {type:"object"}> => f.type === "object");
  if(!rows.length) throw Error("combined_condition_schema_invalid");
  const comparison = structuredClone(rows[0]);
  comparison.properties.source_id = { type: "string", enum: [...new Set(items.flatMap(c=>c.refs))] };
  comparison.properties.source_anchor_id = { type: "string", enum: Object.values(anchors.conditions).flat().map(a=>a.anchor_id) };
  const finding = schema.properties.claim_assessments.items.properties.finding;
  if(finding.type!=="object") throw Error("combined_finding_schema_invalid");
  finding.properties.source_anchor_id = { type:"string",enum:["",...Object.values(anchors.findings).flat().map(a=>a.anchor_id)] };
  schema.properties.claim_assessments.items.properties.condition_comparisons = { type: "array", maxItems: Math.max(...items.map(c=>c.refs.length)), items: comparison };
  schema.properties.claim_assessments.items.required.push("condition_comparisons");
  schema.properties.combined_review_contract = { type: "string", enum: ["summary_conditions_v2"] };
  schema.required.push("combined_review_contract");
  const input = JSON.parse(request.prompt);
  input.claim_evidence = input.claim_evidence.map((row: {claim_id:string}, i: number) => ({ ...row,
    condition_excerpt_choices: anchors.conditions[row.claim_id].map(({original_anchor_id:_id,...a})=>a), negative_excerpt_choices: anchors.findings[row.claim_id].map(({original_anchor_id:_id,...a})=>a) }));
  return { ...request, schema, maxOutputTokens: Math.min(10000, (request.maxOutputTokens ?? 6000) + items.length * 500),
    prompt: JSON.stringify(input), system: request.system + "\n" + conditions.system.replace("Check ONLY whether each exact claim follows from its own originals. Ignore prose quality, formatting, the visitor's expectations and other claims.", "Check each claim against its own originals, alongside all the combined final-review requirements.")
      + "\nCombined review: return combined_review_contract summary_conditions_v2 in the existing audit envelope. Citation anchors use E, condition anchors use K and negative-finding anchors use F. These are different namespaces: never copy an E/F reference into a condition comparison. Each K reference names its exact claim, source position and excerpt. Copy its matching source_id; do not infer source order from an excerpt number. Return condition_comparisons in each claim_assessments row, using that claim's condition_excerpt_choices. Read the complete cited original, including other statements within it, before deciding whether a qualification is jointly required or an alternative. An Arabic conjunction alone does not establish that separate circumstances are jointly required; use the original's actual meaning and context. If the logic is unclear, return unsure; do not supply a missing condition from familiarity or unrelated context. The five field decisions are the sole meaning verdicts. Do not return a separate claims object or meaning_contract. All original final-audit, citation, audience, scope, consistency, complete-question coverage and condition obligations remain required. For an all-yes row use the existing empty positive finding. For a negative row use its grounded original anchor. Never approve a missing condition or an unsupported connection." };
}

export function combinedConditions(raw: unknown, items: Claim[], serialized: unknown, onFailure?: (code:string)=>void) {
  const fail=(code:string)=>{onFailure?.(code);return null;};
  const value = raw as { combined_review_contract?: string; claim_assessments?: Record<string, any>[] } | null;
  if (value?.combined_review_contract !== "summary_conditions_v2" || !Array.isArray(value.claim_assessments)
    || value.claim_assessments.length !== items.length || value.claim_assessments.some(r=>!r || typeof r!=="object" || Array.isArray(r))) return fail("condition_contract_invalid");
  const claims: Record<string, unknown> = {};
  const anchors = combinedAnchorChoices(items, serialized);
  for (let i = 0; i < items.length; i++) {
    const id = `C${i + 1}`, matches = value.claim_assessments.filter(r => r.claim_id === id);
    if (matches.length !== 1) return fail("condition_contract_invalid");
    const row = matches[0];
    if (CLAIM_AUDIT_FIELDS.some(f => !["yes", "no", "unsure"].includes(row[f]))) return fail("condition_contract_invalid");
    const verdict = CLAIM_AUDIT_FIELDS.every(f => row[f] === "yes") ? "yes" : CLAIM_AUDIT_FIELDS.some(f => row[f] === "no") ? "no" : "unsure";
    if(!Array.isArray(row.condition_comparisons)) return fail("condition_contract_invalid");
    const comparisons=[];
    for(const comparison of row.condition_comparisons) {
      const anchor=anchors.conditions[id].find(a=>a.anchor_id===comparison?.source_anchor_id && a.source_id===comparison.source_id);
      if(!anchor) return fail("condition_reference_invalid");
      comparisons.push({...comparison,source_anchor_id:anchor.original_anchor_id});
    }
    const finding=row.finding;
    if(!finding || typeof finding!=="object") return fail("condition_contract_invalid");
    let resolvedFinding=finding;
    if(verdict!=="yes") {
      const anchor=anchors.findings[id].find(a=>a.anchor_id===finding.source_anchor_id && a.source_id===finding.source_id);
      if(!anchor) return fail("condition_contract_invalid");
      resolvedFinding={...finding,source_anchor_id:anchor.original_anchor_id};
    }
    claims[id] = { verdict, explanation: row.explanation, finding: resolvedFinding, condition_comparisons: comparisons };
  }
  return parseMeaningReview({ meaning_contract: "condition_anchors_v3", claims }, items, serialized, "anchored") ?? fail("condition_comparison_invalid");
}

/** Distinct field namespaces prevent a valid E citation from naming a different
 * 400-character condition excerpt. No guessed, fuzzy or cross-source remapping. */
export function combinedAnchorChoices(items:Claim[],serialized:unknown) {
  const originals=meaningAnchors(items,serialized);
  const rename=(rows:typeof originals.originals,prefix:"K"|"F")=>Object.fromEntries(items.map((claim,i)=>{
    const id=`C${i+1}`,counts=new Map<string,number>();
    return [id,rows[id].map(a=>{
      const position=claim.refs.indexOf(a.source_id)+1,number=(counts.get(a.source_id)??0)+1;counts.set(a.source_id,number);
      return {...a,original_anchor_id:a.anchor_id,anchor_id:prefix==="K"?`${id}S${position}K${number}`:`${id}F${rows[id].indexOf(a)+1}`};
    })];
  }));
  return {conditions:rename(originals.originals,"K"),findings:rename(originals.findings,"F")};
}
export function resolveCombinedFindings(raw:unknown,items:Claim[],serialized:unknown):unknown|null {
  const value=raw as {combined_review_contract?:string;claim_assessments?:Record<string,any>[]} | null;
  if(value?.combined_review_contract!=="summary_conditions_v2" || !Array.isArray(value.claim_assessments) || value.claim_assessments.some(r=>!r || typeof r!=="object" || Array.isArray(r))) return null;
  const choices=combinedAnchorChoices(items,serialized).findings;
  const rows=[];
  for(const row of value.claim_assessments) {
    const finding=row.finding;
    if(!choices[row.claim_id] || !finding) return null;
    if(CLAIM_AUDIT_FIELDS.every(field=>row[field]==="yes")) {rows.push(row);continue;}
    const anchor=choices[row.claim_id].find(a=>a.anchor_id===finding.source_anchor_id && a.source_id===finding.source_id);
    if(!anchor) return null;
    rows.push({...row,finding:{...finding,source_anchor_id:anchor.original_anchor_id}});
  }
  return {...value,claim_assessments:rows};
}
