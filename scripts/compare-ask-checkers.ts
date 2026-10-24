// Owner-only component comparison. Never changes website settings or model chains.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { isolatedMeaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { withModelTransport } from "../lib/ai/transport";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const models = ["google/gemini-3.1-flash-lite", "mistralai/mistral-small-3.2-24b-instruct"];
async function main() {
  const compatibilityRetest = process.argv.includes("--reviewed-backup-compatibility");
  const runModels = compatibilityRetest ? models.slice(1) : models;
  const bankPath = resolve("work/private-ask-evaluation/checker-comparison-cases-20261023.json"), bankBytes = readFileSync(bankPath, "utf8"), bank = JSON.parse(bankBytes);
  if (bank.cases.length !== 10 || new Set(bank.cases.map((c: any) => c.id)).size !== 10
    || bank.cases.filter((c: any) => c.expected === "support").length !== 6 || bank.cases.filter((c: any) => c.expected === "reject").length !== 4
    || bank.cases.some((c: any) => !c.text || !Array.isArray(c.refs) || c.refs.some((id: string) => !c.originals.some((s: any) => s.id === id && s.arabic))))
    throw Error("fixed_comparison_bank_invalid");
  if (!process.argv.includes("--owner-approved-backup-comparison")) {
    console.log(JSON.stringify({ status: "no_model_calls", cases: 10, supportedControls: 6, unsupportedControls: 4, models: runModels,
      maxLogicalCalls: 10 * runModels.length, bankHash: digest(bankBytes) })); return;
  }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("key_unavailable_or_privacy_changed");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const priorPath = resolve("work/private-ask-evaluation/relation-and-isolation-controls-20261023.json"), priorBytes = readFileSync(priorPath, "utf8"), prior = JSON.parse(priorBytes);
  if (ledger.stopped !== (compatibilityRetest ? "checker_comparison_finished_review_required" : "relation_controls_finished_review_required") || ledger.calls.some(c => c.cost === undefined)
    || prior.status !== "control_failure_do_not_activate" || prior.results.length !== 2 || prior.results[1].matched !== false
    || Math.abs(ledger.cap - ledger.priorExposure - .25) > 1e-9) throw Error("prior_experiment_or_existing_allowance_not_reviewed");
  const baselinePath = resolve("work/private-ask-evaluation/checker-comparison-20261023.json");
  const baselineBytes = compatibilityRetest ? readFileSync(baselinePath, "utf8") : undefined;
  const baseline = baselineBytes ? JSON.parse(baselineBytes) : undefined;
  if (compatibilityRetest && (baseline.bankHash !== digest(bankBytes) || baseline.results.length !== 20
    || baseline.results.filter((r: any) => r.model === models[1]).some((r: any) => r.status !== "error" || r.cost !== 0
      || r.calls.length !== 1 || r.calls[0].httpStatus !== 404 || r.calls[0].generationId))) throw Error("backup_compatibility_failure_not_proven");
  const reportPath = resolve(`work/private-ask-evaluation/${compatibilityRetest ? "checker-backup-compatibility" : "checker-comparison"}-20261023.json`);
  if (existsSync(reportPath)) throw Error("comparison_already_recorded_no_automatic_repeat");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(bankPath, "utf8") !== bankBytes
      || readFileSync(priorPath, "utf8") !== priorBytes || compatibilityRetest && readFileSync(baselinePath, "utf8") !== baselineBytes) return false;
    let current = ledger; const visited = new Set<string>();
    while (current.priorCampaign) {
      const p = current.priorCampaign; if (visited.has(p.path)) return false; visited.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; current = JSON.parse(bytes);
    }
    return true;
  };
  if (!unchanged()) throw Error("spending_history_changed");
  for (const model of models) {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!response.ok) throw Error("price_unavailable");
    const endpoints = (await response.json() as any).data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_unavailable");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const live = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6,
      completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(live).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof live] + 1e-10)) throw Error("price_ceiling_changed");
  }
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const costBefore = guard.actual;
  const report: any = { stage: "fixed_component_comparison_not_full_Ask_accuracy", bankHash: digest(bankBytes), models: runModels, cases: bank.cases,
    ...(compatibilityRetest ? { baselineComparisonHash: digest(baselineBytes!), unchangedPrimaryResults: baseline.results.filter((r: any) => r.model === models[0]) } : {}),
    authorization: compatibilityRetest ? "Continue Mo's explicitly approved same-ten-case backup comparison after all original backup requests were explicitly rejected before generation. One-variable transport repair omits unsupported optional reasoning for this pinned non-reasoning model. Preserve privacy, strict schema, prices/output/reservations and existing allowance. Reuse primary comparison results; do not pay for those again. Stop on first backup transport or format failure."
      : "Mo explicitly approved comparing current checker and configured backup on ten fixed Arabic cases within remaining allowance, no added budget or website model change.",
    status: "prepared", priorCampaignCost: costBefore, results: [] };
  const save = () => { report.cost = guard.actual - costBefore; report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(reportPath, report); };
  const release = campaignLock(original, ledger.originalLedgerHash);
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: report.authorization }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const guarded = guard.dispatch(fetch, unchanged); let currentModel: string | null = null, sent = false, consecutiveErrors = 0;
    await withModelTransport(async (url, init) => {
      const body = JSON.parse(String(init.body));
      if (!currentModel || body.model !== currentModel || sent) throw Error("comparison_retry_or_unplanned_model_not_authorized");
      sent = true; return guarded(url, init);
    }, async () => {
      outer: for (const c of bank.cases) for (const model of runModels) {
        currentModel = model; sent = false;
        const before = guard.actual, first = ledger.calls.length, start = Date.now(), items = [{ text: c.text, refs: c.refs }];
        const row: any = { caseId: c.id, model, expected: c.expected, status: "running" }; report.results.push(row); save();
        try {
          row.raw = await createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(
            isolatedMeaningReviewRequest(items[0], { passages: c.originals }, new AbortController().signal));
          row.result = parseMeaningReview(row.raw, items);
          row.status = row.result ? "reviewed" : "invalid_response";
          row.matched = row.result ? c.expected === "support" ? row.result.safeIds.length === 1 : row.result.failures.length === 1 : null;
        } catch (error) { row.status = "error"; row.error = error instanceof Error ? error.message : "unknown"; }
        finally { row.ms = Date.now() - start; row.cost = guard.actual - before; row.calls = ledger.calls.slice(first); save(); }
        consecutiveErrors = row.status === "error" || row.status === "invalid_response" ? consecutiveErrors + 1 : 0;
        console.log(JSON.stringify({ caseId: row.caseId, model, status: row.status, matched: row.matched, cost: row.cost }));
        if (ledger.stopped || ledger.calls.some(c => c.cost === undefined) || consecutiveErrors >= 3
          || compatibilityRetest && row.status !== "reviewed") break outer;
      }
    });
    report.status = report.results.length === 10 * runModels.length ? "comparison_finished_review_required" : "comparison_stopped_partial_review_required";
  } finally {
    ledger.stopped ??= compatibilityRetest ? "backup_compatibility_comparison_finished_review_required" : "checker_comparison_finished_review_required";
    persistCampaign(ledgerPath, ledger); save(); release();
  }
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "comparison_stopped"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
