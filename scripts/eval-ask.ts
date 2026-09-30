// Asks a batch of test questions through the real Ask pipeline and counts outcomes and failure
// reasons, so answer quality can be measured before and after a change. Local testing only:
//
//   npx tsx --conditions=react-server scripts/eval-ask.ts            (built-in questions)
//   add --file to use data/eval-questions.ts, --focused, --id=substring, --limit=N, --only=ar|en|de
//
// Prints status, failure reason codes and the cited source ids; never stores anything.
// Ends with the design phase 1 numbers (scripts/eval-metrics.ts), live and prepared answers separately.

process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

import { scoreAnswer } from "./eval-quality";
import { formatSummary, summarize, type CitedSource, type EvalOutcome, type EvalRow } from "./eval-metrics";
import { validateAnswerV2 } from "../lib/ask/answer-v2";
import { namedPassageGroups } from "../lib/ask/checks";
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
  const mode = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "live";
  if (mode !== "live" && mode !== "prepared") throw new Error("--mode must be live or prepared");
  // Prepared evaluation is an explicit local action. It may inspect matching approved fixtures even
  // while public prepared publishing remains safely disabled in the deployment environment.
  if (mode === "prepared") process.env.PREPARED_PUBLISHING_ENABLED = "true";
  const { ask, askPreparedOnly } = await import("@/lib/ask/pipeline");
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
  const metricRows: EvalRow[] = [];

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
    let origin: EvalRow["origin"] = "live";
    let structureOk: boolean | null = null;
    let mustContainPassed: string[] | null = null;
    let cited: CitedSource[] = [];
    let frame: QuestionFrame | undefined;
    let retrieved: unknown;
    let candidates: PassageForSelection[] = [];
    let selection: unknown;
    try {
      const trace = {
        onFrame: (value: QuestionFrame) => { frame = value; },
        onRetrieved: (value: unknown) => { retrieved = value; },
        onCandidates: (value: PassageForSelection[]) => { candidates = value; },
        onSelection: (value: unknown) => { selection = value; },
      };
      // Live mode always bypasses prepared matching. Prepared mode never falls through to a live
      // answer, so the two origins have honest answer-rate and latency numbers.
      const r = mode === "prepared" ? await askPreparedOnly(q.question) : await ask(q.question, q.lang, trace);
      const result = r ?? { status: "no_source" as const, language: q.lang };
      outcome = result.status;
      if (result.status === "answer") {
        origin = result.answer.prepared ? "prepared" : "live";
        // structure_ok: the AnswerV2 attached to a checked answer must pass the runtime validator.
        // Every shown answer must have AnswerV2; unconverted prepared answers are counted separately.
        if (result.answer.v2) structureOk = validateAnswerV2(result.answer.v2, origin === "prepared"
          ? { origin: "prepared", review: "bayan_reviewed" }
          : { origin: "live", review: "automatic", namedPassages: namedPassageGroups(q.question) }).ok;
        cited = result.answer.evidence.map((e) => ({ id: e.kind === "quran" ? `Q${e.key}` : e.key, kind: e.kind,
          ...(e.kind === "scholar" ? { scholarId: e.scholarId } : {}) }));
        refs = result.answer.evidence.map((e) => e.key.slice(0, 12)).join(" ");
        sentenceCount = result.answer.claims.length;
        core = result.answer.direct_answer.map((item) => item.text).join(" ").trim().toLocaleLowerCase(q.lang).replace(/\s+/g, " ");
        if (answerOutput) answer = { direct_answer: result.answer.direct_answer, explanation: result.answer.explanation,
          not_established: result.answer.not_established, evidence: result.answer.evidence.map((e) => ({ key: e.key, kind: e.kind })) };
      }
      if (q.mustContain?.length) {
        const missing = new Set(scoreAnswer(q as EvalQuestion, result).missingPoints);
        mustContainPassed = q.mustContain.map((item) => item.point).filter((point) => !missing.has(point));
      }
      if (q.focus) {
        const s = scoreAnswer(q as EvalQuestion, result);
        fullPass = result.status === "answer" && s.missingPoints.length === 0 && s.traps.length === 0;
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
    metricRows.push({ id: q.id, run, outcome: (outcome.startsWith("error") ? "error" : outcome) as EvalOutcome,
      origin, seconds: secs, structureOk, mustContainPassed, cited });
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
  const byId = new Map(questions.map((q) => [q.id, q as EvalQuestion]));
  for (const origin of ["live", "prepared"] as const) {
    const rows = metricRows.filter((row) => row.origin === origin);
    console.log(`
${formatSummary(summarize(rows, byId), origin === "live" ? "live pipeline (and all refusals)" : "prepared answers")}`);
  }
  if (traceOutput) writeFileSync(traceOutput, JSON.stringify(traceRows, null, 2));
  if (answerOutput) writeFileSync(answerOutput, JSON.stringify(answerRows, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
