// Controlled public questions only. Offline manifest verification is free. Paid mode requires the
// original shared ledger; outputs with controlled model text must stay in an ignored private path.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import manifest from "../tests/fixtures/ask-library-evaluation.json";
import type { Locale } from "../lib/i18n";
import type { Answer } from "../lib/ask/core";
import { applyAskTestProfile, sharedAskLedgerPath } from "./ask-test-profile";
import { installSpendGuard } from "./ask-spend-guard";

export const FROZEN_LIBRARY_HASH = "0467f5de302aae918e36ad47ae36c43f771f6879c726e4384b3666ea1b784b00";
export type Review = { complete: boolean; supported: boolean; reason: string };
export type Measurement = { id: string; expected: string; outcome: string; seconds: number; cost: number; reasons: string[];
  review?: Review; sources: { quran: number; hadith: number; scholar: number } };
export function libraryEvaluationSummary(rows: Measurement[]) {
  const answerable = rows.filter((r) => r.expected === "complete_answer" || r.expected === "complete_answer_or_clarification");
  const complete = answerable.filter((r) => r.outcome === "answer" && r.review?.complete === true && r.review?.supported === true);
  const percentile = (p: number) => { const sorted = rows.map((r) => r.seconds).sort((a, b) => a - b); return sorted.length ? sorted[Math.ceil(p * sorted.length) - 1] : null; };
  const sources = rows.reduce((sum, r) => ({ quran: sum.quran + r.sources.quran, hadith: sum.hadith + r.sources.hadith, scholar: sum.scholar + r.sources.scholar }), { quran: 0, hadith: 0, scholar: 0 });
  return { cases: rows.length, answerable: answerable.length, returnedAnswers: rows.filter((r) => r.outcome === "answer").length,
    manuallyAcceptedComplete: complete.length, acceptedRate: answerable.length ? complete.length / answerable.length : null,
    unreviewedAnswers: rows.filter((r) => r.outcome === "answer" && !r.review).length,
    partial: rows.filter((r) => r.outcome === "answer" && r.review?.complete === false).length,
    knownUnsupported: rows.filter((r) => r.review?.supported === false).length,
    clarifications: rows.filter((r) => r.outcome === "clarify").length,
    expectedSafeRefusals: rows.filter((r) => r.expected === "safe_refusal" && ["no_source", "ask_scholar", "out_of_scope"].includes(r.outcome)).length,
    incorrectRefusalCaseAnswers: rows.filter((r) => r.expected === "safe_refusal" && r.outcome === "answer").length,
    medianSeconds: percentile(0.5), p95Seconds: percentile(0.95), citedSourceCounts: sources,
    citedSourceShares: Object.fromEntries(Object.entries(sources).map(([kind, count]) => [kind, count / Math.max(1, sources.quran + sources.hadith + sources.scholar)])),
    cost: rows.reduce((sum, r) => sum + r.cost, 0),
    roundCostPerAcceptedAnswer: complete.length ? rows.reduce((sum, r) => sum + r.cost, 0) / complete.length : null,
    refusalReasons: [...new Set(rows.flatMap((r) => r.reasons))],
  };
}
export function libraryAcceptance(baseline: Measurement[], repaired: Measurement[], repeatedRoundsComplete: boolean, claimAuditGatesPassed: boolean) {
  const before = libraryEvaluationSummary(baseline), after = libraryEvaluationSummary(repaired);
  const matched = baseline.length === manifest.cases.length && repaired.length === manifest.cases.length
    && new Set(baseline.map((r) => r.id)).size === manifest.cases.length && new Set(repaired.map((r) => r.id)).size === manifest.cases.length
    && manifest.cases.every((c) => baseline.some((r) => r.id === c.id && r.expected === c.expected)
      && repaired.some((r) => r.id === c.id && r.expected === c.expected));
  const originalIds = new Set(manifest.cases.filter((c) => c.cohort === "original26").map((c) => c.id));
  const original = libraryEvaluationSummary(repaired.filter((r) => originalIds.has(r.id)));
  return { matched, originalAcceptedRate: original.acceptedRate, accepted: matched && repeatedRoundsComplete && claimAuditGatesPassed
    && after.unreviewedAnswers === 0 && after.knownUnsupported === 0 && after.incorrectRefusalCaseAnswers === 0
    && (after.acceptedRate ?? 0) >= 0.85 && (original.acceptedRate ?? 0) >= 0.85 && !!before.medianSeconds && !!before.p95Seconds
    && (after.medianSeconds ?? Infinity) <= before.medianSeconds * 1.1 && (after.p95Seconds ?? Infinity) <= before.p95Seconds * 1.1 };
}
async function main() {
  const hash = createHash("sha256").update(readFileSync("tests/fixtures/ask-library-evaluation.json")).digest("hex");
  if (hash !== FROZEN_LIBRARY_HASH) throw new Error("frozen evaluation changed; acceptance invalid");
  const option = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const out = option("out"), arm = option("arm"), mode = option("mode") ?? "live", round = Number(option("round"));
  if (!out || !["baseline", "repaired"].includes(arm ?? "") || ![1, 2].includes(round) || !["live", "approved"].includes(mode)) throw new Error("out, arm, round and mode required");
  const privateRoot = resolve("work", "private-ask-evaluation");
  if (!resolve(out).startsWith(`${privateRoot}${sep}`)) throw new Error("controlled captures must stay under work/private-ask-evaluation");
  mkdirSync(dirname(out), { recursive: true });
  if (existsSync(out)) throw new Error("do not overwrite an earlier round or discard its cost");
  const rows: (Measurement & Record<string, unknown>)[] = [];
  const report = { at: new Date().toISOString(), arm, round, mode, manifestHash: hash, status: "not_run", blocked: "", newCost: 0, rows,
    activeCase: null as { id: string; controlledModelCalls: typeof calls } | null,
    summary: libraryEvaluationSummary(rows), config: { quran: "production/all chapters", hadith: "library", models: "current defaults, nonoverlapping", claimAudit: false, tiered: false, libraryFlow: arm === "repaired" } };
  const save = () => writeFileSync(out, JSON.stringify(report, null, 2));
  if (process.argv.includes("--dry-run")) { report.status = "offline_manifest_verified_no_calls"; save(); return; }
  if (round === 2) {
    const previous = option("previous-round");
    if (!previous || !resolve(previous).startsWith(`${privateRoot}${sep}`)) throw new Error("round 2 requires its private first-round report");
    const first = JSON.parse(readFileSync(previous, "utf8"));
    const firstStarted = Date.parse(first.at);
    if (first.arm !== arm || first.mode !== mode || first.round !== 1 || first.manifestHash !== hash
      || first.status !== "completed_requires_original_source_review_and_matched_rounds"
      || first.rows?.length !== manifest.cases.length || !Number.isFinite(firstStarted) || Date.now() - firstStarted < 30 * 60 * 1000) {
      throw new Error("first round is mismatched, incomplete or less than 30 minutes old");
    }
  }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  applyAskTestProfile(arm === "repaired");
  let budget: ReturnType<typeof installSpendGuard> | undefined;
  let before = 0;
  let calls: { model: unknown; messages: unknown; maxOutputTokens: unknown; response: unknown }[] = [];
  try {
    // Reject an unresolved reservation before importing providers or making any network call.
    budget = installSpendGuard(sharedAskLedgerPath(), (body, response) => {
      // Only fixed public cases, privately saved. Never request headers, credentials or visitor data.
      calls.push({ model: body.model, messages: body.messages, maxOutputTokens: body.max_tokens, response });
      report.newCost = (budget?.guard.actual ?? before) - before;
      save(); // Preserve each controlled response even if a later stage fails or the run stops.
    }); before = budget.guard.actual;
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter is not configured");
    const { ask, askPreparedOnly } = await import("../lib/ask/pipeline");
    for (const c of manifest.cases) {
      calls = [];
      report.activeCase = { id: c.id, controlledModelCalls: calls }; save();
      const trace: Record<string, unknown> = {}; const reasons: string[] = [];
      const costBefore = budget.guard.actual, started = Date.now();
      const statusInfo = console.info;
      console.info = (line: unknown) => { const match = String(line).match(/^ask refused: ([a-z0-9_]+)$/); if (match) reasons.push(match[1]); };
      let result;
      try {
        process.env.ASK_DEBUG = "true";
        result = mode === "approved" ? await askPreparedOnly(c.question)
          : await ask(c.question, c.lang as Locale, { onFrame: (value) => { trace.frame = value; }, onRetrieved: (value) => { trace.retrieved = value; },
            onCandidates: (value) => { trace.candidates = value; }, onSelection: (value) => { trace.selection = value; },
            onCoverage: (stage, value) => { trace[`${stage}Coverage`] = value; } }, c.previous_user_messages);
      } finally { console.info = statusInfo; }
      const sourceCounts = { quran: 0, hadith: 0, scholar: 0 };
      if (result?.status === "answer") for (const e of (result.answer as Answer).evidence) sourceCounts[e.kind]++;
      rows.push({ id: c.id, expected: c.expected, outcome: result?.status ?? "no_approved_match", seconds: (Date.now() - started) / 1000,
        cost: budget.guard.actual - costBefore, reasons, sources: sourceCounts, trace, result, controlledModelCalls: calls });
      report.activeCase = null;
      report.newCost = budget.guard.actual - before; report.status = "running_requires_original_source_review"; report.summary = libraryEvaluationSummary(rows); save();
    }
    report.status = "completed_requires_original_source_review_and_matched_rounds";
  } catch (error) {
    report.status = "blocked_or_incomplete"; report.blocked = error instanceof Error ? error.message : "evaluation failed";
  } finally {
    if (budget) report.newCost = budget.guard.actual - before;
    report.summary = libraryEvaluationSummary(rows); save(); budget?.close();
  }
  if (report.status === "blocked_or_incomplete") process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error("evaluation could not start; no reservation released"); process.exitCode = 1; });
