// One initial source-writer component. Does not run or approve an Ask answer.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { parseRichClaims } from "../lib/ask/rich-engine";
import { prepareDiversePackageWriter } from "./prepare-ask-diverse-package-writer";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  if (!process.argv.includes("--reviewed-source-writer")) { console.log(JSON.stringify({ status: "offline_use_inspect_ask_package_diversity", modelCalls: 0, sourceCalls: 0 })); return; }
  const path = resolve("work/private-ask-evaluation/diverse-package-writer-control-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const priorPath = resolve("work/private-ask-evaluation/case-referent-repair-control-20261024.json"), priorBytes = readFileSync(priorPath, "utf8");
  if (existsSync(path) || ledger.stopped !== "case_referent_correction_finished_review_required" || ledger.calls.some(r => r.cost === undefined)
    || JSON.parse(priorBytes).independentReview?.status !== "reviewed_scope_preserved_but_wording_error_not_accepted") throw Error("prior_control_not_reviewed_or_repeat_forbidden");
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("key_privacy_or_settings_changed");
  const { getVerse } = await import("../lib/sources/quran");
  const c = await prepareDiversePackageWriter(getVerse), request = c.request;
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(priorPath, "utf8") !== priorBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path); const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("history_changed");
  const model = "google/gemini-3.5-flash-lite", response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!response.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await response.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const before = guard.actual, first = ledger.calls.length;
  const report: any = { status: "prepared", model, scope: "One recorded initial Quran-writing component, changing only Quran package membership/necessary routing enums after the chooser diversity replay. Normal 2200-token output, current writer, complete originals/context, same rest-of-source package. Newly admitted originals/context independently reread and exactly matched. Quran-only chooser replay, not fresh full selection, research or final answer.",
    ...c, validationPack: undefined, requestHash: digest(JSON.stringify(request)), independentReview: "pending" };
  const save = () => { report.cost = guard.actual - before; report.calls = ledger.calls.slice(first); report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), started = Date.now();
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Continue current-model repair goal within unchanged remainder: one normal initial Quran-writing component after actual chooser diversity replay and fresh identity/context checks. Only selected Quran membership/routing enums change. Normal 2200-token output, privacy, prices and conservative reservation. No model switch, whole-answer completion, backup, correction, retry or budget increase. Independently review all generated claims." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    report.raw = await withModelTransport(async (url, init) => { if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_writer_dispatch_forbidden"); sent = true;
      const reply = await dispatch(url, init); const data = await reply.clone().json() as any; report.providerOutput = data.choices?.[0]?.message?.content; save(); return reply;
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(request));
    const envelope = structuredOutputContract(request.schema).parse(JSON.stringify(report.raw)) as any;
    if (!envelope || envelope.status !== "answer") report.status = "withheld_or_invalid";
    else { report.claims = parseRichClaims(envelope.quran, "quran", c.validationPack as any, "ar", reason => { report.validationFailure = reason; }); report.status = report.claims?.length ? "settled_independent_review_required" : "local_check_failed"; }
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "writer_failed"; }
  finally { ledger.stopped ??= "diverse_package_writer_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, claims: report.claims, remaining: report.remainingAllowance, error: report.error, validationFailure: report.validationFailure }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "writer_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
