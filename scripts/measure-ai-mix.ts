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

import { writeFileSync } from "node:fs";
import { GoogleBusyError } from "../lib/ai/gemini";

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
  reasons: string[]; steps: string[]; answered: string[]; skipped: string[]; retries: number; error?: string;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function main() {
  process.env.ASK_DEBUG = "true";
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) ?? Infinity);
  const only = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  const { ask } = await import("@/lib/ask/pipeline");
  const questions = QUESTIONS.filter((q) => !only || q.id.includes(only)).slice(0, limit);
  console.log(`writer chain: ${process.env.AI_MODELS ?? "(default)"} | checker chain: ${process.env.AI_VERIFIER_MODELS ?? "(default)"}`);
  const rows: Row[] = [];
  for (const q of questions) {
    const row: Row = { id: q.id, lang: q.lang, expect: q.expect, outcome: "", seconds: 0, reasons: [], steps: [], answered: [], skipped: [], retries: 0 };
    const info = console.info;
    console.info = (msg: unknown) => {
      const m = String(msg);
      let x: RegExpMatchArray | null;
      if ((x = m.match(/^ask refused: (.+)$/))) row.reasons.push(x[1]);
      else if ((x = m.match(/^ask step: (.+)$/))) row.steps.push(x[1]);
      else if ((x = m.match(/^ai answered: (.+)$/))) row.answered.push(x[1]);
      else if ((x = m.match(/^ai skipped: (.+)$/))) row.skipped.push(x[1]);
      else if (/busy \(\d+\), retrying once/.test(m)) row.retries += 1;
    };
    const started = Date.now();
    try {
      // The trace argument skips prepared answers, so every question goes through the live pipeline.
      const result = await ask(q.question, q.lang, {});
      row.outcome = result.status;
    } catch (err) {
      const name = err instanceof Error ? err.name : "Error";
      row.outcome = name === "TimeoutError" ? "timeout" : err instanceof GoogleBusyError ? "busy" : "error";
      row.error = err instanceof Error ? `${err.name}: ${err.message.slice(0, 120)}` : "unknown";
    } finally {
      console.info = info;
    }
    row.seconds = Math.round((Date.now() - started) / 100) / 10;
    rows.push(row);
    console.log(`${q.id.padEnd(22)} ${row.outcome.padEnd(13)} ${String(row.seconds).padStart(5)}s  ${row.reasons.join(",")}  skipped:${row.skipped.length} retries:${row.retries}`);
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
    modelsUsed: [...new Set(rows.flatMap((r) => r.answered))],
  };
  console.log(JSON.stringify(summary, null, 2));
  if (out) writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), summary, rows }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "failed");
  process.exit(1);
});
