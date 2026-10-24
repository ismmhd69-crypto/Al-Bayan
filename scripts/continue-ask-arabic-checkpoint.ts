// Continues one reviewed synthetic Arabic attempt. Not a new question or production worker.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { getProvider, getVerifier } from "../lib/ai";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { toEvidence } from "../lib/ask/core";
import { stripAnswer } from "../lib/chat/answer-store";
import { checkpointWriter, restoreRichCheckpoint, sameApprovedScholar, checkpointCanonical } from "./ask-settled-rich-checkpoint";
import { ARABIC_CASES } from "./ask-arabic-quality-cases";
import { ArabicCampaignGuard, CURRENT_MODELS, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_TRACE: "true" });
  const paid = process.argv.includes("--continue-unpaid-checks-within-existing-cap");
  const resultPath = resolve("work/private-ask-evaluation/arabic-quality-20261023-checkpoint-continuation.json");
  if (paid && (!process.argv.includes("--verify-sources") || !process.argv.includes("--active-library-verification") || process.argv.includes("--scholar-diagnostic-only"))) throw Error("paid_continuation_requires_complete_source_verification");
  if (paid && existsSync(resultPath)) throw Error("continuation_already_recorded_no_automatic_repeat");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261022-coordination-spend.json");
  const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const parentReport = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-coordination-2/report.json"), "utf8"));
  const row = parentReport.rows.find((r: any) => r.id === "R01");
  if (!row || row.review?.classification !== "technical_failure_budget_reservation_contention" || ledger.calls.some(c => c.cost === undefined)) throw Error("continuation_requires_reviewed_settled_attempt");
  if (row.question !== ARABIC_CASES.find(c => c.id === "R01")?.question || parentReport.manifestHash !== digest(JSON.stringify(ARABIC_CASES))) throw Error("checkpoint_question_bank_changed");
  if (checkpointCanonical(row.calls) !== checkpointCanonical(ledger.calls.slice(row.callRange[0], row.callRange[1]))) throw Error("checkpoint_receipts_not_bound_to_ledger");
  if (!ledger.priorCampaign) throw Error("checkpoint_missing_prior_allowance");
  const predecessor = JSON.parse(readFileSync(ledger.priorCampaign.path, "utf8")) as CampaignLedger;
  if (predecessor.calls.some(c => c.cost === undefined)) throw Error("predecessor_charge_unresolved");
  const inheritedExposure = predecessor.priorExposure + predecessor.calls.reduce((sum, c) => sum + c.cost!, 0);
  if (ledger.priorExposure !== inheritedExposure || ledger.cap !== inheritedExposure + .25) throw Error("checkpoint_allowance_changed");
  const originalPath = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(originalPath, "utf8")) !== ledger.originalLedgerHash) return false;
    let current = ledger; const seen = new Set<string>();
    while (current.priorCampaign) {
      const link = current.priorCampaign; if (seen.has(link.path)) return false; seen.add(link.path);
      const bytes = readFileSync(link.path, "utf8");
      if (digest(bytes) !== link.hash) return false;
      current = JSON.parse(bytes);
    }
    return true;
  };
  if (!unchanged()) throw Error("immutable_spending_history_changed");
  const trace = readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8");
  const checkpoint = restoreRichCheckpoint(trace.trim().split("\n").map(line => JSON.parse(line)), row.calls, row.question);
  const realWriter = getProvider(), realVerifier = getVerifier();
  if (realWriter.id !== parentReport.configuration.models.writer || realVerifier.id !== parentReport.configuration.models.checker || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("checkpoint_model_or_privacy_changed");
  for (const [key, value] of Object.entries(parentReport.configuration.flags)) if ((process.env[key] ?? "default") !== value) throw Error("checkpoint_active_settings_changed");
  const offlineReuse: string[] = [];
  const writer = checkpointWriter({ id: realWriter.id, generateJson: async () => { throw Error("offline_new_model_call_forbidden"); } }, checkpoint.drafts, false, d => offlineReuse.push(d.generationId));
  const offline = await runRichAnswer(structuredClone(checkpoint.pack), "ar", { writer, verifier: { id: realVerifier.id, generateJson: async () => null },
    meaningReview: true, rich: {}, search: async () => [], getVerse: async () => undefined, neighbours: async () => [] }, new AbortController().signal, row.question, {}, Infinity);
  if (offlineReuse.length !== 2 || offline.status !== "incomplete") throw Error("checkpoint_offline_replay_did_not_match");
  const offlineReport = { stage: "settled_checkpoint_offline_restore_only", parentRequestId: row.requestId, sourceTraceHash: digest(trace), selectedSources: checkpoint.pack.passages.map(p => p.id),
    settledDraftsReused: offlineReuse, newModelCalls: 0, newCost: 0, noSemanticApproval: true };
  persistCampaign(resolve("work/private-ask-evaluation/arabic-quality-20261023-checkpoint-offline.json"), offlineReport);
  console.log(JSON.stringify(offlineReport));
  if (!process.argv.includes("--verify-sources")) return;
  const { serverJobFreshness } = await import("../lib/ask/search-engine/server-job-freshness");
  const freshness = serverJobFreshness(), controller = new AbortController();
  const sources = new Map(checkpoint.pack.passages.map(p => [p.id, p.source]));
  for (const p of checkpoint.pack.passages) for (const v of p.context) sources.set(`Q${v.key}`, { kind: "quran", verse: v });
  const scholarOnly = process.argv.includes("--scholar-diagnostic-only");
  const activeLibrary = process.argv.includes("--active-library-verification");
  const approvedScholarChecks = new Map<string, Promise<string>>();
  if (activeLibrary) {
    const proof = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261023-checkpoint-rpc-diagnostic.json"), "utf8"));
    if (!proof.missingMetadataRpc || proof.sourceTraceHash !== digest(trace)) throw Error("active_library_revalidation_scope_not_established");
  }
  const checks: { sourceId: string; language: string; status: string; reasonCode?: string }[] = [];
  for (const [id, source] of sources) {
    const languages = scholarOnly ? source.kind === "scholar" ? ["ar" as const] : [] : ["ar", "en"] as const;
    checks.push(...await Promise.all(languages.map(async language => {
      let status: string, reasonCode: string | undefined;
      try {
        if (activeLibrary && source.kind === "scholar") {
          if (!approvedScholarChecks.has(id)) approvedScholarChecks.set(id, (async () => {
            const { searchScholarQuotes } = await import("../lib/sources/scholars");
            const fresh = await searchScholarQuotes([source.quote.title ?? source.quote.reference], 30, { allVariants: true, meaningCandidates: true, signal: controller.signal });
            return sameApprovedScholar(source.quote, fresh);
          })());
          status = await approvedScholarChecks.get(id)!;
        } else status = await freshness.evidence({ id, evidence: toEvidence(source, language) }, language, controller.signal);
      } catch (error) { status = "unavailable"; reasonCode = error instanceof Error && /^[a-z_]{1,80}$/.test(error.message) ? error.message : "source_revalidation_failed"; }
      return { sourceId: id, language, status, ...(reasonCode ? { reasonCode } : {}) };
    })));
    console.log(JSON.stringify({ sourceRevalidated: id, completedChecks: checks.length, newCost: 0 }));
  }
  persistCampaign(resolve(`work/private-ask-evaluation/arabic-quality-20261023-checkpoint-${scholarOnly ? "scholar-diagnostic" : "freshness"}.json`), { parentRequestId: row.requestId, checkedAt: new Date().toISOString(), sourceTraceHash: digest(trace), scholarMethod: activeLibrary ? "existing_approved_library_exact_record" : "worker_freshness", checks, newModelCalls: 0, newCost: 0 });
  console.log(JSON.stringify({ stage: "read_only_source_revalidation", checks, newCost: 0 }));
  if (scholarOnly && checks.some(c => c.reasonCode === "index_source_state_unavailable")) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const ids = checkpoint.pack.passages.filter(p => p.source.kind === "scholar").map(p => p.id.slice(1));
    const result = await db.rpc("read_approved_index_source_state", { source_ids: ids });
    const code = result.error?.code;
    console.log(JSON.stringify({ stage: "source_state_rpc_diagnostic", code: typeof code === "string" && /^[A-Z0-9_]{1,16}$/.test(code) ? code : "unknown", classification: code === "PGRST202" ? "missing_metadata_rpc" : "not_established", newCost: 0 }));
    persistCampaign(resolve("work/private-ask-evaluation/arabic-quality-20261023-checkpoint-rpc-diagnostic.json"), { sourceTraceHash: digest(trace), code, missingMetadataRpc: code === "PGRST202", newModelCalls: 0 });
  }

  if (checks.some(c => c.status !== "valid")) throw Error("checkpoint_source_changed_or_unavailable_no_paid_calls");
  if (!process.argv.includes("--continue-unpaid-checks-within-existing-cap")) return;
  if (!activeLibrary || scholarOnly || ledger.stopped !== "campaign_budget_cannot_cover_next_call") throw Error("paid_continuation_scope_not_eligible");
  if (existsSync(resultPath)) throw Error("continuation_already_recorded_no_automatic_repeat");
  for (const model of CURRENT_MODELS) {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!response.ok) throw Error("price_metadata_unavailable");
    const data: any = await response.json(), endpoints = data.data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_endpoints_missing");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const live = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(live).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof live] + 1e-10)) throw Error("price_exceeds_unchanged_ceiling");
  }
  const { withModelTransport } = await import("../lib/ai/transport");
  const { observedProvider, withAskRequest } = await import("../lib/ask/trace-context");
  const { recordLocalAskEvent } = await import("../lib/ask/local-trace");
  const release = campaignLock(originalPath, ledger.originalLedgerHash), started = Date.now(), firstCall = ledger.calls.length;
  const before = ledger.calls.reduce((sum, c) => sum + c.cost!, 0);
  const progress: any = { stage: "same_attempt_unpaid_checks_continuation", status: "running", caseId: row.id, parentRequestId: row.requestId,
    continuationTraceId: randomUUID(), sourceTraceHash: digest(trace), originalAttemptCost: row.cost, models: parentReport.configuration.models,
    sourceChecks: checks, scholarMethod: "existing_approved_library_exact_record", reused: [], sections: [], firstCheckedMs: null, withdrawn: false, diagnostics: [], review: "pending" };
  const save = () => { progress.newCost = ledger.calls.reduce((sum, c) => sum + (c.cost ?? 0), 0) - before;
    progress.totalAttemptCost = row.cost + progress.newCost; progress.calls = ledger.calls.slice(firstCall); persistCampaign(resultPath, progress); };
  const stripSection = (section: any) => stripAnswer({ version: 3, language: "ar", review: "automatic", sections: [section], complete: true, guide: "study_evidence" } as any).sections[0];
  try {
    ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: "Standing owner repair loop within the unchanged additional 25-cent allowance. Continue the reviewed interrupted R01 attempt using exact settled writer outputs after current source revalidation; no repeat of paid research/framing/selection/drafts, no uncertain-call replay, same current model/checking/privacy rules." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger); save();
    const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
    let call = 0;
    const log: Parameters<typeof observedProvider>[2] = (stage, code, elapsedMs, details) => { progress.diagnostics.push({ stage, code, elapsedMs, details }); save(); };
    const replayWriter = checkpointWriter(realWriter, checkpoint.drafts, true, d => {
      progress.reused.push({ generationId: d.generationId, paidFingerprint: d.paidFingerprint });
      recordLocalAskEvent("settled_draft_reused", { generationId: d.generationId, parentRequestId: row.requestId, paidAgain: false }); save();
    });
    const result = await withAskRequest(progress.continuationTraceId, () => withModelTransport(guard.dispatch(fetch, () => unchanged() && digest(readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8")) === digest(trace)), () => runRichAnswer(structuredClone(checkpoint.pack), "ar", {
      writer: observedProvider(replayWriter, "writer", log, started, () => `C${++call}`), verifier: observedProvider(realVerifier, "checker", log, started, () => `C${++call}`),
      meaningReview: true, focusedChecks: false, distinctSelection: false, search: async () => [], getVerse: async () => undefined, neighbours: async () => [],
      onDiagnostic: log, rich: { onSection: section => { if (section.outcome === "ready" && progress.firstCheckedMs === null) progress.firstCheckedMs = Date.now() - started; progress.sections.push(stripSection(section)); save(); },
        onWithdraw: () => { progress.withdrawn = true; save(); } },
    }, new AbortController().signal, row.question, {}, Infinity)));
    progress.status = result.status;
    progress.result = result.status === "rich_answer" ? { ...result, answer: stripAnswer(result.answer) } : { status: result.status, withdraw: result.withdraw };
  } catch (error) { progress.status = "error"; progress.reason = error instanceof Error && /^[a-z_]{1,100}$/.test(error.message) ? error.message : "continuation_error"; }
  finally {
    if (!ledger.stopped) ledger.stopped = "settled_checkpoint_continuation_review_required";
    persistCampaign(ledgerPath, ledger); progress.stopReason = ledger.stopped; progress.totalMs = Date.now() - started; save(); release();
  }
  console.log(JSON.stringify({ status: progress.status, newCost: progress.newCost, totalAttemptCost: progress.totalAttemptCost, ms: progress.totalMs, sections: progress.sections.map((s: any) => `${s.group}:${s.outcome}`) }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "checkpoint_continuation_stopped"); process.exitCode = 1; });
