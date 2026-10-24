// Offline whole-request identity verification. Installs a fake transport before any model call.
import { readFileSync, existsSync } from "node:fs";
import { createOpenRouter, reasoningOptions } from "../lib/ai/openrouter";
import { createRateLimiter } from "../lib/ai/limits";
import { withModelTransport } from "../lib/ai/transport";
import { isolatedMeaningReviewRequest } from "../lib/ask/meaning-review";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

async function main() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  const bank = JSON.parse(readFileSync("work/private-ask-evaluation/checker-comparison-cases-20261023.json", "utf8"));
  const before = JSON.parse(readFileSync("work/private-ask-evaluation/checker-comparison-20261023.json", "utf8"));
  const after = JSON.parse(readFileSync("work/private-ask-evaluation/checker-backup-compatibility-20261023.json", "utf8"));
  const model = "mistralai/mistral-small-3.2-24b-instruct", results = [];
  for (const c of bank.cases) {
    let body = "";
    await withModelTransport(async (_url, init) => {
      body = String(init.body);
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: '{"claims":{"C1":{"verdict":"yes","explanation":""}}}' } }] });
    }, () => createOpenRouter("offline-no-secret", model, createRateLimiter(100, 100)).generateJson(
      isolatedMeaningReviewRequest({ text: c.text, refs: c.refs }, { passages: c.originals }, new AbortController().signal)));
    const current = JSON.parse(body);
    const original = JSON.stringify({ ...current, ...reasoningOptions() });
    const oldReceipt = before.results.find((r: any) => r.caseId === c.id && r.model === model)?.calls[0];
    const newReceipt = after.results.find((r: any) => r.caseId === c.id && r.model === model)?.calls[0];
    const row = { caseId: c.id, exactNewRequest: digest(body) === newReceipt?.fingerprint,
      exactOldRequestWithOnlyReasoningRestored: digest(original) === oldReceipt?.fingerprint,
      privacyAndStrictnessPreserved: current.provider.zdr === true && current.provider.data_collection === "deny"
        && current.provider.require_parameters === true && current.response_format.type === "json_schema", modelCallsPaid: 0 };
    results.push(row);
  }
  persistCampaign("work/private-ask-evaluation/checker-compatibility-request-identity-20261023.json", { offline: true, results });
  if (results.some(r => !r.exactNewRequest || !r.exactOldRequestWithOnlyReasoningRestored || !r.privacyAndStrictnessPreserved)) throw Error("whole_request_comparison_failed");
  console.log(JSON.stringify({ verifiedPairs: results.length, changedField: "reasoning", privacyAndStrictnessPreserved: true, paidCalls: 0 }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "offline verification failed"); process.exitCode = 1; });
