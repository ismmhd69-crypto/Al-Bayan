// Replays a private, already-paid checker response; no network or source text output.
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { combinedConditions } from "../lib/ask/combined-summary-review";
const rows = readFileSync("work/local-ask-traces/1fb422b5-f1be-4a64-a482-9b173dab4cd0.jsonl", "utf8").trim().split(/\r?\n/u).map(line => JSON.parse(line));
const request = rows.find(r => r.event === "model_request" && r.data.call_id === "A4").data.prompt;
const response = rows.find(r => r.event === "model_response" && r.data.call_id === "A4").data.value;
const items = request.claims.map((c: any) => ({text:c.claim,refs:c.source_ids,requirementId:c.requirement_id}));
const passages = [...new Map(request.claim_evidence.flatMap((e: any) => e.cited_originals).map((p: any) => [p.id,p])).values()];
const result = combinedConditions(response, items, { ...request.evidence_package, passages });
assert.ok(result);
assert.deepEqual(result.safeIds, ["C1"]);
assert.equal(result.failures[0].claim_id, "C2");
assert.equal(result.failures[0].category, "context_needed");
console.log("Saved review replay: uncertainty is a grounded rejection, not an invalid response or an approval. No provider calls.");
