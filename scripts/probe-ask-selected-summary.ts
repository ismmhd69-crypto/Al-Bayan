// Owner-only component control. Never publishes an answer or bypasses its final audit.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { createRateLimiter } from "../lib/ai/limits";
import { withModelTransport } from "../lib/ai/transport";
import { snapshotSummaryChoices, selectedSummaryRequest, resolveSelectedSummary } from "../lib/ask/selected-summary";
import { recordedBlindReview } from "./inspect-ask-blind-review";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  const control = recordedBlindReview(), items = control.items.slice(0, 4);
  const question = JSON.parse(control.request.prompt).visitor_question;
  const snapshot = snapshotSummaryChoices(items, control.serialized, question, "ar"), request = selectedSummaryRequest(snapshot);
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json");
  const ledgerBytes = readFileSync(ledgerPath, "utf8"), ledger: CampaignLedger = JSON.parse(ledgerBytes);
  const model = "google/gemini-3.5-flash-lite", price = ledger.prices[model];
  if (!process.argv.includes("--reviewed-single-selection")) {
    // Same adapter and unchanged conservative guard formula, with a fake transport.
    let body: any;
    await withModelTransport(async (_url, init) => { body = JSON.parse(String(init.body)); return new Response(JSON.stringify({ choices: [{ message: { content: '{"selected_ids":["E2"]}' } }] }), { status: 200 }); },
      () => createOpenRouter("offline-no-credentials", model, createRateLimiter(1000, 100000)).generateJson(request));
    const messagesBytes = Buffer.byteLength(JSON.stringify(body.messages), "utf8");
    const reservation = Math.ceil((((messagesBytes + 4096) * price.prompt + body.max_tokens * price.completion) * 2 / 1e6 + price.request) * 1e9) / 1e9;
    if (readFileSync(ledgerPath, "utf8") !== ledgerBytes) throw Error("offline_measurement_changed_ledger");
    console.log(JSON.stringify({ status: "offline_only", claims: items.length, messagesBytes, outputAllowance: body.max_tokens, reservation, modelCalls: 0 })); return;
  }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("key_privacy_or_settings_changed");
  const path = resolve("work/private-ask-evaluation/selected-summary-single-control-20261024.json");
  const priorPath = resolve("work/private-ask-evaluation/grounded-writing-bound-context-controls-20261024.json"), priorBytes = readFileSync(priorPath, "utf8");
  if (existsSync(path) || ledger.stopped !== "grounded_writer_component_finished_review_required" || ledger.calls.some(c => c.cost === undefined)
    || JSON.parse(priorBytes).status !== "reviewed_fixed_components_do_not_activate") throw Error("prior_attempt_not_reviewed_or_control_exists");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(priorPath, "utf8") !== priorBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("spending_history_changed");
  const metadata = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!metadata.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await metadata.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > price[k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const before = guard.actual, startCall = ledger.calls.length;
  const report: any = { status: "prepared", model, scope: "One selection component on all four exact saved source-stage claims, including two independently unsafe claims. No filtering, new wording, model switch, final-check bypass, extra question, backup or retry.",
    traceHash: control.traceHash, requestHash: digest(JSON.stringify(request)), sourceClaims: items, originalsAndRestrictions: control.serialized,
    independentSupportedChoiceIds: ["E2", "E3"], independentUnsafeChoiceIds: ["E1", "E4"], snapshot, independentReview: "pending" };
  const save = () => { report.cost = guard.actual - before; report.calls = ledger.calls.slice(startCall); report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), started = Date.now();
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Continue the current-model repair goal within the unchanged remainder: one exact-sentence summary selection component on the four saved source claims. Unchanged full output allowance, privacy, price ceilings and reservation guard. No final-answer completion, publication, fallback, retry or added budget. Independently review inherited claims." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    report.raw = await withModelTransport(async (url, init) => {
      if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_selection_dispatch_forbidden"); sent = true;
      const reply = await dispatch(url, init); const data = await reply.clone().json() as any; report.providerOutput = data.choices?.[0]?.message?.content; save(); return reply;
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(request));
    report.resolved = resolveSelectedSummary(report.raw, snapshot, items, control.serialized);
    report.status = report.resolved.claims ? "settled_independent_review_required" : "invalid_response_do_not_activate";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "selection_failed"; }
  finally { ledger.stopped ??= "selected_summary_component_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, remainingAllowance: report.remainingAllowance, calls: report.calls.length, selectedIds: report.raw?.selected_ids, error: report.error }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "selection_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
