// Owner-only matched regression. No website changes or automatic full retest.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { sourceScopeReviewRequest, parseSourceScopeReview } from "../lib/ask/source-scope-review";
import { ArabicCampaignGuard, sameAllowanceContinuation, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

export function sourceScopeControls() {
  const tracePath = resolve("work/local-ask-traces/d9e9b89d-1e12-44d2-bb08-2749ea930946.jsonl");
  const bytes = readFileSync(tracePath, "utf8"), events = bytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const serialized = events.find(e => e.event === "model_request" && e.data.call_id === "A9")?.data.prompt.evidence_package;
  if (!serialized?.passages?.find((p: any) => p.id === "HE65007")) throw Error("recorded_originals_missing");
  const items = [
    { text: "يعود نفع العبادة وشكر الله على العباد أنفسهم لأن الله غني عن العالمين.", refs: ["Q31:12"] },
    { text: "يخبر القرآن بأن الله يجزي من فضله الذين يؤمنون ويعملون الأعمال الصالحة.", refs: ["Q30:45"] },
    { text: "بيّن النبي أن الله لا يعذّب من لا يشرك به شيئًا.", refs: ["HE65007"] },
    { text: "يمهد العاملون للصالحات منازلهم في الآخرة وينالون من فضل الله وجزائه.", refs: ["Q30:44", "Q30:45"] },
    { text: "يبيّن النص أن الله لا يريد منهم رزقًا ولا إطعامًا.", refs: ["Q51:57"] },
    { text: "بين النبي صلى الله عليه وسلم توحيد الله وعبادته خالصا، وأوضح أن جزاء من اجتنب الشرك هو أن تقيه حكمة الله وعفوه عقوبته.", refs: ["HE65007"] },
    { text: "من يشكر الله فإن منفعة شكره ترجع إليه.", refs: ["Q31:12"] },
    { text: "يعد النص العباد بأن عبادتهم تضمن لهم الرزق الوفير.", refs: ["Q51:57"] },
  ];
  const originals = serialized.passages.map((p: any) => ({ id: p.id, arabic: p.arabic }));
  const signal = new AbortController().signal;
  return { items, originals, serialized, tracePath, traceBytes: bytes,
    supported: ["C2", "C3", "C5", "C7"], unsupported: ["C1", "C4", "C6", "C8"],
    requests: [meaningReviewRequest(items, serialized, signal), sourceScopeReviewRequest(items, originals, signal)] };
}

async function main() {
  const c = sourceScopeControls();
  c.requests.forEach(r => structuredOutputContract(r.schema));
  if (!process.argv.includes("--reviewed-matched-control")) {
    console.log(JSON.stringify({ status: "offline_prepared_no_calls", claims: c.items.length, requestHashes: c.requests.map(r => digest(JSON.stringify(r))), outputAllowances: c.requests.map(r => r.maxOutputTokens) })); return;
  }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("settings_changed");
  const reportPath = resolve("work/private-ask-evaluation/source-scope-matched-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-source-scope-spend.json");
  const finishUndispatched = process.argv.includes("--finish-undispatched-comparison");
  const savedReport = finishUndispatched ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
  if (!finishUndispatched && (existsSync(reportPath) || existsSync(ledgerPath))) throw Error("completed_or_interrupted_control_must_not_repeat");
  const previousPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-compact-ranking-spend.json");
  const previousBytes = readFileSync(previousPath, "utf8");
  const review = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/compact-ranking-full-retest-20261024.json"), "utf8"));
  if (review.independentReview?.classification !== "containing_unsupported_claim") throw Error("prior_review_missing");
  const ledger: CampaignLedger = finishUndispatched ? JSON.parse(readFileSync(ledgerPath, "utf8")) : sameAllowanceContinuation(previousBytes, previousPath,
    "Continue Mo's active repair loop within the SAME remaining allowance: two sequential current-checker calls on eight fixed Arabic original/claim controls, current meaning check versus source-first scope comparison. No model switch, added budget, website activation, full-question rerun, fallback or retry. Review before further spending.");
  if (finishUndispatched && (savedReport.status !== "error" || savedReport.error !== "structured_schema_invalid"
    || savedReport.results.length !== 1 || savedReport.results[0].method !== "current_meaning_check"
    || ledger.calls.length !== 1 || ledger.calls[0].cost === undefined || savedReport.calls.length !== 1
    || ledger.stopped !== "source_scope_matched_finished_review_required"
    || digest(JSON.stringify(savedReport.items)) !== digest(JSON.stringify(c.items))
    || digest(JSON.stringify(savedReport.requests[0])) !== digest(JSON.stringify(c.requests[0])))) throw Error("undispatched_state_not_proven");
  const model = "google/gemini-3.1-flash-lite";
  const metadata = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!metadata.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await metadata.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (names: string[]) => Math.max(...endpoints.flatMap((e: any) => names.map(n => Number(e.pricing?.[n] ?? 0))));
  const price = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(price).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof price] + 1e-10)) throw Error("price_ceiling_changed");
  const originalPath = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (readFileSync(c.tracePath, "utf8") !== c.traceBytes || digest(readFileSync(originalPath, "utf8")) !== ledger.originalLedgerHash) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  const release = campaignLock(originalPath, ledger.originalLedgerHash);
  const report: any = savedReport ?? { status: "prepared", model, traceHash: digest(c.traceBytes), items: c.items, originals: c.originals,
    requests: c.requests, supportedControls: c.supported, defectiveControls: c.unsupported, results: [], independentReview: "pending",
    scope: "Eight fixed Arabic component comparisons, not eight visitor questions. Expected labels stay local. Same checker/privacy/output allowance. No experimental website activation or complete-answer claim." };
  const save = () => { report.calls = ledger.calls; report.cost = guard.actual; report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(reportPath, report); };
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const started = Date.now();
  try {
    if (!finishUndispatched) {
      const fd = openSync(ledgerPath, "wx", 0o600);
      try { writeFileSync(fd, JSON.stringify(ledger, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
    } else {
      report.localNondispatchCorrection = { reason: report.error, oldRequestHash: digest(JSON.stringify(report.requests[1])),
        finding: "Undeclared minItems schema keyword rejected locally before reservation/network. One settled baseline retained; only the never-dispatched comparison may run. Exact item/original/model/output allowance unchanged." };
      report.requests[1] = c.requests[1]; delete report.error;
    }
    if (!unchanged()) throw Error("historical_state_changed");
    delete ledger.stopped; persistCampaign(ledgerPath, ledger); save();
    const dispatch = guard.dispatch(fetch, unchanged); let sent = finishUndispatched ? 1 : 0;
    for (const [index, request] of c.requests.entries()) {
      if (finishUndispatched && index === 0) continue;
      const oneStart = Date.now();
      const raw = await withModelTransport(async (url, init) => {
        if (sent !== index || JSON.parse(String(init.body)).model !== model) throw Error("extra_dispatch_forbidden");
        sent++; return dispatch(url, init);
      }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(request));
      const parsed = index === 0 ? parseMeaningReview(raw, c.items) : parseSourceScopeReview(raw, c.items, c.originals);
      report.results.push({ method: index === 0 ? "current_meaning_check" : "source_first_comparison", raw, parsed, totalMs: Date.now() - oneStart }); save();
      if (!parsed) { report.status = "invalid_response_stop"; break; }
    }
    report.status = report.results.length === 2 && report.results.every((r: any) => r.parsed) ? "settled_review_required" : "invalid_response_stop";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "control_failed"; }
  finally { ledger.stopped ??= "source_scope_matched_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, remaining: report.remainingAllowance, results: report.results.map((r: any) => ({ method: r.method, safeIds: r.parsed?.safeIds, failures: r.parsed?.failures })), error: report.error }));
}
if (process.argv[1]?.includes("probe-ask-source-scope")) {
  const keepAlive = setInterval(() => {}, 1000);
  main().catch(e => { console.error(e instanceof Error ? e.message : "control_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
}
