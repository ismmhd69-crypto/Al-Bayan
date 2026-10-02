// Before/after measurement for tiered evidence (docs/tiered-ask-plan.md). Each question runs in the
// old mode and then in the tiered mode, with the same models. Local testing only; nothing is stored in
// the database. Prints ids, outcomes, source kinds, timings and reason codes, never keys.
//
//   npx tsx --conditions=react-server scripts/measure-tiered-ask.ts --out=docs/tiered-ask-measure.json [--limit=N] [--id=substring]

process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}
// The measured setup (Mo's brief, 2026-10-02). Set after the env files so it always wins.
Object.assign(process.env, {
  AI_MODELS: "gemini-3.5-flash-lite,nvidia:nvidia/nemotron-3-super-120b-a12b",
  AI_VERIFIER_MODELS: "gemini-3.1-flash-lite,nvidia:openai/gpt-oss-20b",
  QURAN_API_ENV: "production",
  QURAN_CHAPTERS: "",
  HADITH_SOURCE: "library",
  SHOW_AI_TRANSLATIONS: "true",
  ASK_DEBUG: "true",
});

import { writeFileSync } from "node:fs";

type Expect = "answer" | "refuse";
const QUESTIONS: { id: string; lang: "en" | "de" | "ar"; question: string; expect: Expect }[] = [
  { id: "intentions-en", lang: "en", question: "Are actions judged by intentions in Islam?", expect: "answer" },
  { id: "patience-en", lang: "en", question: "What does Islam say about patience in hardship?", expect: "answer" },
  { id: "prayer-en", lang: "en", question: "Is prayer obligatory for every Muslim?", expect: "answer" },
  { id: "zakah-en", lang: "en", question: "Is zakah obligatory and who has to pay it?", expect: "answer" },
  { id: "riba-en", lang: "en", question: "Is interest (riba) allowed in Islam?", expect: "answer" },
  { id: "parents-en", lang: "en", question: "What does Islam teach about honouring parents?", expect: "answer" },
  { id: "lying-en", lang: "en", question: "Is lying a sin in Islam?", expect: "answer" },
  { id: "hijab-en", lang: "en", question: "Is the hijab obligatory for Muslim women?", expect: "answer" },
  { id: "suffering-en", lang: "en", question: "Why does God allow suffering?", expect: "answer" },
  { id: "compulsion-en", lang: "en", question: "Can someone be forced to become Muslim?", expect: "answer" },
  { id: "personal-en", lang: "en", question: "My husband said 'you are divorced' three times yesterday while angry, are we still married?", expect: "refuse" },
  { id: "intentions-de", lang: "de", question: "Werden die Taten im Islam nach den Absichten beurteilt?", expect: "answer" },
  { id: "patience-de", lang: "de", question: "Was sagt der Islam über Geduld?", expect: "answer" },
  { id: "prayer-de", lang: "de", question: "Ist das Gebet für jeden Muslim Pflicht?", expect: "answer" },
  { id: "zakah-de", lang: "de", question: "Wer muss Zakat zahlen?", expect: "answer" },
  { id: "riba-de", lang: "de", question: "Sind Zinsen im Islam erlaubt?", expect: "answer" },
  { id: "parents-de", lang: "de", question: "Wie soll ein Muslim seine Eltern behandeln?", expect: "answer" },
  { id: "lying-de", lang: "de", question: "Ist Lügen im Islam verboten?", expect: "answer" },
  { id: "fasting-de", lang: "de", question: "Warum fasten Muslime im Ramadan?", expect: "answer" },
  { id: "mercy-hell-de", lang: "de", question: "Wenn Allah barmherzig ist, warum gibt es die Hölle?", expect: "answer" },
  { id: "offtopic-de", lang: "de", question: "Wer hat die Fußball-Weltmeisterschaft 2014 gewonnen?", expect: "refuse" },
  { id: "intentions-ar", lang: "ar", question: "هل الأعمال بالنيات في الإسلام؟", expect: "answer" },
  { id: "patience-ar", lang: "ar", question: "ما فضل الصبر على البلاء؟", expect: "answer" },
  { id: "prayer-ar", lang: "ar", question: "ما حكم ترك الصلاة؟", expect: "answer" },
  { id: "zakah-ar", lang: "ar", question: "ما حكم الزكاة وعلى من تجب؟", expect: "answer" },
  { id: "riba-ar", lang: "ar", question: "ما حكم الربا؟", expect: "answer" },
  { id: "parents-ar", lang: "ar", question: "ما حكم بر الوالدين؟", expect: "answer" },
  { id: "lying-ar", lang: "ar", question: "ما حكم الكذب؟", expect: "answer" },
  { id: "backbiting-ar", lang: "ar", question: "ما حكم الغيبة؟", expect: "answer" },
  { id: "music-ar", lang: "ar", question: "ما حكم الاستماع إلى الموسيقى؟", expect: "answer" },
];

