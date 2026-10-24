// One owner-authorized checking component call; never publishes or completes an answer.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { normalizeRichReview } from "../lib/ask/rich-review-request";
import { shareReviewOriginals } from "../lib/ask/shared-originals-review";
import { parseClaimAudit } from "../lib/ask/checks";
import { checkCitationBindings } from "../lib/ask/citation-check";
import { checkConsequences } from "../lib/ask/consequence-check";
import { recordedBlindReview } from "./inspect-ask-blind-review";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  const control = recordedBlindReview(), request = shareReviewOriginals(control.request);
  if (!process.argv.includes("--reviewed-single-audit")) { console.log(JSON.stringify({ status: "no_model_calls", claims: control.items.length, outputAllowance: request.maxOutputTokens, experimentalInputOnly: true })); return; }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("key_privacy_or_settings_changed");
  const path = resolve("work/private-ask-evaluation/shared-originals-single-audit-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const previousPath = resolve("work/private-ask-evaluation/discovery-priority-full-retest-20261023.json"), previousBytes = readFileSync(previousPath, "utf8"), previous = JSON.parse(previousBytes);
  if (existsSync(path) || ledger.stopped !== "campaign_budget_cannot_cover_next_call" || ledger.calls.some(c => c.cost === undefined)
    || previous.status !== "incomplete" || previous.calls.length !== 14 || previous.independentReview?.status !== "reviewed_source_improvement_but_incomplete_and_unsupported") throw Error("prior_attempt_not_reviewed_or_control_exists");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(previousPath, "utf8") !== previousBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("spending_history_changed");
  const model = "google/gemini-3.1-flash-lite", response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!response.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await response.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure }), before = guard.actual, callStart = ledger.calls.length;
  const report: any = { status: "prepared", model, scope: "One final-check component on the exact seven saved claims whose old final request was confirmed not dispatched. No new Ask question, answer publication, prepared reuse, extra meaning call or automatic retry.",
    traceHash: control.traceHash, requestHash: digest(JSON.stringify(request)), sourceClaims: control.items, expectedSupportedIds: ["C2", "C3"],
    originalsAndRestrictions: control.serialized, schemaAndOutputAllowanceUnchanged: true, inputSharingExperimentalNotEnabled: true, independentReview: "pending" };
  const save = () => { report.cost = guard.actual - before; report.calls = ledger.calls.slice(callStart); report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), started = Date.now();
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Continue Mo's current-model repair/test goal within the unchanged remainder: one current-checker audit of the saved, never-dispatched final request after removing previous approvals and mechanically lossless source sharing. All originals/restrictions/claims and the full response contract/output allowance retained; same conservative guard and price ceiling. Experimental input only; no new question/model, publication, retry or additional budget. Independently review the complete response." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    report.raw = await withModelTransport(async (url, init) => {
      if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_audit_dispatch_forbidden"); sent = true;
      const reply = await dispatch(url, init); const data = await reply.clone().json() as any; report.providerOutput = data.choices?.[0]?.message?.content; save(); return reply;
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(request));
    report.normalized = normalizeRichReview(report.raw, control.items, control.serialized);
    report.audit = parseClaimAudit(report.normalized, control.items);
    report.bindings = checkCitationBindings(report.normalized, control.items, control.serialized.passages);
    report.consequences = checkConsequences(report.normalized, control.items, control.serialized.passages);
    report.status = report.audit ? "settled_independent_review_required" : "invalid_response_do_not_activate";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "audit_failed"; }
  finally { ledger.stopped ??= "shared_originals_single_audit_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, remainingAllowance: report.remainingAllowance, calls: report.calls.length,
    auditFailures: report.audit?.failures?.map((f: any) => f.claim_id), bindingFailures: report.bindings?.blocked, error: report.error }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "audit_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
