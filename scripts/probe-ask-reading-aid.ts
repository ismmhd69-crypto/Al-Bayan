// Owner-only control. No website changes, retries or new models.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { readingAidReviewRequest } from "../lib/ask/reading-aid-review";
import { parseMeaningReview } from "../lib/ask/meaning-review";
import { isolatedMeaningReviewRequest } from "../lib/ask/meaning-review";
import { deliberateMeaningRequest, parseDeliberateMeaning } from "../lib/ask/deliberate-meaning-review";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  const temperatureMode = process.argv.includes("--reviewed-temperature-controls");
  const deliberateMode = process.argv.includes("--reviewed-deliberate-controls");
  const contractRepair = process.argv.includes("--reviewed-local-contract-repair");
  const deliberateBackup = process.argv.includes("--reviewed-deliberate-backup-controls");
  const mediumMode = process.argv.includes("--reviewed-medium-reasoning-controls");
  const bankPath = resolve("work/private-ask-evaluation/checker-comparison-cases-20261023.json"), bytes = readFileSync(bankPath, "utf8"), bank = JSON.parse(bytes);
  const baselinePath = resolve("work/private-ask-evaluation/checker-backup-compatibility-20261023.json"), baselineBytes = readFileSync(baselinePath, "utf8"), baseline = JSON.parse(baselineBytes);
  const model = mediumMode || deliberateMode && !deliberateBackup ? "google/gemini-3.1-flash-lite" : "mistralai/mistral-small-3.2-24b-instruct";
  if (digest(bytes) !== "b301fcd1f80c611de46fc66185250554d5c8fcb9fd3d0ccb2c86d996989aaaf3"
    || baseline.status !== "reviewed_fixed_component_comparison" || baseline.results.length !== 10) throw Error("fixed_control_or_review_changed");
  if (!process.argv.includes("--reviewed-reading-aid-controls") && !temperatureMode && !deliberateMode && !mediumMode) {
    console.log(JSON.stringify({ status: "no_model_calls", model, cases: 10, bankHash: digest(bytes) })); return;
  }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("key_or_privacy_changed");
  if (mediumMode) process.env.OPENROUTER_REASONING = "medium"; // This owner process only.
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  if (ledger.stopped !== (mediumMode ? "deliberate_meaning_controls_finished_review_required" : deliberateMode ? contractRepair ? "deliberate_meaning_controls_finished_review_required" : "temperature_controls_finished_review_required" : temperatureMode ? "reading_aid_controls_finished_review_required" : "bounded_rewrite_controls_finished_review_required") || ledger.calls.some(c => c.cost === undefined)) throw Error("prior_spending_not_reviewed");
  const primaryPath = resolve("work/private-ask-evaluation/checker-comparison-20261023.json");
  const primaryBytes = readFileSync(primaryPath, "utf8"), primary = JSON.parse(primaryBytes);
  if (mediumMode && JSON.parse(readFileSync(resolve("work/private-ask-evaluation/deliberate-meaning-backup-controls-20261023.json"), "utf8")).status !== "failed_do_not_activate") throw Error("backup_analysis_failure_not_reviewed");
  if (contractRepair) {
    const prior = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/deliberate-meaning-controls-20261023.json"), "utf8"));
    if (!deliberateMode || prior.results.length !== 1 || prior.results[0].error !== "structured_schema_invalid" || prior.results[0].calls.length || prior.cost !== 0) throw Error("local_non_dispatch_not_verified");
  }
  if (deliberateBackup) {
    const failed = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/deliberate-meaning-validated-controls-20261023.json"), "utf8"));
    if (!deliberateMode || failed.results.length !== 1 || failed.results[0].status !== "invalid_response" || failed.results[0].calls.length !== 1) throw Error("primary_contract_failure_not_reviewed");
  }
  if (temperatureMode && JSON.parse(readFileSync(resolve("work/private-ask-evaluation/reading-aid-controls-20261023.json"), "utf8")).status !== "failed_do_not_activate") throw Error("reading_aid_failure_not_reviewed");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(bankPath, "utf8") !== bytes || readFileSync(baselinePath, "utf8") !== baselineBytes || readFileSync(primaryPath, "utf8") !== primaryBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const data = readFileSync(p.path, "utf8"); if (digest(data) !== p.hash) return false; parent = JSON.parse(data); }
    return true;
  };
  if (!unchanged()) throw Error("spending_history_changed");
  const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!response.ok) throw Error("price_unavailable");
  const endpoints = (await response.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_unavailable");
  if (temperatureMode && endpoints.some((e: any) => !e.supported_parameters?.includes("temperature"))) throw Error("temperature_not_advertised");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const path = resolve(`work/private-ask-evaluation/${mediumMode ? "medium-reasoning" : deliberateMode ? deliberateBackup ? "deliberate-meaning-backup" : contractRepair ? "deliberate-meaning-validated" : "deliberate-meaning" : temperatureMode ? "temperature" : "reading-aid"}-controls-20261023.json`);
  if (existsSync(path)) throw Error("already_recorded_no_repeat");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure }), before = guard.actual;
  const report: any = { status: "prepared", stage: mediumMode ? "medium_reasoning_only_not_Ask_accuracy" : deliberateMode ? "analysis_first_arabic_meaning_not_Ask_accuracy" : temperatureMode ? "temperature_only_component_control_not_Ask_accuracy" : "reading_aid_component_control_not_Ask_accuracy", model, bankHash: digest(bytes), baselineHash: digest(baselineBytes), primaryHash: digest(primaryBytes), cases: bank.cases, results: [] };
  const save = () => { report.cost = guard.actual - before; report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash);
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: mediumMode
      ? "Continue Mo's current-model repair/test goal within unchanged remaining allowance: at most ten fixed Arabic controls on current Gemini checker changing only reasoning effort low to medium, verified against entire saved baseline transport fingerprints. Same prompt/schema/output limit, privacy and models; no experimental reading aid or analysis-first prompt. No website change, retry or added budget. Stop on first unsupported acceptance or format/transport failure."
      : deliberateMode
      ? `Continue Mo's current-model repair/test goal within unchanged remaining allowance: at most ten fixed-bank Arabic analysis-before-verdict checks by ${model}, same exact originals, no reading aid or temperature override. Primary unreadable response remains rejected whole; no primary rerun. No website activation, new model, retry, full-question rerun or added budget. Stop on first unsupported acceptance or transport/format failure. Require independent review and fresh controls before any activation.`
      : temperatureMode
      ? "Continue Mo's current-model repair/test goal within unchanged remaining allowance: ten same-bank Mistral controls changing only temperature to zero, keeping baseline exact request fingerprint after removing that one field. No reading aid or other prompt changes. At most one dispatch per case; stop on first unsupported acceptance or transport/format failure. No full-question rerun, new model or additional budget. Independently review results before retaining settings change."
      : "Mo resumed current-model repair/test goal. At most ten sequential fixed-bank compatibility controls with configured Mistral backup within existing remaining allowance. Add deterministic reading aid alongside unchanged exact originals; no website activation, new model, retry or full-question rerun. Stop on first unsupported acceptance or transport/format failure. Independently review results." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const guarded = guard.dispatch(fetch, unchanged); let sent = false, currentCase = "", activeRow: any;
    await withModelTransport(async (url, init) => {
      const body = JSON.parse(String(init.body));
      if (sent || body.model !== model) throw Error("unplanned_probe_retry");
      if (temperatureMode) {
        if (body.temperature !== 0) throw Error("temperature_control_missing");
        delete body.temperature;
        const prior = baseline.results.find((r: any) => r.caseId === currentCase);
        if (digest(JSON.stringify(body)) !== prior?.calls?.[0]?.fingerprint) throw Error("temperature_not_only_change");
      }
      if (mediumMode) {
        if (body.reasoning?.effort !== "medium") throw Error("medium_control_missing");
        body.reasoning.effort = "low";
        const prior = primary.results.find((r: any) => r.caseId === currentCase && r.model === model);
        if (digest(JSON.stringify(body)) !== prior?.calls?.[0]?.fingerprint) throw Error("reasoning_not_only_change");
      }
      sent = true;
      const response = await guarded(url, init);
      // Artificial owner controls only. Preserve rejected complete output for
      // diagnosis without accepting, editing or logging it on the visitor path.
      const data = await response.clone().json() as any;
      activeRow.providerOutput = data.choices?.[0]?.message?.content;
      save();
      return response;
    }, async () => {
      for (const c of deliberateMode || mediumMode ? ["C05", "C04", "C06", "C02", "C03", "C01", "C07", "C08", "C09", "C10"].map(id => bank.cases.find((c: any) => c.id === id)) : bank.cases) {
        sent = false; currentCase = c.id; const start = Date.now(), startCost = guard.actual, startCall = ledger.calls.length, row: any = { id: c.id, expected: c.expected, status: "running" }; activeRow = row; report.results.push(row); save();
        try {
          const item = { text: c.text, refs: c.refs };
          row.raw = await createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(deliberateMode
            ? deliberateMeaningRequest(item, c.originals, new AbortController().signal)
            : (temperatureMode || mediumMode ? isolatedMeaningReviewRequest : readingAidReviewRequest)(item, { passages: c.originals }, new AbortController().signal));
          if (mediumMode) row.onlyTransportChange = "reasoning.effort:medium_verified_against_baseline_fingerprint";
          if (temperatureMode) row.onlyTransportChange = "temperature:0_verified_against_baseline_fingerprint";
          row.result = deliberateMode ? parseDeliberateMeaning(row.raw, item) : parseMeaningReview(row.raw, [item]); row.status = row.result ? "reviewed" : "invalid_response";
          row.matched = !!row.result && (row.result.safeIds.length === 1) === (c.expected === "support");
        } catch (e) { row.status = "error"; row.error = e instanceof Error ? e.message : "probe_failed"; }
        finally { row.ms = Date.now() - start; row.cost = guard.actual - startCost; row.calls = ledger.calls.slice(startCall); save(); }
        console.log(JSON.stringify({ id: row.id, matched: row.matched, result: row.result, cost: row.cost }));
        if (row.status !== "reviewed" || c.expected === "reject" && !row.matched || ledger.stopped) break;
      }
    });
    report.status = report.results.length === 10 && report.results.every((r: any) => r.matched) ? "fixed_controls_passed_independent_and_heldout_review_required" : "failed_do_not_activate";
  } finally { ledger.stopped ??= mediumMode ? "medium_reasoning_controls_finished_review_required" : deliberateMode ? "deliberate_meaning_controls_finished_review_required" : temperatureMode ? "temperature_controls_finished_review_required" : "reading_aid_controls_finished_review_required"; persistCampaign(ledgerPath, ledger); save(); release(); }
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "probe_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
