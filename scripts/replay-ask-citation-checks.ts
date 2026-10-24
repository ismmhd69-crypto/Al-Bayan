// No model or network calls. Replay retained private responses; persist only finding codes/IDs.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeRichReview } from "../lib/ask/rich-review-request";
import { checkCitationBindings } from "../lib/ask/citation-check";
import { persistCampaign } from "./ask-arabic-campaign-guard";
const root = process.argv.find(a => a.startsWith("--root="))?.slice(7);
if (!root) throw new Error("explicit_private_report_root_required");
const report = JSON.parse(readFileSync(resolve(root, "report.json"), "utf8"));
const rows: object[] = [];
for (const row of report.rows) {
  const requests = new Map<string, any>();
  for (const line of readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8").trim().split("\n")) {
    const event = JSON.parse(line), data = event.data;
    if (data.phase !== "screening") continue;
    if (event.event === "model_request") requests.set(data.call_id, typeof data.prompt === "string" ? JSON.parse(data.prompt) : data.prompt);
    if (event.event !== "model_response" || !requests.has(data.call_id)) continue;
    const request = requests.get(data.call_id);
    const items = request.claims.map((c: any) => ({ text: c.claim, refs: c.source_ids, requirementId: c.requirement_id }));
    const originals = [...new Map<string, { id: string; arabic: string }>(request.claim_evidence.flatMap((b: any) => b.cited_originals).map((p: any) => [p.id, { id: p.id, arabic: p.arabic }])).values()];
    const result = checkCitationBindings(normalizeRichReview(data.value, items, { passages: originals }), items, originals);
    rows.push({ case: row.id, call: data.call_id, full: request.full_answer, blocked: result.blocked,
      failures: result.failures.map(f => ({ claim: f.claim_id, code: f.code, source: f.source_id })) });
  }
}
persistCampaign(resolve(root, "citation-repair-replay.json"), { modelCalls: 0, rows });
console.log(JSON.stringify({ modelCalls: 0, checks: rows.length, rows }));
