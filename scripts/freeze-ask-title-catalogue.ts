// Existing public source only. No model calls, API credentials or database changes.
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { readHadithTitleCatalogue } from "../lib/sources/hadith";
import { withResearchRuntime } from "../lib/ask/research-runtime";
async function main() { for (const language of ["en", "ar"] as const) {
  const path = `work/private-ask-evaluation/reliability-20261026/frozen-failures/titles-${language}.json`;
  const titles = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : await withResearchRuntime(Infinity, () => readHadithTitleCatalogue(language));
  if (!existsSync(path)) writeFileSync(path, JSON.stringify(titles));
  console.log(JSON.stringify({ language, titles: titles.length, modelCalls: 0 }));
} }
main().catch(error => { console.error(`Title snapshot failed: ${error instanceof Error ? error.message : "source unavailable"}. No model calls were made.`); process.exitCode = 1; });
