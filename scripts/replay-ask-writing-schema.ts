// Private recorded-response replay only. No network, models or original-text persistence.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { richWritingClaimsSchema } from "../lib/ask/rich-writing-schema";
import { referenceRepairFeedback } from "../lib/ask/correction-feedback";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { persistCampaign } from "./ask-arabic-campaign-guard";
const root = process.argv.find(a => a.startsWith("--root="))?.slice(7);
if (!root) throw new Error("explicit_private_report_root_required");
const report = JSON.parse(readFileSync(resolve(root, "report.json"), "utf8"));
const rows: object[] = [];
for (const row of report.rows) {
  const requests = new Map<string, any>();
  for (const line of readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8").trim().split("\n")) {
    const event = JSON.parse(line), data = event.data;
    if (data.phase !== "draft") continue;
    if (event.event === "model_request") requests.set(data.call_id, data);
    if (event.event !== "model_response" || !requests.has(data.call_id)) continue;
    const req = requests.get(data.call_id), input = typeof req.prompt === "string" ? JSON.parse(req.prompt) : req.prompt;
    const schema = structuredClone(req.schema), groups = input.sections_to_write;
    for (const group of groups) schema.properties[group] = richWritingClaimsSchema(input.citable_source_ids_by_section[group],
      input.evidence_package.question.requirements.map((r: { id: string }) => r.id), group === "summary");
    const accepted = structuredOutputContract(schema).parse(JSON.stringify(data.value)) !== null;
    const references = referenceRepairFeedback(data.value, groups, input.citable_source_ids_by_section);
    rows.push({ case: row.id, call: data.call_id, responseAcceptedByIdentityContract: accepted,
      unknownReferences: references.map(f => ({ group: f.group, ids: f.unknown_source_ids })),
      evidenceApproval: false });
  }
}
persistCampaign(resolve(root, "writing-identity-replay.json"), { modelCalls: 0, cost: 0, note: "Identity/shape replay, not a new generated answer or semantic approval", rows });
console.log(JSON.stringify({ modelCalls: 0, cost: 0, rows }));
