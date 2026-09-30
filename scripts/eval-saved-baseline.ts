// Reads an OLD saved eval-ask text log and prints only the design phase 1 numbers that the saved
// lines can support. No AI, network or database. Usage:
//   npx tsx scripts/eval-saved-baseline.ts docs/eval-2026-09-29-baseline.txt
// Old logs have no answer text, no AnswerV2 and truncated source ids, so structure_ok, must-contain,
// wrong-source and stability are reported as not available rather than guessed.

import { readFileSync } from "node:fs";
import { EVAL_QUESTIONS } from "../data/eval-questions";
import { summarize, type EvalOutcome, type EvalRow } from "./eval-metrics";

const OUTCOMES: EvalOutcome[] = ["answer", "source_only", "no_summary", "no_source", "ask_scholar", "out_of_scope"];

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/eval-saved-baseline.ts <saved eval-ask log>");
  process.exit(1);
}
const rows: EvalRow[] = [];
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const match = line.match(/^(\S+)\s+(?:#(\d+)\s+)?(\S+)\s+(\d+)s\b/);
  if (!match || !OUTCOMES.includes(match[3] as EvalOutcome)) continue;
  rows.push({ id: match[1], run: Number(match[2] ?? 1), outcome: match[3] as EvalOutcome, origin: "live",
    seconds: Number(match[4]), structureOk: null, mustContainPassed: null, cited: [] });
}
const questions = new Map(EVAL_QUESTIONS.map((q) => [q.id, q]));
const unknown = rows.filter((row) => !questions.has(row.id)).length;
const s = summarize(rows, questions);
const rate = ({ count, of }: { count: number; of: number }) => (of === 0 ? "n/a" : `${count}/${of} (${Math.round((count / of) * 100)}%)`);
console.log([
  `== OLD RESULTS from ${file} (not a new run): ${rows.length} runs${unknown ? `, ${unknown} ids not in data/eval-questions.ts` : ""} ==`,
  `useful explanation rate: ${rate(s.usefulExplanation)}`,
  `source-only rate: ${rate(s.sourceOnly)}`,
  `no_summary rate: ${rate(s.noSummary)} (status did not exist then)`,
  `correct refusal rate: ${rate(s.correctRefusal)}`,
  `seconds p50/p90: ${s.seconds.p50 ?? "n/a"}/${s.seconds.p90 ?? "n/a"}`,
  "structure_ok, must-contain pass, wrong-source count, stable required points: not available in the old log",
].join("\n"));
