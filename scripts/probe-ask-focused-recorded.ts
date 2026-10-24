// Single current-checker component; exact saved explanations and original/context data.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { sourceSupportRequest, parseSourceSupport } from "../lib/ask/focused-checks";
import { toEvidence } from "../lib/ask/core";
import type { EvidencePackage } from "../lib/ask/retrieval";
import { recordedBlindReview } from "./inspect-ask-blind-review";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

export function recordedFocusedControl() {
  const control = recordedBlindReview();
  const savedPath = resolve("work/private-ask-evaluation/discovery-priority-full-retest-20261023.json");
  const savedBytes = readFileSync(savedPath, "utf8"), saved = JSON.parse(savedBytes);
  const sources = saved.sections.flatMap((s: any) => s.sources);
  const items = control.items.slice(0, 4);
  const passages = [...new Set<string>(items.flatMap((c: any) => c.refs))].map(id => {
    const e = sources.find((s: any) => s.id === id)?.evidence;
    const original = control.serialized.passages.find((p: any) => p.id === id);
    if (!e || !original || original.arabic !== e.arabic || !["quran", "hadith"].includes(e.kind)) throw Error("recorded_source_identity_changed");
    const verse = (p: any) => ({ key: p.id.slice(1), arabic: p.arabic, arabicPlain: p.arabic, translations: { en: null, de: null }, url: `https://quran.com/${p.id.slice(1).replace(":", "/")}` });
    const source = e.kind === "quran" ? { kind: "quran", verse: verse(original) }
      : { kind: "hadith", hadith: { ...e, id: e.key, translations: { en: null, de: null } } };
    return { id, source, context: (original.surrounding_context ?? []).map(verse), requirementIds: original.supported_requirement_ids ?? [], facets: ["general"] };
  });
  const pack = { question: control.serialized.question, passages, cards: [] } as EvidencePackage;
  for (const p of pack.passages) if (toEvidence(p.source, "ar").arabic !== control.serialized.passages.find((s: any) => s.id === p.id).arabic) throw Error("original_changed");
  return { control, items, pack, savedPath, savedBytes, request: sourceSupportRequest(items, pack, "ar") };
}

async function main() {
  const c = recordedFocusedControl();
  if (!process.argv.includes("--reviewed-single-support")) { console.log(JSON.stringify({ status: "offline_only_no_calls", claims: c.items.length, requestHash: digest(JSON.stringify(c.request)), outputAllowance: c.request.maxOutputTokens })); return; }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("key_privacy_or_settings_changed");
  const path = resolve("work/private-ask-evaluation/focused-recorded-source-control-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const priorPath = resolve("work/private-ask-evaluation/selected-summary-single-control-20261024.json"), priorBytes = readFileSync(priorPath, "utf8");
  if (existsSync(path) || ledger.stopped !== "selected_summary_component_finished_review_required" || ledger.calls.some(r => r.cost === undefined)
    || JSON.parse(priorBytes).independentReview?.status !== "reviewed_structural_preservation_only_do_not_activate") throw Error("prior_control_not_reviewed_or_repeat_forbidden");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(priorPath, "utf8") !== priorBytes || readFileSync(c.savedPath, "utf8") !== c.savedBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path); const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("history_changed");
  const model = "google/gemini-3.1-flash-lite", response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!response.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await response.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const before = guard.actual, first = ledger.calls.length;
  const report: any = { status: "prepared", model, scope: "Existing focused source-support builder on the four exact saved claims. No new prompt experiment, source generation, model change, final completion, backup or retry. Expected review labels never sent to provider.",
    traceHash: c.control.traceHash, requestHash: digest(JSON.stringify(c.request)), request: c.request, items: c.items, expectedSupportedIds: ["C2", "C3"], expectedNotFullySupportedIds: ["C1", "C4"], independentReview: "pending" };
  const save = () => { report.cost = guard.actual - before; report.calls = ledger.calls.slice(first); report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash), started = Date.now();
  try {
    save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Continue current-model repair goal within existing remainder: one actual focused source-support component on all four saved explanations and exact own originals/context. Same output formula, prices, privacy and conservative reservations; no fallback, retry, full-answer completion or added budget." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    report.raw = await withModelTransport(async (url, init) => { if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_support_dispatch_forbidden"); sent = true;
      const reply = await dispatch(url, init); const data = await reply.clone().json() as any; report.providerOutput = data.choices?.[0]?.message?.content; save(); return reply;
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(c.request));
    report.parsed = parseSourceSupport(report.raw, c.items, c.pack);
    report.status = report.parsed.valid ? "settled_review_required" : "invalid_response_do_not_activate";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "support_failed"; }
  finally { ledger.stopped ??= "focused_recorded_support_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, safeIds: report.parsed?.safeIds, failures: report.parsed?.failures, error: report.error }));
}
if (process.argv[1]?.includes("probe-ask-focused-recorded")) { const keepAlive = setInterval(() => {}, 1000); main().catch(e => { console.error(e instanceof Error ? e.message : "support_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive)); }
