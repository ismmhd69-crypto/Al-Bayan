// One fresh owner-authorized R01 attempt on the active website pipeline.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ARABIC_CASES } from "./ask-arabic-quality-cases";
import { ArabicCampaignGuard, CURRENT_MODELS, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
import { withModelTransport } from "../lib/ai/transport";

async function main() {
  if (!process.argv.includes("--reviewed-one-attempt")) { console.log("No model calls. One Arabic R01 test; existing allowance only."); return; }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_TRACE: "true", ASK_DEBUG: "true" });
  if ((process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("privacy_or_reasoning_changed");
  for (const name of ["ASK_PATIENT_ENABLED", "ASK_DURABLE_ENABLED", "ASK_FOCUSED_CHECKS", "ASK_DISTINCT_SELECTION"]) if (process.env[name] === "true") throw Error("experimental_website_path_enabled");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const reportPath = resolve("work/private-ask-evaluation/discovery-priority-full-retest-20261023.json");
  if (existsSync(reportPath) || ledger.stopped !== "medium_reasoning_controls_finished_review_required" || ledger.calls.some(c => c.cost === undefined)) throw Error("prior_spending_not_reviewed_or_attempt_already_exists");
  const sourceReplay = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/adjacent-priority-live-20261023.json"), "utf8"));
  if (sourceReplay.status !== "live_original_identity_verified_not_selected_or_answered" || !sourceReplay.liveDiscoveredIds.includes("Q51:57") || sourceReplay.modelCalls !== 0) throw Error("source_repair_not_verified");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("historical_spending_changed");
  for (const model of CURRENT_MODELS) {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!response.ok) throw Error("price_metadata_unavailable");
    const endpoints = (await response.json() as any).data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  }
  const { getProvider, getVerifier } = await import("../lib/ai");
  const models = { writer: getProvider().id, checker: getVerifier().id };
  if (models.writer !== "openrouter/google/gemini-3.5-flash-lite|fallback:openrouter/google/gemini-3.8-flash" || models.checker !== "openrouter/google/gemini-3.1-flash-lite|fallback:openrouter/mistralai/mistral-small-3.2-24b-instruct") throw Error("current_models_changed");
  const { ask } = await import("../lib/ask/pipeline");
  const { withAskRequest } = await import("../lib/ask/trace-context");
  const item = ARABIC_CASES.find(c => c.id === "R01")!;
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const startCost = guard.actual, firstCall = ledger.calls.length, started = Date.now();
  const report: any = { id: item.id, question: item.question, concerns: item.concerns, qualification: item.qualification, status: "prepared", requestId: randomUUID(), models,
    scope: "One fresh full Arabic R01 attempt, current website rich path, live source research, prepared reuse disabled, no artificial total cutoff, no new allowance or experimental checker changes.",
    revisionHashes: Object.fromEntries(["lib/ask/core.ts", "lib/ask/search-engine/adjacent-quran-discovery.ts", "lib/ai/openrouter.ts", "lib/ask/rich-engine.ts", "lib/ask/meaning-review.ts"].map(p => [p, digest(readFileSync(resolve(p), "utf8"))])),
    firstCheckedMs: null, sections: [], diagnostics: [], withdrawn: false, independentReview: "pending" };
  const save = () => { report.cost = guard.actual - startCost; report.remainingAllowance = ledger.cap - guard.exposure; report.combinedExposure = guard.exposure; report.calls = ledger.calls.slice(firstCall); persistCampaign(reportPath, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), oldInfo = console.info;
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Mo resumed the current-model repair/test goal. One fresh R01 attempt after relevance-prioritized bounded neighbour discovery, which reproduces the recorded missing-original defect offline and verifies fresh original identity. Existing allowance, ancestors, unresolved reservation, full per-call reservations and all settings preserved; no automatic repeat, deployment or new budget." }];
    delete ledger.stopped;
    ledger.evaluationCases = [...(ledger.evaluationCases ?? []), { id: item.id, requestId: report.requestId, reportPath, revisionHash: digest(JSON.stringify(report.revisionHashes)), review: "pending" }]; persistCampaign(ledgerPath, ledger);
    let transportFailures = 0; const dispatch = guard.dispatch(fetch, unchanged);
    const boundedDispatch: typeof dispatch = async (url, init) => {
      if (transportFailures >= 3) throw Error("three_consecutive_transport_failures");
      const response = await dispatch(url, init); transportFailures = response.ok ? 0 : transportFailures + 1; return response;
    };
    console.info = (message: unknown) => { const line = String(message); if (line.startsWith("ask diagnostic: ")) { try { report.diagnostics.push(JSON.parse(line.slice(16))); } catch {} } };
    report.status = "running"; save();
    const result = await withModelTransport(boundedDispatch, () => withAskRequest(report.requestId, () => ask(item.question, "ar", { onFrame: () => {} }, item.history ?? [], { rich: {
      onSection: section => { if (section.outcome === "ready" && report.firstCheckedMs === null) report.firstCheckedMs = Date.now() - started; report.sections.push(section); save(); },
      onWithdraw: () => { report.withdrawn = true; save(); },
    } })));
    report.result = result; report.status = result.status;
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "test_failed"; }
  finally {
    console.info = oldInfo; report.totalMs = Date.now() - started;
    ledger.stopped ??= "discovery_priority_full_retest_finished_review_required"; persistCampaign(ledgerPath, ledger); save(); release();
  }
  console.log(JSON.stringify({ status: report.status, firstCheckedMs: report.firstCheckedMs, totalMs: report.totalMs, cost: report.cost, remainingAllowance: report.remainingAllowance, calls: report.calls.length, sections: report.sections.map((s: any) => `${s.group}:${s.outcome}`), error: report.error }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "retest_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
