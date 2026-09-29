// Asks a batch of test questions through the real Ask pipeline and counts outcomes and failure
// reasons, so answer quality can be measured before and after a change. Local testing only:
//
//   npx tsx --conditions=react-server scripts/eval-ask.ts            (built-in questions)
//   add --file to use data/eval-questions.ts, --focused, --id=substring, --limit=N, --only=ar|en|de
//
// Prints status, failure reason codes and the cited source ids; never stores anything.

process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

import { scoreAnswer } from "./eval-quality";
import { writeFileSync } from "node:fs";
import type { EvalQuestion } from "../data/eval-questions";
import type { PassageForSelection, QuestionFrame } from "../lib/ask/retrieval";
type Q = Pick<EvalQuestion, "id" | "lang" | "question"> & Partial<Omit<EvalQuestion, "id" | "lang" | "question">>;

const BUILT_IN: Q[] = [
  { id: "fast-why-en", lang: "en", question: "Why do Muslims fast in Ramadan?", expect: "answer" },
  { id: "fast-why-de", lang: "de", question: "Warum fasten Muslime im Ramadan?", expect: "answer" },
  { id: "fast-why-ar", lang: "ar", question: "لماذا يصوم المسلمون في رمضان؟", expect: "answer" },
  { id: "jamaah-ar", lang: "ar", question: "ما حكم صلاة الجماعة؟", expect: "answer" },
  { id: "allah-en", lang: "en", question: "Who is Allah?", expect: "answer" },
  { id: "kursi-en", lang: "en", question: "What does Ayat al-Kursi say?", expect: "answer" },
  { id: "compulsion-en", lang: "en", question: "Can someone be forced to become Muslim?", expect: "answer" },
  { id: "qibla-de", lang: "de", question: "Warum beten Muslime Richtung Mekka?", expect: "answer" },
  { id: "riba-en", lang: "en", question: "Is interest allowed in Islam?", expect: "answer" },
  { id: "intention-en", lang: "en", question: "What did the Prophet say about intention?", expect: "answer" },
  { id: "tawassul-ar", lang: "ar", question: "ما حكم التوسل بالنبي؟", expect: "answer" },
  { id: "wives-en", lang: "en", question: "how many wives can i marry in islam and why", expect: "refuse" },
];

