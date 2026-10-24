// One explicitly approved comparison. No website/model configuration changes.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { createRateLimiter } from "../lib/ai/limits";
import { withModelTransport } from "../lib/ai/transport";
import { parseMeaningReview } from "../lib/ask/meaning-review";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { ArabicCampaignGuard, sameAllowanceContinuation, digest, persistCampaign, campaignLock, type CampaignLedger } from "./ask-arabic-campaign-guard";

const MODELS = ["google/gemini-3.1-flash-lite", "mistralai/mistral-small-3.2-24b-instruct"];
async function main() {
  if (!process.argv.includes("--owner-approved-five-cents")) { console.log("No calls. Explicit approval required for one current-checker/backup comparison within $0.05."); return; }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("key_privacy_or_reasoning_changed");
  const bankPath = resolve("work/private-ask-evaluation/semantic-failure-regression-bank-v2-20261024.json"), bankBytes = readFileSync(bankPath, "utf8"), bank = JSON.parse(bankBytes);
  if (digest(JSON.stringify(bank)) !== "d995d59b334ae89da6699b43ec0cf9e3afdfc9496a22281a1be49143d6d6ea12" || bank.cases.length !== 12) throw Error("fixed_bank_changed");
  for (const c of bank.cases) { if (digest(JSON.stringify(c.request)) !== c.requestHash) throw Error("prepared_request_changed"); structuredOutputContract(c.request.schema); }
  const priorPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-attribution-spend.json"), priorBytes = readFileSync(priorPath, "utf8");
  const prior = JSON.parse(priorBytes), priorReport = JSON.parse(readFileSync("work/private-ask-evaluation/parents-attribution-full-retest-20261024.json", "utf8"));
  if (prior.stopped !== "parents_attribution_full_retest_20261024_finished_review_required" || priorReport.independentReview?.status !== "reviewed_contract_improvement_but_scope_error_and_incomplete_summary") throw Error("preceding_attempt_not_reviewed");
  const path = resolve("docs/ask-repair-runs/arabic-quality-20261024-semantic-comparison-spend.json"), reportPath = resolve("work/private-ask-evaluation/semantic-checker-comparison-20261024.json");
  if (existsSync(path) || existsSync(reportPath)) throw Error("comparison_already_prepared_or_attempted_no_auto_resume");
  const ledger = sameAllowanceContinuation(priorBytes, priorPath,
    "Mo explicitly approved Compare within 5 cents: one comparison of current Gemini checker and its configured Mistral backup on twelve fixed Arabic source checks, using existing evaluation funds. Overall ceiling preserved; maximum new actual-plus-pending exposure $0.05. No added budget, website switch, third model, retries after failure, full question or deployment. Expected labels local only; disputed applicability case excluded.");
  ledger.executionCap = Math.min(ledger.cap, ledger.priorExposure + .05);
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (readFileSync(bankPath, "utf8") !== bankBytes || digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash) return false;
    let p = ledger; const seen = new Set<string>();
    while (p.priorCampaign) {
      const ancestor = p.priorCampaign; if (seen.has(ancestor.path)) return false; seen.add(ancestor.path);
      const bytes = readFileSync(ancestor.path, "utf8"); if (digest(bytes) !== ancestor.hash) return false; p = JSON.parse(bytes);
    }
    return true;
  };
  if (!unchanged()) throw Error("historical_spending_or_bank_changed");
  for (const model of MODELS) {
    const res = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!res.ok) throw Error("price_metadata_unavailable");
    const endpoints = (await res.json() as any).data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6,
      completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(prices).some(([k,v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("provider_price_exceeds_existing_ceiling");
  }
  const fd = openSync(path, "wx", 0o600);
  try { writeFileSync(fd, JSON.stringify(ledger, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(path, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const report: any = { status: "prepared", bankHash: digest(JSON.stringify(bank)), bankBytesHash: digest(bankBytes), models: MODELS,
    scope: "Twelve fixed single-claim Arabic controls, current checker versus configured backup; six faithful/six defective, one disputed case excluded. Identical prepared request per pair, no expected labels sent. One comparison, maximum $0.05 new exposure, unchanged overall allowance/privacy. Not full questions or website activation.",
    results: [], cases: bank.cases.map((c: any) => ({ id: c.id, expected: c.expected, family: c.family, requestHash: c.requestHash })),
    independentReview: "pending", fiveCentExecutionCap: ledger.executionCap, inheritedExposure: ledger.priorExposure,
    overallCap: ledger.cap, unscoredCaseExcluded: true };
  const save = () => { report.calls = ledger.calls; report.actualCost = guard.actual; report.remainingGlobalAllowance = ledger.cap - guard.exposure;
    report.remainingExecutionAllowance = ledger.executionCap! - guard.exposure; persistCampaign(reportPath, report); };
  const release = campaignLock(original, ledger.originalLedgerHash);
  try {
    delete ledger.stopped; persistCampaign(path, ledger); report.status = "running"; save();
    const dispatch = guard.dispatch(fetch, unchanged);
    const noRetry: typeof dispatch = async (url, init) => {
      const body = JSON.parse(String(init.body)); if (!MODELS.includes(body.model)) throw Error("unexpected_comparison_model");
      const res = await dispatch(url, init);
      if (!res.ok) { ledger.stopped = "comparison_transport_rejected_no_retry"; persistCampaign(path, ledger); }
      return res;
    };
    const providers = MODELS.map(model => createOpenRouter(process.env.OPENROUTER_API_KEY!, model, createRateLimiter(1000, 1_000_000)));
    for (const c of bank.cases) {
      for (const [i, model] of MODELS.entries()) {
        const firstCall = ledger.calls.length, costBefore = guard.actual, started = Date.now();
        const raw = await withModelTransport(noRetry, () => providers[i].generateJson({ ...c.request, signal: new AbortController().signal }));
        const parsed = parseMeaningReview(raw, [c.item]);
        report.results.push({ id: c.id, model, expected: c.expected, raw, parsed, durationMs: Date.now() - started,
          actualCost: guard.actual - costBefore, callIndices: Array.from({ length: ledger.calls.length - firstCall }, (_, n) => firstCall + n) });
        save();
        if (!parsed) throw Error("comparison_response_invalid_stop");
      }
      console.log(JSON.stringify({ finishedCase: c.id, completedGenerations: report.results.length, actualCost: guard.actual }));
    }
    report.status = "finished_review_required";
  } catch (e) { report.status = "stopped"; report.error = e instanceof Error ? e.message : "comparison_failed"; }
  finally {
    ledger.stopped ??= "semantic_comparison_finished_review_required"; persistCampaign(path, ledger); save(); release();
  }
  console.log(JSON.stringify({ status: report.status, generations: ledger.calls.length, results: report.results.length, cost: guard.actual,
    remainingGlobalAllowance: report.remainingGlobalAllowance, error: report.error }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "comparison_setup_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
