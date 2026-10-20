// Controlled fixture questions only. Never imported by the website. The shared spend guard is
// mandatory, including before importing any provider. No website/API keys are printed.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import manifest from "../tests/fixtures/ask-library-evaluation.json";
import { FROZEN_LIBRARY_HASH } from "./evaluate-ask-library";
import { sharedAskLedgerPath } from "./ask-test-profile";
import { installSpendGuard } from "./ask-spend-guard";
import { stripAnswer } from "../lib/chat/answer-store";
import type { Locale } from "../lib/i18n";
import { abortable } from "../lib/ask/abort";
import { FROZEN_SHARED_HASH, sharedLiveCases } from "./ask-shared-cases";

export function guardedRichChains(...chains: string[]) {
  return chains.length === 2 && chains.every(chain => chain.length > 0 && chain.split("|fallback:").every(id => id.startsWith("openrouter/")));
}

export type RichMeasurement = { id: string; outcome: string; firstCheckedMs: number | null; totalMs: number; cost: number;
  sources: { quran: number; hadith: number; scholar: number }; groups: Record<string, string>; result: unknown };
export function richMeasurementSummary(rows: RichMeasurement[], expectedCases: number) {
  const completed = rows.filter(r => r.outcome === "rich_answer");
  const timed = completed.filter(r => r.firstCheckedMs !== null && r.totalMs > 0);
  return { cases: rows.length, matchedSetComplete: rows.length === expectedCases && new Set(rows.map(r => r.id)).size === expectedCases,
    automaticRichCompletions: completed.length, preparedAnswers: rows.filter(r => r.outcome === "answer").length,
    referrals: rows.filter(r => r.outcome === "ask_scholar").length, clarifications: rows.filter(r => r.outcome === "clarify").length,
    incomplete: rows.filter(r => r.outcome === "incomplete").length, technicalErrors: rows.filter(r => r.outcome === "error").length,
    timingPairs: timed.map(r => ({ id: r.id, firstCheckedMs: r.firstCheckedMs, totalMs: r.totalMs, fractionEarlier: 1 - r.firstCheckedMs! / r.totalMs })),
    thirtyPercentEarlierCases: timed.filter(r => r.firstCheckedMs! <= r.totalMs * .7).length,
    cost: rows.reduce((sum, r) => sum + r.cost, 0),
    costPerAutomaticRichCompletion: completed.length ? rows.reduce((sum, r) => sum + r.cost, 0) / completed.length : null,
    sourceFaithfulnessAcceptance: "not_established_by_automatic_completion" };
}

/** Matched measurements only. Timing comparisons cannot establish source faithfulness. */
export function compareRichMeasurements(current: RichMeasurement[], baseline: RichMeasurement[], expectedCases: number) {
  const unique = (rows: RichMeasurement[]) => rows.length === expectedCases && new Set(rows.map(r => r.id)).size === rows.length;
  const matched = current.flatMap(c => {
    const b = baseline.find(row => row.id === c.id);
    return b && c.outcome === "rich_answer" && b.outcome === "rich_answer" ? [{ id: c.id,
      firstCheckedMs: { baseline: b.firstCheckedMs, current: c.firstCheckedMs }, totalMs: { baseline: b.totalMs, current: c.totalMs },
      cost: { baseline: b.cost, current: c.cost }, sources: { baseline: b.sources, current: c.sources } }] : [];
  });
  return { matchedSetComplete: unique(current) && unique(baseline) && current.every(c => baseline.some(b => b.id === c.id)),
    completedPairs: matched, manualReview: "source faithfulness, completeness, usefulness and translation alignment still require review" };
}

