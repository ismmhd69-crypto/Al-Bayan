// Controlled preview worker. No detached HTTP promise or automatic retry of an uncertain bill.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { installSpendGuard } from "./ask-spend-guard";
import { sharedAskLedgerPath } from "./ask-test-profile";
import { researchEngineRevision } from "../lib/ask/search-engine/job-policy";

async function main() {
  for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
  if (process.env.ASK_DURABLE_ENABLED !== "true" || process.env.ASK_JOB_WORKER_ACCEPTED !== "true"
    || process.env.ASK_ENABLED !== "true" || process.env.ASK_RICH_ENABLED !== "true") throw new Error("Research worker is disabled pending preview acceptance.");
  const durationMs = Number(process.env.ASK_JOB_MAX_DURATION_MS), maxAttemptCostUsd = Number(process.env.ASK_JOB_MAX_ATTEMPT_USD);
  if (!Number.isInteger(durationMs) || durationMs < 60_000 || durationMs > 600_000 || !Number.isFinite(maxAttemptCostUsd) || maxAttemptCostUsd <= 0 || maxAttemptCostUsd > 1.5) {
    throw new Error("Configure an accepted research duration and model-call reservation before starting.");
  }
  const engineRevision = researchEngineRevision();
  // Includes actual reserve/settle interception for every new OpenRouter HTTP request. Checking
  // the ledger once without intercepting later requests would bypass the shared evaluation cap.
  const budget = installSpendGuard(sharedAskLedgerPath());
  const stopping = new AbortController();
  const stop = () => stopping.abort();
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  try {
    const { getProvider, getVerifier } = await import("../lib/ai");
    if (![getProvider().id, getVerifier().id].every(chain => chain.split("|fallback:").every(id => id.startsWith("openrouter/")))) {
      throw new Error("The preview spending guard does not cover these provider chains.");
    }
    const { serverResearchJobs } = await import("../lib/ask/search-engine/server-jobs");
    const { runNextResearchJob } = await import("../lib/ask/search-engine/job-worker");
    const { ask } = await import("../lib/ask/pipeline");
    const store = serverResearchJobs();
    let nextPrune = 0;
    while (!stopping.signal.aborted) {
      if (Date.now() >= nextPrune) { await store.prune(); nextPrune = Date.now() + 60_000; }
      const result = await runNextResearchJob({ store, engineRevision, durationMs, maxAttemptCostUsd, signal: stopping.signal,
        execute: (request, rich, signal) => ask(request.question, request.lang, undefined, request.previous_user_messages, { rich, signal }) });
      if (result !== "idle") console.info(JSON.stringify({ component: "ask_preview_worker", outcome: result }));
      if (budget.guard.ledger.stopped || budget.guard.ledger.entries.some(e => e.cost === undefined)) throw new Error("Billing needs reconciliation. The research worker has stopped.");
      if (process.argv.includes("--once")) break;
      if (result === "idle") await delay(1000, undefined, { signal: stopping.signal }).catch(() => {});
    }
  } finally {
    stopping.abort(); process.off("SIGINT", stop); process.off("SIGTERM", stop); budget.close();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : "Research worker stopped."); process.exitCode = 1; });
}
