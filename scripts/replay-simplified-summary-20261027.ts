// Replays the previous review envelope offline; this cannot establish religious truth.
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { resolveCombinedFindings } from "../lib/ask/combined-summary-review";
import { normalizeRichReview } from "../lib/ask/rich-review-request";
const rows = readFileSync("work/local-ask-traces/3a94ad88-9c1e-44c3-a945-b4188f2a3dea.jsonl", "utf8").trim().split(/\r?\n/u).map(line=>JSON.parse(line));
const input=rows.find(r=>r.event==="model_request" && r.data.call_id==="A7").data.prompt;
const response=rows.find(r=>r.event==="model_response" && r.data.call_id==="A7").data.value;
const items=input.claims.map((c:any)=>({text:c.claim,refs:c.source_ids,requirementId:c.requirement_id}));
const passages=[...new Map(input.claim_evidence.flatMap((e:any)=>e.cited_originals).map((p:any)=>[p.id,p])).values()];
const serialized={...input.evidence_package,passages};
// Old F anchors are resolved by the old contract before checking the retained review fields.
const primary:any=resolveCombinedFindings(response,items,serialized);
assert.ok(primary);
for(const row of primary.claim_assessments) delete row.condition_comparisons;
delete primary.combined_review_contract;
const normalized:any=normalizeRichReview(primary,items,serialized,true);
assert.ok(normalized);
assert.equal(normalized.requirement_coverage.find((r:any)=>r.requirement_id==="R2").fully_answered,"no");
console.log("Previous review now parses without the redundant form; missing coverage remains a rejection. No provider calls.");
