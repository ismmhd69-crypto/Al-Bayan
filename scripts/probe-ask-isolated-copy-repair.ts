// One saved-request writer control, not a fresh full question or accuracy certification.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { isolateCopyRepair } from "../lib/ask/copy-repair-input";
import { applyTextOnlyPatch } from "../lib/ask/text-only-patch";
import { sourceCopyMatch } from "../lib/ask/checks";
import type { JsonRequest } from "../lib/ai/types";
import { ArabicCampaignGuard, sameAllowanceContinuation, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

export function isolatedRecordedCopyRepair() {
  const tracePath = resolve("work/local-ask-traces/d9e9b89d-1e12-44d2-bb08-2749ea930946.jsonl"), bytes = readFileSync(tracePath, "utf8");
  const events = bytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const saved = events.find(e => e.event === "model_request" && e.data.call_id === "A14")?.data;
  if (!saved || saved.prompt.sections_to_write.join() !== "hadith" || saved.max_output_tokens !== 2200) throw Error("recorded_copy_request_changed");
  const before: JsonRequest = { system: saved.system, prompt: JSON.stringify(saved.prompt), schema: saved.schema, maxOutputTokens: saved.max_output_tokens, thinking: "low", structuredOutput: true };
  const request = isolateCopyRepair(before), p = JSON.parse(request.prompt);
  structuredOutputContract(request.schema);
  if (request === before || p.evidence_package.passages.length !== 1 || p.evidence_package.passages[0].id !== "HE65007") throw Error("copy_input_not_isolated");
  const finding = saved.prompt.correction.checker_findings.sentence_patches[0].findings[0];
  const original = [{ text: finding.rejected_text, source_ids: finding.source_ids, requirement_id: "R2" }];
  return { tracePath, bytes, before, request, original, own: finding.cited_originals, p };
}
async function main() {
  const c = isolatedRecordedCopyRepair();
  if (!process.argv.includes("--reviewed-single-copy")) {
    console.log(JSON.stringify({ status: "offline_only", originalChars: c.before.prompt.length, isolatedChars: c.request.prompt.length, sameOutputAllowance: c.request.maxOutputTokens, ownOriginals: c.p.evidence_package.passages.map((p: any) => p.id) })); return;
  }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("settings_changed");
  const reportPath = resolve("work/private-ask-evaluation/isolated-copy-repair-20261024.json");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-copy-input-spend.json");
  if (existsSync(reportPath) || existsSync(ledgerPath)) throw Error("repeat_forbidden");
  const priorPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-source-scope-spend.json");
  const review = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/source-scope-matched-20261024.json"), "utf8"));
  if (review.independentReview?.status !== "reviewed_failed_comparison_do_not_activate") throw Error("prior_review_missing");
  const ledger: CampaignLedger = sameAllowanceContinuation(readFileSync(priorPath, "utf8"), priorPath,
    "Continue Mo's repair loop within SAME remaining allowance: ONE current-writer saved hadith copy-correction control after own-original isolation. Preserve normal 2200 output tokens and six-second timeout, no model switch, fallback, automatic retry, full-question rerun or extra budget. Independently review before further calls.");
  const model = "google/gemini-3.5-flash-lite", metadata = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!metadata.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await metadata.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (names: string[]) => Math.max(...endpoints.flatMap((e: any) => names.map(n => Number(e.pricing?.[n] ?? 0))));
  const price = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(price).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof price] + 1e-10)) throw Error("price_ceiling_changed");
  const originalPath = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (readFileSync(c.tracePath, "utf8") !== c.bytes || digest(readFileSync(originalPath, "utf8")) !== ledger.originalLedgerHash) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const report: any = { status: "prepared", model, traceHash: digest(c.bytes), request: c.request, original: c.original, ownOriginals: c.own,
    scope: "One actual saved copy-repair request after own-source isolation. Original full source/context, schema, output allowance, reasoning and timeout retained. No live source retrieval, checker dispatch, full answer, UI or persistence proof.", independentReview: "pending" };
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
    report.reconstructed = validated && report.raw.status === "answer" ? applyTextOnlyPatch(report.raw.hadith, { original: c.original, indices: [0] }) : null;
    report.copyFinding = report.reconstructed ? sourceCopyMatch(report.reconstructed[0].text, c.own) : null;
    report.status = report.reconstructed ? "settled_review_required" : "invalid_or_withheld";
  } catch (e) { report.status = "error"; report.error = e instanceof Error ? e.message : "copy_control_failed"; }
  finally { ledger.stopped ??= "isolated_copy_control_finished_review_required"; persistCampaign(ledgerPath, ledger); report.totalMs = Date.now() - started; save(); release(); }
  console.log(JSON.stringify({ status: report.status, cost: report.cost, remaining: report.remainingAllowance, reconstructed: report.reconstructed, copyFinding: report.copyFinding, error: report.error }));
}
if (process.argv[1]?.includes("probe-ask-isolated-copy-repair")) {
  const keepAlive = setInterval(() => {}, 1000);
  main().catch(e => { console.error(e instanceof Error ? e.message : "copy_control_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
}
