// Evaluation numbers defined in design phase 1 (docs/answer-structure-design.md, section 9).
// Pure functions: no network, no AI, so tests can pin the definitions (tests/eval-metrics.test.ts).
// Live and prepared answers are always reported separately.

import type { EvalQuestion } from "../data/eval-questions";

export type EvalOutcome = "answer" | "source_only" | "no_summary" | "no_source" | "ask_scholar" | "out_of_scope" | "error";
export type CitedSource = { id: string; kind: "quran" | "hadith" | "scholar"; scholarId?: string };

export type EvalRow = {
  id: string;
  run: number;
  outcome: EvalOutcome;
  origin: "live" | "prepared"; // refusals come from the live pipeline
  seconds: number;
  structureOk: boolean | null; // null: no AnswerV2 to check (refusal, source-only or unconverted prepared answer)
  mustContainPassed: string[] | null; // null when the question has no must-contain points
  cited: CitedSource[]; // internal ids ("Q2:183")
};

type Rate = { count: number; of: number };

export type EvalSummary = {
  rows: number;
  structureOk: Rate & { answersWithoutV2: number };
  usefulExplanation: Rate; // checked explanation shown, among questions that expect an answer
  noSummary: Rate;
  sourceOnly: Rate;
  correctRefusal: Rate; // among questions that expect a refusal, scholar referral or out-of-scope reply
  mustContain: Rate; // rows whose question has must-contain points and all of them are present
  wrongSource: { count: number; answersChecked: number; answersUnreviewed: number };
  seconds: { p50: number | null; p90: number | null };
  stableRequiredPoints: Rate; // questions with exactly the same passed points in three answered runs
};

/** Does a cited source fall under the reviewed acceptable ids or classes? */
export function acceptedSource(source: CitedSource, acceptable: NonNullable<EvalQuestion["acceptableSources"]>): boolean {
  if (acceptable.ids?.includes(source.id)) return true;
  const verse = source.id.match(/^Q(\d{1,3}):(\d{1,3})$/);
  return (acceptable.classes ?? []).some((cls) => {
    if (cls === source.kind) return true;
    const quran = cls.match(/^quran:(\d{1,3})(?::(\d{1,3})-(\d{1,3}))?$/);
    if (quran && verse) {
      const [surah, ayah] = [Number(verse[1]), Number(verse[2])];
      if (surah !== Number(quran[1])) return false;
      return quran[2] === undefined || (ayah >= Number(quran[2]) && ayah <= Number(quran[3]));
    }
    const scholar = cls.match(/^scholar:([a-z0-9-]+)$/);
    return !!scholar && source.kind === "scholar" && source.scholarId === scholar[1];
  });
}

/** Cited ids outside the reviewed set, or null when nobody has reviewed the question's sources. */
export function wrongSources(row: EvalRow, question: EvalQuestion | undefined): string[] | null {
  if (!question?.acceptableSources) return null;
  return row.cited.filter((source) => !acceptedSource(source, question.acceptableSources!)).map((source) => source.id);
}

/** Nearest-rank percentile of whole seconds. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

const EXPECTED_REFUSAL: Record<string, EvalOutcome[]> = {
  refuse: ["no_source", "no_summary"],
  ask_scholar: ["ask_scholar"],
  out_of_scope: ["out_of_scope"],
};

export function summarize(rows: EvalRow[], questions: ReadonlyMap<string, EvalQuestion>): EvalSummary {
  const expectsAnswer = rows.filter((row) => questions.get(row.id)?.expect === "answer");
  const expectsOther = rows.filter((row) => {
    const expect = questions.get(row.id)?.expect;
    return !!expect && expect !== "answer";
  });
  const answered = rows.filter((row) => row.outcome === "answer");
  const withV2 = answered.filter((row) => row.structureOk !== null);
  const withPoints = rows.filter((row) => (questions.get(row.id)?.mustContain?.length ?? 0) > 0);
  const allPoints = (row: EvalRow) => (row.mustContainPassed?.length ?? 0) === questions.get(row.id)!.mustContain!.length;

  let wrong = 0;
  let checked = 0;
  let unreviewed = 0;
  for (const row of answered) {
    const result = wrongSources(row, questions.get(row.id));
    if (result === null) unreviewed += 1;
    else {
      checked += 1;
      wrong += result.length;
    }
  }

  // Stability: a question counts only with three runs; it is stable when all three answered and
  // passed exactly the same must-contain points.
  const byQuestion = new Map<string, EvalRow[]>();
  for (const row of withPoints) byQuestion.set(row.id, [...(byQuestion.get(row.id) ?? []), row]);
  const threeRuns = [...byQuestion.values()].filter((list) => list.length >= 3).map((list) => list.slice(0, 3));
  const stable = threeRuns.filter((list) => list.every((row) => row.outcome === "answer")
    && new Set(list.map((row) => [...(row.mustContainPassed ?? [])].sort().join("|"))).size === 1).length;

  const seconds = rows.map((row) => row.seconds);
  return {
    rows: rows.length,
    structureOk: { count: withV2.filter((row) => row.structureOk).length, of: withV2.length, answersWithoutV2: answered.length - withV2.length },
    usefulExplanation: { count: expectsAnswer.filter((row) => row.outcome === "answer").length, of: expectsAnswer.length },
    noSummary: { count: expectsAnswer.filter((row) => row.outcome === "no_summary").length, of: expectsAnswer.length },
    sourceOnly: { count: expectsAnswer.filter((row) => row.outcome === "source_only").length, of: expectsAnswer.length },
    correctRefusal: {
      count: expectsOther.filter((row) => EXPECTED_REFUSAL[questions.get(row.id)!.expect]?.includes(row.outcome)).length,
      of: expectsOther.length,
    },
    mustContain: { count: withPoints.filter((row) => row.outcome === "answer" && allPoints(row)).length, of: withPoints.length },
    wrongSource: { count: wrong, answersChecked: checked, answersUnreviewed: unreviewed },
    seconds: { p50: percentile(seconds, 50), p90: percentile(seconds, 90) },
    stableRequiredPoints: { count: stable, of: threeRuns.length },
  };
}

const rate = ({ count, of }: Rate) => (of === 0 ? "n/a" : `${count}/${of} (${Math.round((count / of) * 100)}%)`);

export function formatSummary(summary: EvalSummary, label: string): string {
  return [
    `== ${label}: ${summary.rows} runs ==`,
    `structure_ok: ${rate(summary.structureOk)}${summary.structureOk.answersWithoutV2 ? `, ${summary.structureOk.answersWithoutV2} answers without AnswerV2` : ""}`,
    `useful explanation rate: ${rate(summary.usefulExplanation)}`,
    `no_summary rate: ${rate(summary.noSummary)}`,
    `source-only rate: ${rate(summary.sourceOnly)}`,
    `correct refusal rate: ${rate(summary.correctRefusal)}`,
    `must-contain pass: ${rate(summary.mustContain)}`,
    `wrong-source count: ${summary.wrongSource.answersChecked === 0 ? "n/a (no reviewed acceptable sources)" : summary.wrongSource.count}`
      + ` (answers checked ${summary.wrongSource.answersChecked}, unreviewed ${summary.wrongSource.answersUnreviewed})`,
    `seconds p50/p90: ${summary.seconds.p50 ?? "n/a"}/${summary.seconds.p90 ?? "n/a"}`,
    `stable required points across three runs: ${summary.stableRequiredPoints.of === 0 ? "n/a (needs --runs=3)" : rate(summary.stableRequiredPoints)}`,
  ].join("\n");
}
