// Private saved-response replay. No provider calls, remote reads or billing changes.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { sourceCopyMatch } from "../lib/ask/checks";
import { researchFailure } from "../lib/ask/research-failure";

const root = "work/private-ask-evaluation/reliability-20261026/frozen-failures";
const ids = ["fb25f220-1e24-4398-b387-2886cfd1ceb7", "9a30f146-863d-4fae-9a45-82c2516dcd1f", "e2733bf1-5003-46c9-9321-b27003c8632b"];
const reports = ids.map(id => {
  const bytes = readFileSync(`${root}/${id}.jsonl`), rows = bytes.toString().trim().split("\n").map(line => JSON.parse(line));
  const result = rows.find(r => r.event === "terminal_result")?.data;
  assert(result);
  const interrupted = rows.find(r => r.event === "model_failed" && r.data.error?.name === "ResponseAborted");
  const copies: unknown[] = [];
  for (const row of rows.filter(r => r.event === "model_response" && r.data.phase === "summary")) {
    const request = rows.find(r => r.event === "model_request" && r.data.call_id === row.data.call_id)?.data.prompt;
    const originals = (request?.evidence_package?.passages ?? []).map((p: any) => ({ id: p.id, kind: p.type, arabic: p.arabic, translations: { en: p.translation_en } }));
    for (const claim of row.data.value?.summary ?? []) {
      const match = sourceCopyMatch(claim.text, originals);
      if (match) copies.push({ call: row.data.call_id, ...match });
    }
  }
  if (id === ids[0]) assert(copies.some((m: any) => m.sourceId === "Q30:30" && m.normalizedMatch === "the natural disposition god instilled in"));
  if (id === ids[1]) assert.equal(researchFailure(interrupted?.data.error), "connection_interrupted");
  if (id === ids[2]) assert.equal(result.status, "rich_answer");
  return { id, sha256: createHash("sha256").update(bytes).digest("hex"), originalStatus: result.status,
    decisiveReason: interrupted ? researchFailure(interrupted.data.error) : copies.length ? "wording_rejected" : "complete", copies };
});
writeFileSync(`${root}/replay-report.json`, JSON.stringify({ modelCalls: 0, reports }, null, 2));
console.log(JSON.stringify({ modelCalls: 0, reports }, null, 2));
