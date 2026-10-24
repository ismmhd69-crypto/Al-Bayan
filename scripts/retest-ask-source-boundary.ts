// One explicitly approved Arabic R03 retest after source-boundary repairs. Extra allowance <= $0.25; preserve all earlier exposure.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ARABIC_CASES } from "./ask-arabic-quality-cases";
import { ArabicCampaignGuard, sameAllowanceContinuation, CURRENT_MODELS, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
import { withModelTransport } from "../lib/ai/transport";

async function main() {
  if (!process.argv.includes("--owner-approved-extra-025-one-retest")) { console.log("No model calls. One Arabic R03 source-boundary retest; prior remainder plus at most $0.25, all earlier exposure retained."); return; }
  const caseId = "R03";
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_TRACE: "true", ASK_DEBUG: "true" });
  if ((process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("privacy_or_reasoning_changed");
  for (const name of ["ASK_PATIENT_ENABLED", "ASK_DURABLE_ENABLED", "ASK_FOCUSED_CHECKS", "ASK_DISTINCT_SELECTION"]) if (process.env[name] === "true") throw Error("experimental_website_path_enabled");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-source-boundary-retest-spend.json");
  if (!existsSync(ledgerPath)) {
    const previousPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-meaning-quality-live-spend.json"), bytes = readFileSync(previousPath, "utf8");
    const previous = JSON.parse(bytes);
    if (previous.stopped !== "meaning_quality_source_review_failed_stop_sample" || previous.evaluationCases?.some((c: any) => c.review === "pending")) throw Error("previous_attempt_not_reviewed");
    const next = sameAllowanceContinuation(bytes, previousPath, "Mo explicitly approved Allow up to 25 cents more for ONE full Arabic R03 parents retest after the offline source-boundary fixes, then review and report. Increase the overall cap by $0.25 only. Preserve the old remainder, all prior charges and unresolved exposure. Same models, privacy and source boundaries; no comparisons, automatic repeat, further case, deployment or unlimited retries.");
    next.cap = previous.cap + .25;
    next.executionCap = next.cap;
    const fd = openSync(ledgerPath, "wx", 0o600);
    try { writeFileSync(fd, JSON.stringify(next, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
  }
  const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const reportPath = resolve(`work/private-ask-evaluation/source-boundary-full-retest-${caseId}-20261024.json`);
  if (existsSync(reportPath) || ledger.stopped !== "reviewed_continuation_prepared" || ledger.calls.some(c => c.cost === undefined)) throw Error("prior_spending_not_reviewed_or_attempt_already_exists");
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
  const item = ARABIC_CASES.find(c => c.id === caseId)!;
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const startCost = guard.actual, firstCall = ledger.calls.length, started = Date.now();
  const report: any = { id: item.id, question: item.question, concerns: item.concerns, qualification: item.qualification, status: "prepared", requestId: randomUUID(), models,
    scope: "One full Arabic R03 retest of source-boundary repairs. Active website rich pipeline with live retrieval, trace disables prepared reuse, current models/privacy and no artificial total cutoff. Extra allowance at most $0.25; all prior exposure retained. One attempt only, then independent source review and report.",
    revisionHashes: Object.fromEntries(["lib/ask/core.ts", "lib/ask/rich-engine.ts", "lib/ask/meaning-review.ts", "lib/ask/review-findings.ts", "lib/ask/source-boundary-guards.ts", "lib/ask/source-writing-boundary.ts", "lib/ask/approved-context.ts", "lib/ask/rich-review-request.ts"].map(p => [p, digest(readFileSync(resolve(p), "utf8"))])),
    firstCheckedMs: null, sections: [], diagnostics: [], withdrawn: false, independentReview: "pending" };
  const save = () => { report.cost = guard.actual - startCost; report.remainingAllowance = ledger.cap - guard.exposure; report.combinedExposure = guard.exposure; report.calls = ledger.calls.slice(firstCall); persistCampaign(reportPath, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), oldInfo = console.info;
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Execute one owner-approved Arabic parents retest after source-boundary repairs; extra allowance at most $0.25, earlier exposure retained, then review and stop." }];
    delete ledger.stopped;
    ledger.evaluationCases = [...(ledger.evaluationCases ?? []), { id: item.id, requestId: report.requestId, reportPath, revisionHash: digest(JSON.stringify(report.revisionHashes)), review: "pending" }]; persistCampaign(ledgerPath, ledger);
    let transportFailures = 0; const dispatch = guard.dispatch(fetch, unchanged);
    const boundedDispatch: typeof dispatch = async (url, init) => {
      if (transportFailures >= 3) throw Error("three_consecutive_transport_failures");
      const response = await dispatch(url, init); transportFailures = response.ok ? 0 : transportFailures + 1; return response;
    };
    console.info = (message: unknown) => { const line = String(message); if (line.startsWith("ask diagnostic: ")) { try { report.diagnostics.push(JSON.parse(line.slice(16))); } catch {} } };
    report.status = "running"; save();
    const result = await withModelTransport(boundedDispatch, () => withAskRequest(report.requestId, () => ask(item.question, "ar", { onFrame: () => {} }, item.history ?? [], { signal: new AbortController().signal, rich: {
      onSection: section => { if (section.outcome === "ready" && report.firstCheckedMs === null) report.firstCheckedMs = Date.now() - started; report.sections.push(section); save(); },
      onWithdraw: () => { report.withdrawn = true; save(); },
    } })));
    report.result = result; report.status = result.status;
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "test_failed"; }
  finally {
    console.info = oldInfo; report.totalMs = Date.now() - started;
    ledger.stopped ??= `source_boundary_${caseId}_finished_review_required`; persistCampaign(ledgerPath, ledger); save(); release();
  }
  console.log(JSON.stringify({ status: report.status, firstCheckedMs: report.firstCheckedMs, totalMs: report.totalMs, cost: report.cost, remainingAllowance: report.remainingAllowance, calls: report.calls.length, sections: report.sections.map((s: any) => `${s.group}:${s.outcome}`), error: report.error }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "retest_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
