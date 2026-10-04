// Measures the Ask pipeline with whatever AI models the environment selects (AI_MODELS /
// AI_VERIFIER_MODELS), on 20 fixed questions. Local testing only; never stores anything in the database.
//
//   npx tsx --conditions=react-server scripts/measure-ai-mix.ts --out=<file.json> [--limit=N] [--id=substring]
//
// Per question: outcome, seconds, step timings, which model answered each step, which were skipped
// and why (busy, timeout, local limit). Prints model ids and reason codes only, never keys.

process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { GoogleBusyError } from "../lib/ai/gemini";
import { AskSpendStop, installSpendGuard } from "./ask-spend-guard";
import { sharedAskLedgerPath } from "./ask-test-profile";

type Expect = "answer" | "refuse";
const QUESTIONS: { id: string; lang: "en" | "de" | "ar"; question: string; expect: Expect }[] = [
  { id: "prayer-en", lang: "en", question: "Why do Muslims pray five times a day?", expect: "answer" },
  { id: "zakah-en", lang: "en", question: "Is zakah obligatory and who has to pay it?", expect: "answer" },
  { id: "fasting-en", lang: "en", question: "Why do Muslims fast in Ramadan?", expect: "answer" },
  { id: "riba-en", lang: "en", question: "Is interest allowed in Islam?", expect: "answer" },
  { id: "divorce-en", lang: "en", question: "How many times can a husband divorce his wife and take her back?", expect: "answer" },
  { id: "hijab-en", lang: "en", question: "Is the hijab obligatory for Muslim women?", expect: "answer" },
  { id: "music-en", lang: "en", question: "What do scholars say about listening to music?", expect: "answer" },
  { id: "suffering-en", lang: "en", question: "Why does God allow suffering?", expect: "answer" },
  { id: "quran-preserved-en", lang: "en", question: "Has the Quran been preserved without change?", expect: "answer" },
  { id: "intention-hadith-en", lang: "en", question: "What did the Prophet say about intentions?", expect: "answer" },
  { id: "personal-en", lang: "en", question: "My husband said 'you are divorced' three times yesterday while angry, are we still married?", expect: "refuse" },
  { id: "offtopic-en", lang: "en", question: "What is the best recipe for chocolate cake?", expect: "refuse" },
  { id: "fasting-de", lang: "de", question: "Warum fasten Muslime im Ramadan?", expect: "answer" },
  { id: "qibla-de", lang: "de", question: "Warum beten Muslime Richtung Mekka?", expect: "answer" },
  { id: "hajj-de", lang: "de", question: "Ist die Pilgerfahrt (Hadsch) Pflicht?", expect: "answer" },
  { id: "offtopic-de", lang: "de", question: "Wer hat die Fußball-Weltmeisterschaft 2014 gewonnen?", expect: "refuse" },
  { id: "jamaah-ar", lang: "ar", question: "ما حكم صلاة الجماعة؟", expect: "answer" },
  { id: "riba-ar", lang: "ar", question: "ما حكم الربا؟", expect: "answer" },
  { id: "compulsion-ar", lang: "ar", question: "هل يجوز إكراه أحد على الإسلام؟", expect: "answer" },
  { id: "tawhid-ar", lang: "ar", question: "ما معنى التوحيد؟", expect: "answer" },
];

type Row = {
  id: string; lang: string; expect: Expect; outcome: string; seconds: number;
  reasons: string[]; steps: string[]; answered: string[]; skipped: string[]; retries: number; costUsd: number; answer?: unknown; error?: string;
  calls?: { body: Record<string, unknown>; response: unknown }[];
  frame?: unknown; candidates?: unknown; selection?: unknown; finalReason?: string; failedStep?: string;
};