async function main() {
  const { ask } = await import("@/lib/ask/pipeline");
  let questions = BUILT_IN;
  if (process.argv.includes("--file")) {
    // Optional file written by another agent; loaded by path so a missing file never breaks the build.
    const mod = (await import(new URL("../data/eval-questions.ts", import.meta.url).href)) as { EVAL_QUESTIONS?: Q[] };
    questions = mod.EVAL_QUESTIONS ?? questions;
  }
  if (process.argv.includes("--focused")) questions = questions.filter((q) => q.focus);
  if (process.argv.includes("--phase3")) questions = [...questions.slice(0, 30), ...questions.filter((q) => q.focus)];
  const id = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  if (id) questions = questions.filter((q) => q.id.includes(id));
  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  if (only) questions = questions.filter((q) => q.lang === only);
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
  questions = questions.slice(0, limit);
  const traceOutput = process.argv.find((a) => a.startsWith("--trace-output="))?.slice("--trace-output=".length);
  const answerOutput = process.argv.find((a) => a.startsWith("--answer-output="))?.slice("--answer-output=".length);
  const runs = Math.max(1, Math.min(3, Number(process.argv.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 1)));
  const traceRows: unknown[] = [];
  const answerRows: { id: string; run: number; outcome: string; seconds: number; sentences: number; core: string;
    fullPass: boolean; answer?: unknown }[] = [];

  // Reason codes are printed through console.info by the pipeline when ASK_DEBUG=true; capture them.
  process.env.ASK_DEBUG = "true";
  const tally = new Map<string, number>();
  const reasons = new Map<string, number>();
  for (const q of questions.flatMap((item) => Array.from({ length: runs }, () => item))) {
    const run = (answerRows.filter((row) => row.id === q.id).length) + 1;
    const seen: string[] = [];
    const info = console.info;
    console.info = (msg: unknown) => {
      const m = String(msg).match(/^ask refused: (.+)$/);
      if (m) seen.push(m[1]);
    };
    const start = Date.now();
    let outcome: string;
    let refs = "";
    let score = "";
    let sentenceCount = 0;
    let core = "";
    let fullPass = false;
    let answer: unknown;
    let frame: QuestionFrame | undefined;
    let retrieved: unknown;
    let candidates: PassageForSelection[] = [];
    let selection: unknown;
    try {
      const r = await ask(q.question, q.lang, traceOutput ? {
        onFrame: (value) => { frame = value; },
        onRetrieved: (value) => { retrieved = value; },
        onCandidates: (value) => { candidates = value; },
        onSelection: (value) => { selection = value; },
      } : undefined);
      outcome = r.status === "answer" ? (r.answer.sourceOnly ? "source_only" : "answer") : r.status;
      if (r.status === "answer") {
        refs = r.answer.evidence.map((e) => e.key.slice(0, 12)).join(" ");
        sentenceCount = r.answer.claims.length;
        core = r.answer.direct_answer.map((item) => item.text).join(" ").trim().toLocaleLowerCase(q.lang).replace(/\s+/g, " ");
        if (answerOutput) answer = { direct_answer: r.answer.direct_answer, explanation: r.answer.explanation,
          not_established: r.answer.not_established, evidence: r.answer.evidence.map((e) => ({ key: e.key, kind: e.kind })) };
      }
      if (q.focus) {
        const s = scoreAnswer(q as EvalQuestion, r);
        fullPass = r.status === "answer" && s.missingPoints.length === 0 && s.traps.length === 0;
        score = ` accuracy=${s.accuracy} completeness=${s.completeness} support=${s.sourceSupport} clarity=${s.clarity}`;
        if (s.missingPoints.length) score += ` missing=${s.missingPoints.join("|")}`;
        if (s.traps.length) score += ` traps=${s.traps.join("|")}`;
      }
    } catch (err) {
      outcome = `error: ${(err as Error).message.slice(0, 60)}`;
    } finally {
      console.info = info;
    }
    if (traceOutput) traceRows.push({
      id: q.id, outcome, reasons: seen,
      frame: frame ? { kind: frame.kind, type: frame.questionType, requirements: frame.requirements, searchQueries: frame.searchQueries } : null,
      retrieved: retrieved ?? null,
      candidates: candidates.map((candidate) => ({ id: candidate.id, kind: candidate.source.kind,
        title: candidate.source.kind === "scholar" ? candidate.source.quote.title : null,
        url: candidate.source.kind === "scholar" ? candidate.source.quote.url : candidate.source.kind === "quran" ? candidate.source.verse.url : candidate.source.hadith.url,
      })),
      selection: selection && typeof selection === "object" ? (selection as { assessments?: unknown }).assessments ?? null : null,
    });
    const secs = Math.round((Date.now() - start) / 1000);
    answerRows.push({ id: q.id, run, outcome, seconds: secs, sentences: sentenceCount, core, fullPass,
      ...(answerOutput ? { answer } : {}) });
    const important = seen.filter((s) => !/^(video|scholar|hadith)_/.test(s));
    console.log(`${q.id.padEnd(16)} #${run} ${outcome.padEnd(12)} ${String(secs).padStart(3)}s ${sentenceCount} sentences  ${important.join(",")}  ${refs}${score}`);
    tally.set(outcome, (tally.get(outcome) ?? 0) + 1);
    for (const s of important) reasons.set(s, (reasons.get(s) ?? 0) + 1);
  }
  console.log("\nOutcomes:", Object.fromEntries(tally));
  console.log("Reasons:", Object.fromEntries(reasons));
  const answered = answerRows.filter((row) => row.outcome === "answer");
  console.log("Average sentences/full answer:", answered.length ? (answered.reduce((sum, row) => sum + row.sentences, 0) / answered.length).toFixed(2) : "n/a");
  console.log("Average seconds/question:", (answerRows.reduce((sum, row) => sum + row.seconds, 0) / answerRows.length).toFixed(2));
  if (runs > 1) for (const q of questions) {
    const rows = answerRows.filter((row) => row.id === q.id);
    const cores = rows.filter((row) => row.core).map((row) => row.core);
    console.log(`${q.id}: ${rows.filter((row) => row.fullPass).length}/${runs} full pass; `
      + `${cores.length === runs && new Set(cores).size === 1 ? runs : 0}/${runs} same exact core wording`);
  }
  if (traceOutput) writeFileSync(traceOutput, JSON.stringify(traceRows, null, 2));
  if (answerOutput) writeFileSync(answerOutput, JSON.stringify(answerRows, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
