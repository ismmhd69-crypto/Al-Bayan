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
import type { EvalQuestion } from "../data/eval-questions";
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
  const id = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  if (id) questions = questions.filter((q) => q.id.includes(id));
  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  if (only) questions = questions.filter((q) => q.lang === only);
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
  questions = questions.slice(0, limit);

  // Reason codes are printed through console.info by the pipeline when ASK_DEBUG=true; capture them.
  process.env.ASK_DEBUG = "true";
  const tally = new Map<string, number>();
  const reasons = new Map<string, number>();
  for (const q of questions) {
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
    try {
      const r = await ask(q.question, q.lang);
      outcome = r.status === "answer" ? (r.answer.sourceOnly ? "source_only" : "answer") : r.status;
      if (r.status === "answer") refs = r.answer.evidence.map((e) => e.key.slice(0, 12)).join(" ");
      if (q.focus) {
        const s = scoreAnswer(q as EvalQuestion, r);
        score = ` accuracy=${s.accuracy} completeness=${s.completeness} support=${s.sourceSupport} clarity=${s.clarity}`;
        if (s.missingPoints.length) score += ` missing=${s.missingPoints.join("|")}`;
        if (s.traps.length) score += ` traps=${s.traps.join("|")}`;
      }
    } catch (err) {
      outcome = `error: ${(err as Error).message.slice(0, 60)}`;
    } finally {
      console.info = info;
    }
    const secs = Math.round((Date.now() - start) / 1000);
    const important = seen.filter((s) => !/^(video|scholar|hadith)_/.test(s));
    console.log(`${q.id.padEnd(16)} ${outcome.padEnd(12)} ${String(secs).padStart(3)}s  ${important.join(",")}  ${refs}${score}`);
    tally.set(outcome, (tally.get(outcome) ?? 0) + 1);
    for (const s of important) reasons.set(s, (reasons.get(s) ?? 0) + 1);
  }
  console.log("\nOutcomes:", Object.fromEntries(tally));
  console.log("Reasons:", Object.fromEntries(reasons));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
