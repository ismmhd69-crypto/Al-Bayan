// One actual-engine named-author correction control, not a complete question.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { prepareNamedScholarRepair } from "./prepare-ask-named-scholar-repair";
import { checkScholarAttributions } from "../lib/ask/scholar-attribution-check";
import { applyTextOnlyPatch } from "../lib/ask/text-only-patch";
import { sourceCopyMatch } from "../lib/ask/checks";
import { ArabicCampaignGuard, sameAllowanceContinuation, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  const c = await prepareNamedScholarRepair();
  structuredOutputContract(c.request.schema);
  if (!process.argv.includes("--reviewed-single-name")) {
    console.log(JSON.stringify({ status: "offline_only", targetedSentences: c.original.length, outputAllowance: c.request.maxOutputTokens, requestHash: digest(JSON.stringify(c.request)) })); return;
  }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("settings_changed");
  const reportPath = resolve("work/private-ask-evaluation/named-scholar-repair-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-scholar-name-spend.json");
  if (existsSync(reportPath) || existsSync(ledgerPath)) throw Error("repeat_forbidden");
  const priorPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-current-spend.json");
  const review = JSON.parse(c.bytes);
  if (review.independentReview?.status !== "reviewed_source_gap_and_budget_stop") throw Error("prior_review_missing");
  const ledger: CampaignLedger = sameAllowanceContinuation(readFileSync(priorPath, "utf8"), priorPath,
    "Continue Mo's repair loop within SAME remaining allowance: ONE actual-engine current-writer correction of the two saved parents scholar sentences after code rejects missing author names. Localized identity labels, normal 2200 output tokens/six-second timeout and locked text edits. No model switch, fallback, retry, full-question rerun or extra budget. Independent source review before further calls.");
  const model = "google/gemini-3.5-flash-lite", metadata = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!metadata.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await metadata.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (names: string[]) => Math.max(...endpoints.flatMap((e: any) => names.map(n => Number(e.pricing?.[n] ?? 0))));
  const price = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(price).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof price] + 1e-10)) throw Error("price_ceiling_changed");
  const originalPath = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (readFileSync(c.tracePath, "utf8") !== c.traceBytes || readFileSync(c.reportPath, "utf8") !== c.bytes || digest(readFileSync(originalPath, "utf8")) !== ledger.originalLedgerHash) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const identities = c.pack.passages.flatMap(p => p.source.kind === "scholar" ? [{ id: p.id, scholarId: p.source.quote.scholarId, name: p.source.quote.scholarName.ar }] : []);
  const own = c.pack.passages.flatMap(p => p.source.kind === "scholar" ? [{ id: p.id, kind: "scholar" as const, arabic: p.source.quote.arabic, translations: {} }] : []);
  const report: any = { status: "prepared", model, traceHash: digest(c.traceBytes), request: c.request, original: c.original, ownOriginals: own, identities,
    revisionHashes: Object.fromEntries(["lib/ask/scholar-attribution-check.ts", "lib/ask/rich-engine.ts", "lib/ask/text-only-patch.ts"].map(p => [p, digest(readFileSync(p, "utf8"))])),
    scope: "One actual-engine source correction after the identity guard overrides scripted upstream approval of two saved claims. Exact source originals, normal output and timeout, locked identities. Scripted upstream verdicts are capture mechanics, not accuracy evidence. No fresh retrieval, live checker, final summary, full question, UI/history test.", independentReview: "pending" };
  const save = () => { report.cost = guard.actual; report.calls = ledger.calls; report.remainingAllowance = ledger.cap - guard.exposure; persistCampaign(reportPath, report); };
  const release = campaignLock(originalPath, ledger.originalLedgerHash), started = Date.now();
  try {
    const fd = openSync(ledgerPath, "wx", 0o600);
    try { writeFileSync(fd, JSON.stringify(ledger, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
    if (!unchanged()) throw Error("history_changed");
    delete ledger.stopped; persistCampaign(ledgerPath, ledger); save();
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    report.raw = await withModelTransport(async (url, init) => {
      if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_dispatch_forbidden"); sent = true;
      return dispatch(url, init);
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson({ ...c.request, signal: AbortSignal.timeout(6000) }));
    const validated = structuredOutputContract(c.request.schema).parse(JSON.stringify(report.raw));
    report.reconstructed = validated && report.raw.status === "answer" ? applyTextOnlyPatch(report.raw.scholar, { original: c.original, indices: [0, 1] }) : null;
    report.copyFindings = report.reconstructed?.map((r: any) => sourceCopyMatch(r.text, own));
    report.nameCheck = report.reconstructed ? checkScholarAttributions(report.reconstructed.map((r: any) => ({ text: r.text, refs: r.source_ids })), identities, "ar") : null;
    report.status = report.reconstructed ? "settled_review_required" : "invalid_or_withheld";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "name_control_failed"; }
  finally { ledger.stopped ??= "named_scholar_control_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, remaining: report.remainingAllowance, reconstructed: report.reconstructed, copyFindings: report.copyFindings, nameCheck: report.nameCheck, error: report.error }));
}
if (process.argv[1]?.includes("probe-ask-named-scholar-repair")) {
  const keepAlive = setInterval(() => {}, 1000);
  main().catch(e => { console.error(e instanceof Error ? e.message : "name_control_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
}