const ADDITIONS: typeof QUESTIONS = [
  { id: "home-quran-en", lang: "en", question: "How do we know the Quran was not changed?", expect: "answer" },
  { id: "home-purpose-en", lang: "en", question: "What is the purpose of life in Islam?", expect: "answer" },
  { id: "home-suffering-en", lang: "en", question: "If God is good, why is there suffering?", expect: "answer" },
  { id: "home-sword-en", lang: "en", question: "Was Islam spread by the sword?", expect: "answer" },
  { id: "actions-intentions-en", lang: "en", question: "Are actions judged by intentions in Islam", expect: "answer" },
  { id: "patience-en", lang: "en", question: "What does the Quran say about patience?", expect: "answer" },
];

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function checkpoint(path: string, value: unknown) {
  const bytes = JSON.stringify(value, null, 2);
  for (let attempt = 0; ; attempt++) {
    try { writeFileSync(`${path}.tmp`, bytes); renameSync(`${path}.tmp`, path); return; }
    catch { if (attempt >= 4) throw new Error("evaluation checkpoint could not be saved"); }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

async function main() {
  process.env.ASK_DEBUG = "true";
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) ?? Infinity);
  const only = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  const phase = process.argv.find((a) => a.startsWith("--phase="))?.slice(8);
  const claimAudit = process.argv.find((a) => a.startsWith("--claim-audit="))?.slice(14);
  if (claimAudit !== undefined && (!phase || !["on", "off"].includes(claimAudit))) throw new AskSpendStop("claim-audit comparison requires a phase and on/off");
  const approved = process.argv.includes("--approved");
  const prior = process.argv.includes("--resume") && out ? JSON.parse(readFileSync(out, "utf8")) as { at: string; rows: Row[]; phase?: string; claimAudit?: string } : undefined;
  if (prior && prior.phase !== phase) throw new Error("resume phase mismatch");
  if (prior && prior.claimAudit !== claimAudit) throw new Error("resume audit mode mismatch");
  const at = prior?.at ?? new Date().toISOString();
  let activeRow: Row | undefined;
  let budget: ReturnType<typeof installSpendGuard> | undefined;
  if (phase) {
    if (!["baseline", "repaired"].includes(phase) || !out) throw new AskSpendStop("phase and output are required");
    if (!process.env.OPENROUTER_API_KEY) throw new AskSpendStop("OpenRouter key is not configured");
    for (const name of ["AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", "AI_PROVIDER", "AI_VERIFIER_PROVIDER"]) delete process.env[name];
    process.env.QURAN_API_ENV = "production";
    process.env.QURAN_CHAPTERS = "";
    process.env.HADITH_SOURCE = "library";
    process.env.SHOW_AI_TRANSLATIONS = "true";
    process.env.OPENROUTER_REASONING = "low";
    process.env.OPENROUTER_PRIVACY = "zdr";
    process.env.ASK_LEAN = "false";
    // Claim-audit comparisons hold tiered mode OFF in both arms; never change two variables together.
    process.env.ASK_TIERED = claimAudit !== undefined ? "false" : phase === "repaired" ? "true" : "false";
    process.env.ASK_CLAIM_AUDIT = claimAudit === "on" ? "true" : "false";
    process.env.PREPARED_PUBLISHING_ENABLED = "true";
    budget = installSpendGuard(sharedAskLedgerPath(), (body, response) => activeRow?.calls?.push({ body, response }));
  }
  try {
  const { ask } = await import("@/lib/ask/pipeline");
  const full = phase ? [ADDITIONS[0], ...QUESTIONS, ...ADDITIONS.slice(1)] : QUESTIONS;
  const questions = full.filter((q) => !only || q.id.includes(only)).slice(0, limit).filter((q) => !prior?.rows.some((r) => r.id === q.id));
  console.log(`writer chain: ${process.env.AI_MODELS ?? "(default)"} | checker chain: ${process.env.AI_VERIFIER_MODELS ?? "(default)"}`);
  const rows: Row[] = prior?.rows ?? [];
  // Stop early when the real spend reaches the cap (OPENROUTER_STOP_USD, default 0.80).
  const stopAt = Number(process.env.OPENROUTER_STOP_USD) || 0.8;
  let spent = rows.reduce((sum, r) => sum + r.costUsd, 0);
  for (const q of questions) {
    if (spent >= stopAt) { console.log(`STOPPED: spend reached $${spent.toFixed(4)}`); break; }
    const row: Row = { id: q.id, lang: q.lang, expect: q.expect, outcome: "", seconds: 0, reasons: [], steps: [], answered: [], skipped: [], retries: 0, costUsd: 0 };
    if (phase) row.calls = [];
    activeRow = row;
    const info = console.info;
    console.info = (msg: unknown) => {
      const m = String(msg);
      let x: RegExpMatchArray | null;
      if ((x = m.match(/^ask refused: (.+)$/))) row.reasons.push(x[1]);
      else if ((x = m.match(/^ask step: (.+)$/))) row.steps.push(x[1]);
      else if ((x = m.match(/^ai answered: (.+)$/))) row.answered.push(x[1]);
      else if ((x = m.match(/^ai skipped: (.+)$/))) row.skipped.push(x[1]);
      else if ((x = m.match(/^ai cost: \S+ ([0-9.e-]+)$/))) row.costUsd += Number(x[1]);
      else if (/busy \(\d+\), retrying once/.test(m)) row.retries += 1;
    };
    const started = Date.now();
    try {
      // The trace argument skips prepared answers, so every question goes through the live pipeline.
      const result = await ask(q.question, q.lang, approved ? undefined : {
        onFrame: (frame) => { if (phase) row.frame = frame; },
        onCandidates: (candidates) => { if (phase) row.candidates = candidates; },
        onSelection: (selection) => { if (phase) row.selection = selection; },
      });
      row.outcome = result.status;
      if (result.status === "answer") row.answer = result.answer;
    } catch (err) {
      const name = err instanceof Error ? err.name : "Error";
      row.outcome = name === "TimeoutError" ? "timeout" : err instanceof GoogleBusyError || name === "GoogleBusyError" ? "busy" : "error";
      row.error = err instanceof Error ? `${err.name}: ${err.message.slice(0, 120)}` : "unknown";
    } finally {
      console.info = info;
    }
    row.seconds = Math.round((Date.now() - started) / 100) / 10;
    rows.push(row);
    row.finalReason = row.outcome === "answer" ? undefined : row.reasons.at(-1);
    row.failedStep = row.outcome === "answer" ? undefined : row.steps.at(-1)?.replace(/ at .+$/, "");
    spent += row.costUsd;
    console.log(`${q.id.padEnd(22)} ${row.outcome.padEnd(13)} ${String(row.seconds).padStart(5)}s  ${row.reasons.join(",")}  skipped:${row.skipped.length} retries:${row.retries} $${row.costUsd.toFixed(5)}`);
    if (out) await checkpoint(out, { at, phase, claimAudit, approved, rows });
    if (row.error?.startsWith("AskSpendStop:") || budget?.guard.ledger.stopped) break;
  }

  const failed = (r: Row) => ["timeout", "busy", "error"].includes(r.outcome);
  const correct = (r: Row) => r.expect === "refuse" ? r.outcome !== "answer" && !failed(r) : !failed(r);
  const unsafe = rows.filter((r) => r.expect === "refuse" && r.outcome === "answer");
  const secs = rows.map((r) => r.seconds);
  const summary = {
    questions: rows.length,
    correctOrSafeRefusal: rows.filter(correct).length,
    answered: rows.filter((r) => r.outcome === "answer").length,
    answeredOfExpected: `${rows.filter((r) => r.expect === "answer" && r.outcome === "answer").length}/${rows.filter((r) => r.expect === "answer").length}`,
    timeoutsOrBusyOrErrors: rows.filter(failed).length,
    answeredWhenItShouldRefuse: unsafe.map((r) => r.id),
    medianSeconds: percentile(secs, 50),
    p95Seconds: percentile(secs, 95),
    skips: rows.reduce((n, r) => n + r.skipped.length, 0),
    skipReasons: rows.flatMap((r) => r.skipped.map((s) => s.replace(/^.*\((.*)\).*$/, "$1"))),
    retries: rows.reduce((n, r) => n + r.retries, 0),
    costUsdTotal: Number(spent.toFixed(5)),
    costUsdPerQuestion: rows.length ? Number((spent / rows.length).toFixed(5)) : 0,
    refusalReasons: rows.flatMap((r) => r.reasons),
    modelsUsed: [...new Set(rows.flatMap((r) => r.answered))],
    // The historical denominator counts music as answerable; keep it above for comparison.
    answerableExcludingMusic: `${rows.filter((r) => r.expect === "answer" && r.id !== "music-en" && r.outcome === "answer").length}/${rows.filter((r) => r.expect === "answer" && r.id !== "music-en").length}`,
    actualExperimentSpend: budget?.guard.actual,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (out) await checkpoint(out, { at, finishedAt: new Date().toISOString(), phase, claimAudit, approved, summary, rows });
  } finally { budget?.close(); }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "failed");
  process.exit(1);
});
