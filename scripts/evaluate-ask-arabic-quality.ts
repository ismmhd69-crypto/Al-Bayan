// Owner-authorized Arabic quality baseline. No website imports this script.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { ArabicCampaignGuard, CURRENT_MODELS, PRIOR_EXPOSURE, campaignLock, digest, persistCampaign, type CampaignLedger, type Price } from "./ask-arabic-campaign-guard";
import { ARABIC_CASES, orderedArabicCases } from "./ask-arabic-quality-cases";
import { withModelTransport } from "../lib/ai/transport";

const RESUME_PLANNING = process.argv.includes("--resume-settled-planning");
const SOURCE_CONTRACT_RETEST = process.argv.includes("--reviewed-source-contract-retest");
const RESUME_UNDISPATCHED = process.argv.includes("--resume-undispatched-storage-failure");
const CONNECTION_RETEST = process.argv.includes("--approved-source-request-retest-25c");
const STAGED_RETEST = process.argv.includes("--reviewed-staged-synthesis-retest");
const ADJACENT_RETEST = process.argv.includes("--reviewed-adjacent-repair-retest");
const COORDINATION = process.argv.includes("--approved-coordination-retest-25c");
const LOOP = process.argv.includes("--approved-improvement-loop-1usd");
const round = process.argv.find(a => a.startsWith("--round="))?.slice(8) ?? "1";
if (!/^[1-9][0-9]?$/.test(round)) throw new Error("invalid_round");
const caseIds = process.argv.find(a => a.startsWith("--ids="))?.slice(6).split(",");
if (caseIds && (new Set(caseIds).size !== caseIds.length || caseIds.some(id => !ARABIC_CASES.some(c => c.id === id)))) throw new Error("unknown_or_duplicate_case");
const SINGLE_TEST = process.argv.includes("--approved-single-test-25c");
const WRITING_RETEST = SINGLE_TEST || process.argv.includes("--approved-writing-retest");
const FOCUSED_RETEST = WRITING_RETEST || process.argv.includes("--approved-coverage-retest");
const REPAIR_RETEST = FOCUSED_RETEST || process.argv.includes("--approved-repair-retest");
const FRESH = CONNECTION_RETEST || COORDINATION || LOOP || REPAIR_RETEST || process.argv.includes("--approved-fresh-online-retest");
const RETEST2 = process.argv.includes("--approved-same-five-retest-2");
const RETEST = FRESH || RETEST2 || process.argv.includes("--approved-same-five-retest");
const ROOT = resolve(`work/private-ask-evaluation/arabic-quality-20261022${SOURCE_CONTRACT_RETEST ? "-source-contract-retest" : CONNECTION_RETEST ? "-source-request-retest" : COORDINATION ? `-coordination-${round}` : LOOP ? `-loop-${round}` : SINGLE_TEST ? "-retest-7" : WRITING_RETEST ? "-retest-6" : FOCUSED_RETEST ? "-retest-5" : REPAIR_RETEST ? "-retest-4" : FRESH ? "-retest-3" : RETEST2 ? "-retest-2" : RETEST ? "-retest-1" : ""}`);
const PRIOR_LEDGER = resolve(CONNECTION_RETEST ? "docs/ask-repair-runs/arabic-quality-20261022-coordination-spend.json" : COORDINATION ? "docs/ask-repair-runs/arabic-quality-20261022-loop-spend.json" : LOOP ? "docs/ask-repair-runs/arabic-quality-20261022-retest-7-spend.json" : SINGLE_TEST ? "docs/ask-repair-runs/arabic-quality-20261022-retest-3-spend.json" : "docs/ask-repair-runs/arabic-quality-20261022-spend.json");
const LEDGER = CONNECTION_RETEST ? resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json") : COORDINATION ? resolve("docs/ask-repair-runs/arabic-quality-20261022-coordination-spend.json") : LOOP ? resolve("docs/ask-repair-runs/arabic-quality-20261022-loop-spend.json") : SINGLE_TEST ? resolve("docs/ask-repair-runs/arabic-quality-20261022-retest-7-spend.json") : FRESH ? resolve("docs/ask-repair-runs/arabic-quality-20261022-retest-3-spend.json") : PRIOR_LEDGER;
if (RESUME_PLANNING && !CONNECTION_RETEST) throw Error("planning_resume_requires_scoped_connection_retest");
if (SOURCE_CONTRACT_RETEST && (!CONNECTION_RETEST || RESUME_PLANNING)) throw Error("source_contract_retest_requires_fresh_scoped_attempt");
if (RESUME_UNDISPATCHED && !SOURCE_CONTRACT_RETEST) throw Error("undispatched_resume_requires_scoped_source_contract_test");
if (CONNECTION_RETEST && (COORDINATION || LOOP || REPAIR_RETEST || STAGED_RETEST || ADJACENT_RETEST || caseIds?.join(",") !== "R01" || !process.argv.includes("--count=1"))) throw Error("connection_retest_one_worship_question_only");
if (STAGED_RETEST && (!COORDINATION || round !== "3" || caseIds?.join(",") !== "R01" || !process.argv.includes("--count=1") || ADJACENT_RETEST)) throw Error("staged_retest_one_reviewed_worship_attempt_only");
if (ADJACENT_RETEST && (!COORDINATION || round !== "2" || caseIds?.join(",") !== "R01" || !process.argv.includes("--count=1"))) throw Error("adjacent_retest_one_reviewed_worship_attempt_only");
const ORIGINAL = resolve("docs/ask-repair-runs/spend.json");
const REPORT = resolve(ROOT, "report.json");
async function main() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  // Match the locally launched website; diagnostic settings do not change answer rules.
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_TRACE: "true", ASK_DEBUG: "true" });
  const originalBytes = readFileSync(ORIGINAL, "utf8"), originalHash = digest(originalBytes);
  const unresolved = JSON.parse(originalBytes).entries.filter((c: any) => c.cost === undefined);
  if (unresolved.length !== 1 || unresolved[0].reserved !== PRIOR_EXPOSURE || unresolved[0].at !== "2026-10-04T11:17:30.244Z") throw new Error("prior_reservation_not_expected");
  const priorBytes = FRESH ? readFileSync(PRIOR_LEDGER, "utf8") : "";
  const prior = FRESH ? JSON.parse(priorBytes) as CampaignLedger : null;
  if (prior && (prior.calls.some(c => c.cost === undefined) || prior.originalLedgerHash !== originalHash)) throw new Error("previous_campaign_uncertain_or_changed");
  const ancestorUnchanged = () => {
    let ancestor = prior; const visited = new Set<string>();
    while (ancestor?.priorCampaign) {
      const link = ancestor.priorCampaign;
      if (visited.has(link.path)) return false;
      visited.add(link.path);
      const bytes = readFileSync(link.path, "utf8");
      if (digest(bytes) !== link.hash) return false;
      ancestor = JSON.parse(bytes) as CampaignLedger;
    }
    return true;
  };
  if (!ancestorUnchanged()) throw new Error("historical_campaign_changed");
  if (CONNECTION_RETEST && (prior?.stopped !== "owner_requested_pause" || prior.calls.some(c => c.cost === undefined)
    || prior.evaluationCases?.some(c => c.review === "pending"))) throw Error("prior_connection_attempt_not_closed_and_reviewed");
  const inheritedExposure = prior ? prior.priorExposure + prior.calls.reduce((sum, c) => sum + c.cost!, 0) : PRIOR_EXPOSURE;
  const limits = { cap: FRESH ? inheritedExposure + (CONNECTION_RETEST || COORDINATION ? .25 : LOOP ? 1 : SINGLE_TEST ? .25 : .5) : .5, priorExposure: inheritedExposure };
  mkdirSync(ROOT, { recursive: true });
  const manifestHash = digest(JSON.stringify(ARABIC_CASES));
  let campaign: CampaignLedger;
  if (existsSync(LEDGER)) {
    if (!process.argv.includes("--resume")) throw new Error("campaign_exists_use_explicit_resume_after_review");
    campaign = JSON.parse(readFileSync(LEDGER, "utf8"));
    if (campaign.originalLedgerHash !== originalHash) throw new Error("original_ledger_changed");
  } else {
    const prices: Record<string, Price> = {};
    const metadata: any[] = [];
    for (const model of CURRENT_MODELS) {
      const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
      if (!response.ok) throw new Error(`price_metadata_unavailable:${model}`);
      const data: any = await response.json();
      const endpoints = data.data?.endpoints;
      if (!Array.isArray(endpoints) || !endpoints.length) throw new Error("price_endpoints_empty");
      const max = (key: string) => Math.max(...endpoints.map((e: any) => Number(e.pricing?.[key] ?? 0)));
      const prompt = Math.max(max("prompt"), max("input_cache_read"), max("input_cache_write")) * 1e6;
      const completion = Math.max(max("completion"), max("internal_reasoning")) * 1e6;
      const request = max("request");
      if (![prompt, completion, request].every(Number.isFinite) || prompt <= 0 || completion <= 0) throw new Error("invalid_price_metadata");
      if (CONNECTION_RETEST && (!prior?.prices[model] || Object.entries({ prompt, completion, request }).some(([key, value]) => value > prior.prices[model][key as keyof Price] + 1e-10))) throw Error("current_price_exceeds_prior_ceiling");
      prices[model] = CONNECTION_RETEST ? { ...prior!.prices[model] } : { prompt, completion, request }; metadata.push({ model, fetchedAt: new Date().toISOString(), endpoints });
    }
    campaign = { version: 1, ...limits, originalLedgerHash: originalHash, prices, calls: [], ...(FRESH ? { priorCampaign: {
      path: PRIOR_LEDGER, hash: digest(priorBytes), exposure: inheritedExposure,
      authorization: CONNECTION_RETEST ? "Mo explicitly approved up to 25 cents more for one full Arabic worship retest after the source-request and summary-replay repairs. Preserve all earlier actual/reserved exposure, the original uncertain reservation, current models, privacy and price/reservation limits. Do not retry any uncertain request or deploy." : COORDINATION ? "Mo explicitly approved up to 25 cents more to retest worship and parents in Arabic after the correction-coordination and optional-source repairs; one attempt each, review worship before parents, preserve all prior spending and privacy" : LOOP ? "Mo authorized a general repair and reviewed Arabic online testing loop with at most $1 new spending; preserve all earlier charges/reservations and current models/privacy; no deployment" : SINGLE_TEST ? "Mo explicitly approved up to 25 cents more to finish one fresh Arabic online attempt; preserve all earlier charges and reservations; stop after one attempt" : "Mo explicitly approved up to 50 cents more for a fresh online retest of the same five Arabic questions; previous ledger remains immutable" } } : {}) };
    persistCampaign(resolve(ROOT, "prices.json"), metadata);
    persistCampaign(LEDGER, campaign);
  }
  if (!CONNECTION_RETEST && RETEST && campaign.stopped === "source_faithfulness_failure_review_required") {
    if (existsSync(REPORT) || campaign.reviewStops?.length || campaign.calls.some(c => c.cost === undefined)) throw new Error("retest_already_started_or_new_charge_unresolved");
    campaign.reviewStops = [{ at: new Date().toISOString(), reason: campaign.stopped, authorization: "Mo explicitly requested repairs and a retest of the same five questions; retain original combined 50-cent ceiling" }];
    delete campaign.stopped;
    persistCampaign(LEDGER, campaign);
  }
  if (RETEST2 && campaign.stopped === "same_five_retest_finished_no_further_spend_authorized") {
    if (existsSync(REPORT) || campaign.calls.some(c => c.cost === undefined)) throw new Error("retest_already_started_or_new_charge_unresolved");
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped,
      authorization: "Mo requested fix what you found and retest again; same five Arabic questions within the remaining original combined 50-cent ceiling" }];
    delete campaign.stopped;
    persistCampaign(LEDGER, campaign);
  }
  if (FRESH && (campaign.priorCampaign?.hash !== digest(priorBytes) || campaign.priorCampaign?.exposure !== inheritedExposure)) throw new Error("prior_campaign_snapshot_changed");
  if (REPAIR_RETEST && campaign.stopped === "fresh_same_five_batch_finished_review_before_further_spend") {
    if (existsSync(REPORT) || campaign.calls.some(c => c.cost === undefined)) throw new Error("retest_already_started_or_charge_unresolved");
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped,
      authorization: "Mo requested repairs and continued testing of individual problems; retest same five within the existing additional 50-cent allowance, no cap increase" }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  if (WRITING_RETEST && campaign.stopped === "campaign_budget_cannot_cover_next_call") {
    if (existsSync(REPORT) || campaign.calls.some(c => c.cost === undefined)) throw new Error("writing_retest_already_started_or_charge_unresolved");
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped,
      authorization: "Mo said go test after the constrained-writing and dependent-summary repair. One fresh worship attempt within the existing cap and reservation rules; no new allowance" }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  const guard = new ArabicCampaignGuard(campaign, () => persistCampaign(LEDGER, campaign), limits);
  if (ADJACENT_RETEST) {
    if (campaign.stopped !== "restriction_controls_finished_review_before_any_more_paid_work" || campaign.calls.some(c => c.cost === undefined)
      || campaign.evaluationCases?.some(c => c.review === "pending" || c.reportPath === REPORT)) throw Error("adjacent_retest_not_eligible_no_repeat");
    const previous = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-coordination-1/report.json"), "utf8"));
    if (previous.rows.find((r: any) => r.id === "R01")?.review?.classification !== "supported_but_incomplete") throw Error("prior_worship_not_reviewed");
    const replay = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261023-adjacent-replay.json"), "utf8"));
    if (replay.implementationHash !== digest(readFileSync(resolve("lib/ask/search-engine/adjacent-quran-discovery.ts"), "utf8"))) throw Error("discovery_replay_outdated");
  } else if (STAGED_RETEST) {
    if (campaign.stopped !== "settled_checkpoint_continuation_review_required" || existsSync(REPORT)
      || campaign.calls.some(c => c.cost === undefined) || campaign.evaluationCases?.some(c => c.review === "pending")) throw Error("staged_retest_requires_reviewed_settled_previous_attempt_no_repeat");
    const review = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261023-checkpoint-continuation.json"), "utf8"));
    if (review.caseId !== "R01" || review.review?.classification !== "supported_but_incomplete_with_repetition" || review.review.complete_answer !== false)
      throw Error("staged_retest_previous_source_review_missing");
  } else if (SOURCE_CONTRACT_RETEST) {
    const reviewed = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-source-request-retest/report.json"), "utf8"));
    const last = campaign.calls.at(-1);
    const eligibleStop = RESUME_UNDISPATCHED
      ? campaign.stopped === "campaign_reservation_storage_failed_before_dispatch" && campaign.calls.length === 10
        && last?.cost === 0 && last.rejection === "not_dispatched_reservation_storage_failed" && !last.generationId
      : campaign.stopped === "single_source_request_retest_finished_review_required" && campaign.calls.length === 9;
    if (!eligibleStop
      || campaign.calls.some(c => c.cost === undefined) || campaign.evaluationCases?.length !== 1 || campaign.evaluationCases[0].review !== "failed"
      || reviewed.status !== "reviewed_single_attempt_incomplete" || reviewed.rows.length !== 1
      || reviewed.rows[0].requestId !== campaign.evaluationCases[0].requestId || reviewed.rows[0].review?.originalArabicReviewed !== true
      || (!RESUME_UNDISPATCHED && existsSync(REPORT))) throw Error("source_contract_retest_requires_reviewed_failed_attempt_no_repeat");
  } else if (campaign.stopped && !(RESUME_PLANNING && campaign.stopped === "planning_process_exit_reviewed")) throw new Error(`campaign_stopped:${campaign.stopped}`);
  if (ADJACENT_RETEST || STAGED_RETEST || CONNECTION_RETEST) {
    for (const model of CURRENT_MODELS) {
      const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
      if (!response.ok) throw Error("current_price_metadata_unavailable");
      const data: any = await response.json(), endpoints = data.data?.endpoints;
      if (!Array.isArray(endpoints) || !endpoints.length) throw Error("current_price_endpoints_missing");
      const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
      const live = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
      if (Object.entries(live).some(([k, v]) => !Number.isFinite(v) || v > campaign.prices[model][k as keyof typeof live] + 1e-10)) throw Error("current_price_exceeds_unchanged_ceiling");
    }
  }
  const { getProvider, getVerifier } = await import("../lib/ai");
  const models = { writer: getProvider().id, checker: getVerifier().id };
  const expected = { writer: "openrouter/google/gemini-3.5-flash-lite|fallback:openrouter/google/gemini-3.8-flash", checker: "openrouter/google/gemini-3.1-flash-lite|fallback:openrouter/mistralai/mistral-small-3.2-24b-instruct" };
  if (JSON.stringify(models) !== JSON.stringify(expected)) throw new Error("current_models_differ_no_calls");
  if ((process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw new Error("privacy_not_expected");
  const flagNames = ["ASK_RICH_ENABLED", "ASK_STREAM_ENABLED", "ASK_MEANING_RANKING", "ASK_RESEARCH_RECOVERY", "ASK_CORPUS_RETRIEVAL", "ASK_PATIENT_ENABLED", "ASK_DURABLE_ENABLED", "ASK_FOCUSED_CHECKS", "ASK_DISTINCT_SELECTION", "HADITH_SOURCE", "SCHOLAR_QUOTES", "SCHOLARS_LIVE", "OPENROUTER_REASONING", "OPENROUTER_STRUCTURED_OUTPUTS"];
  const flags = Object.fromEntries(flagNames.map(k => [k, process.env[k] ?? "default"]));
  const configuration = { models, flags, gitHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), trackedDiffHash: digest(execFileSync("git", ["-c", "core.safecrlf=false", "diff", "--no-ext-diff"], { encoding: "utf8", maxBuffer: 20e6 })) };
  const report: any = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, "utf8")) : { at: new Date().toISOString(), manifestHash, configuration, status: "prepared", rows: [], acceptance: "not_scholarly_certification", priorCampaignCost: RETEST ? guard.actual : 0, phase: CONNECTION_RETEST ? "source_connection_and_synthesis_retest" : STAGED_RETEST ? "checked_source_synthesis_retest" : COORDINATION ? `coordination_retest_${round}` : LOOP ? `general_improvement_loop_round_${round}` : SINGLE_TEST ? "single_worship_test_additional25c" : WRITING_RETEST ? "constrained_writing_and_dependent_summary_retest" : FOCUSED_RETEST ? "coverage_and_provider_shape_retest" : REPAIR_RETEST ? "punctuation_feedback_continuity_retest" : FRESH ? "fresh_owner_authorized_same_five_retest" : RETEST2 ? "same_five_citation_search_retest" : RETEST ? "same_five_repaired_retest" : "baseline" };
  if (RESUME_UNDISPATCHED) {
    const old = report.rows[0];
    if (report.manifestHash !== manifestHash || report.executionHistory || report.rows.length !== 1
      || old?.status !== "error" || old.review?.classification !== "confirmed_not_dispatched_storage_failure"
      || old.cost !== 0 || old.calls?.length !== 1 || old.calls[0].rejection !== "not_dispatched_reservation_storage_failed"
      || JSON.stringify(old.calls[0]) !== JSON.stringify(campaign.calls.at(-1))) throw Error("undispatched_storage_recovery_not_proven_no_repeat");
    report.executionHistory = [{ row: old, configuration: report.configuration,
      reason: "Reviewed atomic reservation rename failure occurred before network dispatch. Zero provider calls/charges; preserve the local non-dispatch record and continue the same question after bounded atomic-write recovery." }];
    report.rows = []; report.configuration = configuration;
  }
  if (RETEST2 && process.argv.includes("--approved-schema-repair-resume") && report.manifestHash === manifestHash
    && report.rows.length === 1 && report.rows[0].id === "R01" && report.rows[0].status !== "running"
    && !report.configurationHistory && JSON.stringify(report.configuration) !== JSON.stringify(configuration)) {
    report.configurationHistory = [{ throughQuestion: "R01", configuration: report.configuration, reason: "Initial nested schema bounds rejected by Google; zero-cost original probe and bounded $0.00093325 successful shape-only compatibility probe isolated these constraints. Server still enforces every count and length." }];
    report.configuration = configuration;
  }
  let planningReplay: import("./ask-planning-reuse").PlanningReplay[] | undefined;
  let originalTraceHash: string | undefined, originalTracePath: string | undefined;
  if (RESUME_PLANNING) {
    if (!CONNECTION_RETEST || report.manifestHash !== manifestHash || report.executionHistory || report.rows.length !== 1
      || report.rows[0].status !== "interrupted_process_exit" || campaign.calls.length !== 2 || campaign.stopped !== "planning_process_exit_reviewed")
      throw Error("planning_continuation_not_eligible_no_repeat");
    const old = report.rows[0];
    if (old.id !== "R01" || JSON.stringify(report.configuration.models) !== JSON.stringify(models)
      || JSON.stringify(report.configuration.flags) !== JSON.stringify(flags)) throw Error("planning_model_or_settings_changed");
    originalTracePath = resolve("work/local-ask-traces", `${old.requestId}.jsonl`);
    const originalTrace = readFileSync(originalTracePath, "utf8"); originalTraceHash = digest(originalTrace);
    const { settledPlanningResponses } = await import("./ask-planning-reuse");
    planningReplay = settledPlanningResponses(originalTrace.trim().split("\n").map(line => JSON.parse(line)), campaign.calls);
    report.executionHistory = [{ row: old, configuration: report.configuration, sourceTraceHash: originalTraceHash,
      reason: "Confirmed evaluator exit before terminal result. Preserve both settled planning responses; add evaluator keepalive and bounded hadith body consumption. Resume this same logical question, not another paid framing attempt." }];
    report.rows = []; report.configuration = configuration;
  }
  if (report.manifestHash !== manifestHash || JSON.stringify(report.configuration) !== JSON.stringify(configuration)) throw new Error("baseline_or_manifest_changed_no_resume");
  if (report.rows.some((r: any) => r.status === "running")) throw new Error("interrupted_question_requires_review_not_automatic_rerun");
  const save = () => {
    report.newCost = guard.actual - (report.priorCampaignCost ?? 0); report.campaignCost = guard.actual; report.combinedExposure = guard.exposure;
    report.notTested = orderedArabicCases().filter(c => !report.rows.some((r: any) => r.id === c.id)).map(c => c.id);
    persistCampaign(REPORT, report);
  };
  persistCampaign(resolve(ROOT, "questions.json"), { manifestHash, cases: orderedArabicCases() }); save();
  if (process.argv.includes("--dry-run")) { console.log(JSON.stringify({ status: "no_paid_calls", questions: 50, models, prices: campaign.prices, newAllowance: limits.cap - limits.priorExposure })); return; }
  const release = campaignLock(ORIGINAL, originalHash);
  if (SOURCE_CONTRACT_RETEST) {
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped!,
      authorization: "Mo explicitly said continue the goal after the failed single-attempt source review. One new R01 test of stage-specific checking, correction context and source-group assignment repairs, within the unspent existing $0.25 allowance. No cap increase, changed models/privacy/request maxima or automatic repeat of an interrupted/uncertain request." }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  if (RESUME_PLANNING) {
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped!,
      authorization: "Continue the already authorized single worship attempt from two exact settled planning responses. No added allowance, changed models, privacy or request maxima. Completed planning calls may not be paid again." }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  if (STAGED_RETEST) {
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped!,
      authorization: "Standing owner repair/test loop and request for a concrete live result. One fresh Arabic R01 test after the offline-verified hadith editorial and late-synthesis repairs. Use only the unspent existing additional 25-cent allowance, preserve prior charges/reservations, models, privacy and all per-call maxima. No automatic completed/uncertain call replay or new allowance." }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  if (ADJACENT_RETEST) {
    campaign.reviewStops = [...(campaign.reviewStops ?? []), { at: new Date().toISOString(), reason: campaign.stopped!,
      authorization: "Standing owner repair/test loop within the existing additional 25-cent cap. One explicit R01 retest of the changed retrieval revision after source review and zero-cost reproduced/fixed discovery and quota regressions. Checker remains unchanged and unaccepted; no new allowance or automatic completed/uncertain request repeat." }];
    delete campaign.stopped; persistCampaign(LEDGER, campaign);
  }
  const count = Number(process.argv.find(a => a.startsWith("--count="))?.slice(8) ?? 5);
  if (!Number.isSafeInteger(count) || count <= 0 || count > 5) { release(); throw new Error("batch_size_must_be_1_to_5"); }
  const { ask } = await import("../lib/ask/pipeline");
  const { stripAnswer } = await import("../lib/chat/answer-store");
  const { withAskRequest } = await import("../lib/ask/trace-context");
  const stripSection = (section: any) => stripAnswer({ version: 3, language: "ar", review: "automatic", sections: [section], complete: true, guide: "study_evidence" }).sections[0];
  const oldInfo = console.info;
  const originalUnchanged = () => ancestorUnchanged() && digest(readFileSync(ORIGINAL, "utf8")) === originalHash && (!FRESH || digest(readFileSync(PRIOR_LEDGER, "utf8")) === campaign.priorCampaign?.hash) && (!originalTracePath || digest(readFileSync(originalTracePath, "utf8")) === originalTraceHash);
  try {
    let dispatch = guard.dispatch(fetch, originalUnchanged);
    if (planningReplay) {
      const { reuseSettledPlanning } = await import("./ask-planning-reuse");
      dispatch = reuseSettledPlanning(planningReplay, dispatch, entry => {
        report.reusedPlanning = [...(report.reusedPlanning ?? []), { generationId: entry.receipt.generationId, paidAgain: false }]; save();
      });
    }
    await withModelTransport(dispatch, async () => {
      for (const item of (CONNECTION_RETEST ? orderedArabicCases().filter(c => c.id === "R01") : COORDINATION ? orderedArabicCases().filter(c => ["R01", "R03"].includes(c.id) && (!caseIds || caseIds.includes(c.id))) : LOOP ? orderedArabicCases().filter(c => !caseIds || caseIds.includes(c.id)) : RETEST ? orderedArabicCases().slice(0, WRITING_RETEST ? 1 : FOCUSED_RETEST ? 2 : 5) : orderedArabicCases()).filter(c => !report.rows.some((r: any) => r.id === c.id)).slice(0, count)) {
        const start = Date.now(), firstCall = campaign.calls.length, costBefore = guard.actual;
        if (COORDINATION) {
          if (!ADJACENT_RETEST && !STAGED_RETEST && campaign.evaluationCases?.some(c => c.id === item.id)) throw new Error("coordination_case_already_dispatched_no_automatic_repeat");
          if (item.id === "R03" && campaign.evaluationCases?.find(c => c.id === "R01")?.review !== "supported") throw new Error("worship_source_review_required_before_parents");
        }
        const row: any = { ...item, requestId: randomUUID(), status: "running", firstCheckedMs: null, sections: [], diagnostics: [], withdrawn: false, review: "pending" };
        if (COORDINATION) {
          campaign.evaluationCases = [...(campaign.evaluationCases ?? []), { id: item.id, requestId: row.requestId, reportPath: REPORT, revisionHash: configuration.trackedDiffHash, review: "pending" }];
          persistCampaign(LEDGER, campaign);
        }
        report.rows.push(row); report.status = "running"; save();
        console.info = (message: unknown) => {
          const line = String(message);
          if (line.startsWith("ask diagnostic: ")) { try { row.diagnostics.push(JSON.parse(line.slice(16))); } catch {} }
        };
        try {
          const result = await withAskRequest(row.requestId, () => ask(item.question, "ar", { onFrame: () => {} }, item.history ?? [], { rich: {
            onSection: section => { if (section.outcome === "ready" && row.firstCheckedMs === null) row.firstCheckedMs = Date.now() - start; row.sections.push(stripSection(section)); save(); },
            onWithdraw: () => { row.withdrawn = true; save(); },
          } }));
          row.status = result.status;
          row.result = result.status === "rich_answer" ? { ...result, answer: stripAnswer(result.answer) }
            : result.status === "incomplete" ? { status: result.status, withdraw: result.withdraw } : result;
        } catch (e) { row.status = "error"; row.error = e instanceof Error ? `${e.name}:${e.message}` : "unknown"; }
        finally { console.info = oldInfo; row.totalMs = Date.now() - start; row.cost = guard.actual - costBefore; row.callRange = [firstCall, campaign.calls.length]; row.calls = campaign.calls.slice(firstCall); save(); }
        console.log(JSON.stringify({ id: row.id, status: row.status, cost: row.cost, combinedExposure: guard.exposure, ms: row.totalMs, sections: row.sections.map((s: any) => `${s.group}:${s.outcome}`) }));
        if (campaign.stopped || campaign.calls.some(c => c.cost === undefined)) { report.status = campaign.stopped?.includes("budget") ? "stopped_budget" : "stopped_uncertain_charge"; save(); break; }
        if (row.error?.includes("campaign_budget")) { report.status = "stopped_budget"; save(); break; }
        const last = report.rows.slice(-3);
        if (last.length === 3 && last.every((r: any) => r.status === "error" && r.calls.some((c: any) => c.httpStatus >= 400))) { report.status = "stopped_three_transport_failures"; save(); break; }
      }
    });
    if (report.status === "running") report.status = "batch_finished_review_before_resume";
  } finally {
    console.info = oldInfo;
    if (CONNECTION_RETEST && !campaign.stopped) { campaign.stopped = SOURCE_CONTRACT_RETEST ? "source_contract_retest_finished_review_required" : "single_source_request_retest_finished_review_required"; persistCampaign(LEDGER, campaign); }
    if ((ADJACENT_RETEST || STAGED_RETEST) && !campaign.stopped) { campaign.stopped = STAGED_RETEST ? "staged_synthesis_retest_finished_review_required" : "adjacent_repair_retest_finished_review_required"; persistCampaign(LEDGER, campaign); }
    release(); save();
  }
  console.log(`Private report: ${REPORT}`);
}
// AbortSignal.timeout uses unreferenced timers. A local evaluator has no web
// server/worker heartbeat to keep Node alive while pending work settles.
const evaluationKeepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "campaign stopped"); process.exitCode = 1; })
  .finally(() => clearInterval(evaluationKeepAlive));
