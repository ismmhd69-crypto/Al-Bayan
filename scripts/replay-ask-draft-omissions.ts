// Zero model/network calls. Replays only intact responses under their recorded
// strict envelope contracts; accepting an omission never approves religious meaning.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { isSingleSentence } from "../lib/ask/checks";
import { parseRichClaims } from "../lib/ask/rich-engine";
import type { EvidencePackage } from "../lib/ask/retrieval";
const rows: object[] = [], missing: string[] = [];
let intact = 0, unreadable = 0;
for (let round = 1; round <= 7; round++) {
  const report = JSON.parse(readFileSync(resolve(`work/private-ask-evaluation/arabic-quality-20261022-loop-${round}/report.json`), "utf8"));
  for (const attempt of report.rows) {
    const path = resolve(`work/local-ask-traces/${attempt.requestId}.jsonl`);
    if (!existsSync(path)) { missing.push(attempt.requestId); continue; }
    const requests = new Map<string, any>();
    for (const line of readFileSync(path, "utf8").trim().split("\n")) {
      const event = JSON.parse(line), d = event.data;
      if (d?.phase !== "draft") continue;
      if (event.event === "model_request") requests.set(d.call_id, d);
      if (event.event !== "model_response") continue;
      const request = requests.get(d.call_id);
      if (!request || !d.value || structuredOutputContract(request.schema).parse(JSON.stringify(d.value)) === null) { unreadable++; continue; }
      if (d.value.status !== "answer") continue;
      intact++;
      const prompt = typeof request.prompt === "string" ? JSON.parse(request.prompt) : request.prompt;
      for (const group of prompt.sections_to_write) {
        const claims = d.value[group];
        if (!Array.isArray(claims)) throw Error("recorded_contract_not_intact");
        const ids = prompt.citable_source_ids_by_section?.[group] ?? [];
        if (group !== "summary" && claims.length === 0 && ids.length) {
          // No religious claim is parsed here. Only the intentionally empty-array branch.
          const emptyPack = { passages: ids.map((id: string) => ({ id, source: { kind: group } })) } as unknown as EvidencePackage;
          const result = parseRichClaims(claims, group, emptyPack, prompt.answer_language === "Arabic" ? "ar" : "en");
          if (!Array.isArray(result) || result.length) throw Error("omission_replay_failed");
          rows.push({ round, case: attempt.id, call: d.call_id, group, change: "selected_empty_source_no_longer_claim_count_failure", approvedClaims: 0 });
        }
        for (let i = 0; i < claims.length; i++) {
          const text = claims[i].text;
          const oldBody = text.trim().replace(/[.!?؟。]+$/u, "");
          if (/[.!?؟;؛](\s|$)/u.test(oldBody) && isSingleSentence(text)) rows.push({ round, case: attempt.id, call: d.call_id, group, index: i,
            change: "semicolon_no_longer_false_sentence_failure", meaningApproved: false });
        }
      }
    }
  }
}
const result = { modelCalls: 0, intactWriterResponses: intact, unreadableSkipped: unreadable, missingTraces: missing,
  omittedGroups: rows.filter((r: any) => r.change.startsWith("selected_empty")).length,
  semicolonClaims: rows.filter((r: any) => r.change.startsWith("semicolon")).length, rows,
  scope: "Shape/omission replay only; no source meaning, completeness, runtime savings or live reliability approval." };
writeFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-omission-replay.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