async function main() {
  const shared = process.argv.includes("--shared-six");
  const cases: { id: string; lang: string; question: string; previous_user_messages?: string[]; referenceHints?: boolean }[] = shared ? sharedLiveCases() : manifest.cases;
  const out = process.argv.find(a => a.startsWith("--out="))?.slice(6);
  const privateRoot = resolve("work", "private-ask-evaluation");
  if (!out || !resolve(out).startsWith(privateRoot + sep) || existsSync(out)) throw new Error("use a new report under work/private-ask-evaluation");
  const hash = createHash("sha256").update(readFileSync(shared ? "tests/fixtures/ask-shared-cases.json" : "tests/fixtures/ask-library-evaluation.json")).digest("hex");
  if (hash !== (shared ? FROZEN_SHARED_HASH : FROZEN_LIBRARY_HASH)) throw new Error("evaluation manifest changed");
  const rows: RichMeasurement[] = [];
  const baselineFile = process.argv.find(a => a.startsWith("--baseline="))?.slice(11);
  let baseline: RichMeasurement[] | undefined;
  let baselineModelProfile: string | undefined;
  if (baselineFile) {
    if (!resolve(baselineFile).startsWith(privateRoot + sep)) throw new Error("baseline must be a private evaluation report");
    const recorded = JSON.parse(readFileSync(baselineFile, "utf8"));
    if (recorded.manifestHash !== hash || !Array.isArray(recorded.rows) || recorded.rows.some((r: RichMeasurement) =>
      !cases.some(c => c.id === r.id) || typeof r.outcome !== "string" || !Number.isFinite(r.totalMs) || r.totalMs < 0
      || !Number.isFinite(r.cost) || r.cost < 0 || (r.firstCheckedMs !== null && (!Number.isFinite(r.firstCheckedMs) || r.firstCheckedMs < 0)))) throw new Error("baseline does not match the frozen case set");
    baseline = recorded.rows;
    baselineModelProfile = recorded.modelProfile;
  }
  const report = { at: new Date().toISOString(), manifestHash: hash, status: "not_run", blocked: "", rows,
    modelProfile: "existing environment and model chains; opt-in rich path", comparison: "Matched baseline and source-faithfulness review still required; completion is not acceptance",
    baselineComparison: baseline ? compareRichMeasurements(rows, baseline, cases.length) : null, summary: richMeasurementSummary(rows, cases.length) };
  mkdirSync(dirname(out), { recursive: true });
  const save = () => writeFileSync(out, JSON.stringify(report, null, 2));
  if (process.argv.includes("--dry-run")) { report.status = "manifest_verified_no_calls"; save(); return; }
  let budget: ReturnType<typeof installSpendGuard> | undefined;
  try {
    budget = installSpendGuard(sharedAskLedgerPath()); // rejects the recorded unsettled call before any imports/network
    for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
    const { getProvider, getVerifier } = await import("../lib/ai");
    const writer = getProvider().id, checker = getVerifier().id;
    if (!guardedRichChains(writer, checker)) throw new Error("current model chains include a provider outside the spending guard; no calls allowed");
    report.modelProfile = JSON.stringify({ writer, checker, hadith: process.env.HADITH_SOURCE ?? "off", scholarEnabled: process.env.SCHOLAR_QUOTES !== "off" });
    if (baseline && baselineModelProfile !== report.modelProfile) throw new Error("baseline model/source profile differs; no comparison calls allowed");
    const { ask } = await import("../lib/ask/pipeline");
    for (const c of cases) {
      const started = Date.now(), costBefore = budget.guard.actual;
      const row: RichMeasurement = { id: c.id, outcome: "running", firstCheckedMs: null, totalMs: 0, cost: 0,
        sources: { quran: 0, hadith: 0, scholar: 0 }, groups: {}, result: null };
      rows.push(row); save();
      const stop = new AbortController();
      const signal = AbortSignal.any([stop.signal, AbortSignal.timeout(55_000)]);
      try {
        // A controlled trace skips prepared reuse; this measures the live pipeline itself.
        const result = await abortable(ask(c.question, c.lang as Locale, shared ? { onFrame: () => {} } : undefined, c.previous_user_messages, { signal, disableReferenceHints: shared && c.referenceHints === false, rich: {
          onSection: section => { if (row.firstCheckedMs === null && section.outcome === "ready") row.firstCheckedMs = Date.now() - started; row.groups[section.group] = section.outcome; },
        } }), signal);
        row.outcome = result.status;
        // Keep source ids and our explanations, never long-term copies of Quran/hadith texts.
        row.result = result.status === "rich_answer" ? { ...result, answer: stripAnswer(result.answer) }
          : result.status === "answer" ? { status: "answer", prepared: result.answer.prepared === true, answer: result.answer.v2 ? stripAnswer(result.answer.v2) : null }
          : result.status === "incomplete" ? { status: result.status, withdraw: result.withdraw } : result;
        if (result.status === "rich_answer") for (const kind of ["quran", "hadith", "scholar"] as const) row.sources[kind] = new Set(result.answer.sections.flatMap(s => s.sources.filter(source => source.evidence.kind === kind).map(source => source.id))).size;
      } catch { row.outcome = "error"; row.result = null; }
      finally { stop.abort(); row.totalMs = Date.now() - started; row.cost = budget.guard.actual - costBefore; report.summary = richMeasurementSummary(rows, cases.length); save(); }
      if (budget.guard.ledger.stopped || budget.guard.ledger.entries.some(e => e.cost === undefined)) throw new Error("billing unresolved; no further cases allowed");
    }
    report.status = "completed_requires_independent_review";
  } catch (error) { report.status = "blocked_or_incomplete"; report.blocked = error instanceof Error ? error.message : "evaluation stopped"; }
  finally { report.summary = richMeasurementSummary(rows, cases.length); report.baselineComparison = baseline ? compareRichMeasurements(rows, baseline, cases.length) : null; save(); budget?.close(); }
  if (report.status === "blocked_or_incomplete") process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error("evaluation could not start; no reservation released"); process.exitCode = 1; });
