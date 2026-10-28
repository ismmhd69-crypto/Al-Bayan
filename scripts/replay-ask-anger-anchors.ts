// Uses saved model decisions to verify the exact failed contract boundary.
// No new model judgment, source request, approval of theology or paid call.
import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { structuredOutputContract } from "../lib/ai/structured-output";

const id = "07036d70-117a-4d82-97c1-efb37804348c";
const root = "work/private-ask-evaluation/reliability-20261026/frozen-failures";
mkdirSync(root, { recursive: true });
const path = `${root}/${id}.jsonl`;
if (!existsSync(path)) copyFileSync(`work/local-ask-traces/${id}.jsonl`, path);
const bytes = readFileSync(path), rows = bytes.toString().trim().split("\n").map(line => JSON.parse(line));
const request = rows.find(r => r.event === "model_request" && r.data.call_id === "A22").data.prompt;
const raw = rows.find(r => r.event === "model_response" && r.data.call_id === "A22").data.value;
const items = request.claims.map((c: any) => ({ text: c.text, refs: c.originals.map((o: any) => o.source_id) }));
const serialized = { passages: [...new Map<string, any>(request.claims.flatMap((c: any) => c.originals.map((o: any) => [o.source_id, { id: o.source_id, arabic: o.arabic }]))).values()] };
const untouched = JSON.stringify(serialized);
assert.equal(parseMeaningReview(raw, items, serialized, true), null);
const nextRequest = meaningReviewRequest(items, serialized, new AbortController().signal, "anchored");
const input = JSON.parse(nextRequest.prompt);
const next: any = { meaning_contract: "condition_anchors_v3", claims: {} };
for (const c of input.claims) {
  const prior = raw.claims[c.claim_id];
  assert.equal(prior.verdict, "yes"); // Never convert a negative into approval.
  next.claims[c.claim_id] = { ...prior, finding: { category: "source_support", claim_quote: "", source_id: "", source_anchor_id: "" },
    condition_comparisons: prior.condition_comparisons.map((p: any) => {
      const anchors = c.condition_excerpt_choices.filter((a: any) => a.source_id === p.source_id);
      // Every original in this captured request fits one supplied excerpt. Do
      // not guess which chunk a historical response meant for longer originals.
      assert.equal(anchors.length, 1);
      assert.equal(anchors[0].original_excerpt, c.originals.find((o: any) => o.source_id === p.source_id).arabic);
      return { source_id: p.source_id, source_anchor_id: anchors[0].anchor_id, claim_excerpt: p.claim_excerpt, source_join: p.source_join, claim_join: p.claim_join };
    }) };
}
assert(structuredOutputContract(nextRequest.schema).parse(JSON.stringify(next)));
const checked = parseMeaningReview(next, items, serialized, "anchored");
assert.deepEqual(checked?.safeIds, ["C1", "C2", "C3"]);
assert.deepEqual(checked?.failures, []);
assert.equal(JSON.stringify(serialized), untouched);
const report = { modelCalls: 0, sourceCalls: 0, requestId: id, sha256: createHash("sha256").update(bytes).digest("hex"),
  legacyContractRejected: true, anchoredContractAcceptedSavedDecisions: true, originalsUnchanged: true,
  limitation: "Saved positive decisions only. Live model output and full-answer acceptance remain unverified." };
writeFileSync(`${root}/anger-anchor-replay.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
