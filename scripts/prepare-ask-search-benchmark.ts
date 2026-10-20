// Preparation only: reuses the frozen multilingual checklist without inventing approvals.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { BenchmarkIntent } from "../lib/ask/search-engine/benchmark";
import { validateBenchmark } from "../lib/ask/search-engine/benchmark";
import shared from "../tests/fixtures/ask-shared-cases.json";
import { additionalSearchIntents } from "./ask-search-intents";

export function prepareBenchmark(): BenchmarkIntent[] {
  const all = [...shared.cases, ...additionalSearchIntents.map(([id, category, en, ar, de]) => ({ id, category, questions: { en, ar, de }, concerns: [en] }))];
  return all.map(c => ({ id: c.id, split: createHash("sha256").update(c.id).digest()[0] % 4 === 0 ? "held_out" : "tuning", category: c.category,
    questions: c.questions, concerns: c.concerns, corpusAnswerability: "unknown", sourceReview: { status: "pending", reviewer: null, at: null, indexGeneration: null }, evidenceUnits: [],
  }));
}
export function main() {
  const cases = prepareBenchmark(); validateBenchmark(cases);
  const out = resolve("work/private-ask-evaluation/search-benchmark-draft.json");
  mkdirSync(dirname(out), { recursive: true });
  if (existsSync(out)) {
    if (!process.argv.includes("--replace-draft")) throw new Error("Existing draft preserved. Use --replace-draft only after preserving any source review work.");
    const prior = JSON.parse(readFileSync(out, "utf8"));
    if (prior.cases?.some((c: BenchmarkIntent) => c.sourceReview.status !== "pending" || c.sourceReview.reviewer || c.evidenceUnits.length)) throw new Error("Review annotations exist. Preserve this file separately before generating another draft.");
  }
  writeFileSync(out, JSON.stringify({ version: 1, status: "draft_requires_source_and_native_language_review", origin: "Existing frozen multilingual checklist plus drafted research questions; no religious evidence labels invented", cases }, null, 2));
  console.log(JSON.stringify({ out, intents: cases.length, languageVersions: cases.length * 3, reviewed: 0, paidCalls: 0, targetIntents: 100 }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