type Mode = "old" | "tiered";
type Row = {
  id: string; lang: string; expect: Expect; mode: Mode; outcome: string; seconds: number;
  quran: number; hadith: number; scholars: number; videos: number; firstKind: string | null;
  reasons: string[]; steps: string[]; answered: string[]; skipped: string[]; error?: string;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function summarise(rows: Row[]) {
  const answerable = rows.filter((r) => r.expect === "answer");
  const answers = rows.filter((r) => r.outcome === "answer");
  const share = (pick: (r: Row) => boolean) => `${answers.filter(pick).length}/${answers.length}`;
  const secs = rows.map((r) => r.seconds);
  return {
    questions: rows.length,
    answered: `${answerable.filter((r) => r.outcome === "answer").length}/${answerable.length}`,
    refusalRate: `${answerable.filter((r) => r.outcome !== "answer").length}/${answerable.length}`,
    mustRefuseRefused: `${rows.filter((r) => r.expect === "refuse" && r.outcome !== "answer").length}/${rows.filter((r) => r.expect === "refuse").length}`,
    answersWithVerse: share((r) => r.quran > 0),
    answersWithHadith: share((r) => r.hadith > 0),
    answersWithFatwa: share((r) => r.scholars > 0),
    answersWithVideos: share((r) => r.videos > 0),
    answersOpeningWithQuran: share((r) => r.firstKind === "quran"),
    errorsOrTimeouts: rows.filter((r) => ["timeout", "error", "busy"].includes(r.outcome)).length,
    medianSeconds: percentile(secs, 50),
    p95Seconds: percentile(secs, 95),
    outcomes: Object.fromEntries([...new Set(rows.map((r) => r.outcome))].map((o) => [o, rows.filter((r) => r.outcome === o).length])),
  };
}

async function main() {
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) ?? Infinity);
  const only = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  const { ask } = await import("@/lib/ask/pipeline");
  const questions = QUESTIONS.filter((q) => !only || q.id.includes(only)).slice(0, limit);
  console.log(`writer chain: ${process.env.AI_MODELS} | checker chain: ${process.env.AI_VERIFIER_MODELS}`);
  const rows: Row[] = [];
  const save = () => {
    if (!out) return;
    const byMode = (mode: Mode) => summarise(rows.filter((r) => r.mode === mode));
    writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), models: { writer: process.env.AI_MODELS, checker: process.env.AI_VERIFIER_MODELS },
      summary: { old: byMode("old"), tiered: byMode("tiered") }, rows }, null, 2));
  };
  for (const q of questions) {
    for (const mode of ["old", "tiered"] as const) {
      process.env.ASK_TIERED = mode === "tiered" ? "true" : "false";
      const row: Row = { id: q.id, lang: q.lang, expect: q.expect, mode, outcome: "", seconds: 0, quran: 0, hadith: 0, scholars: 0,
        videos: 0, firstKind: null, reasons: [], steps: [], answered: [], skipped: [] };
      const info = console.info;
      console.info = (msg: unknown) => {
        const m = String(msg);
        let x: RegExpMatchArray | null;
        if ((x = m.match(/^ask refused: (.+)$/))) row.reasons.push(x[1]);
        else if ((x = m.match(/^ask step: (.+)$/))) row.steps.push(x[1]);
        else if ((x = m.match(/^ai answered: (.+)$/))) row.answered.push(x[1]);
        else if ((x = m.match(/^ai skipped: (.+)$/))) row.skipped.push(x[1]);
      };
      const started = Date.now();
      try {
        // The trace argument skips prepared answers, so every question goes through the live pipeline.
        const result = await ask(q.question, q.lang, {});
        row.outcome = result.status;
        if (result.status === "answer") {
          const v2 = result.answer.v2;
          row.quran = v2?.quran.length ?? 0;
          row.hadith = v2?.hadith.length ?? 0;
          row.scholars = v2?.scholars.length ?? 0;
          row.videos = result.answer.videos?.length ?? 0;
          const first = result.answer.claims[0]?.refs[0];
          row.firstKind = !first ? null : /^\d/.test(first) ? "quran" : /^(HE|SH)/.test(first) ? "hadith" : "scholar";
        }
      } catch (err) {
        const name = err instanceof Error ? err.name : "Error";
        row.outcome = name === "TimeoutError" ? "timeout" : /busy|429|503/i.test(err instanceof Error ? err.message : "") ? "busy" : "error";
        row.error = err instanceof Error ? `${err.name}: ${err.message.slice(0, 120)}` : "unknown";
      } finally {
        console.info = info;
      }
      row.seconds = Math.round((Date.now() - started) / 100) / 10;
      rows.push(row);
      save();
      console.log(`${q.id.padEnd(16)} ${mode.padEnd(7)} ${row.outcome.padEnd(12)} ${String(row.seconds).padStart(5)}s  Q${row.quran} H${row.hadith} S${row.scholars} V${row.videos}  ${row.reasons.join(",")}`);
    }
  }
  console.log(JSON.stringify({ old: summarise(rows.filter((r) => r.mode === "old")), tiered: summarise(rows.filter((r) => r.mode === "tiered")) }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "failed");
  process.exit(1);
});
