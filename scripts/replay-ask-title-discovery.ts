// Frozen catalogue evaluation only. Explicitly supplied search concepts, not a
// claim that the real planning model has already generated these phrases.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { rankHadithTitles, hadithSearchTerms } from "../lib/sources/hadith";
const root = "work/private-ask-evaluation/reliability-20261026/frozen-failures";
const report = [];
for (const language of ["en", "ar"] as const) {
  const records: { id: string; title: string }[] = JSON.parse(readFileSync(`${root}/titles-${language}.json`, "utf8"));
  const entries = records.map(r => ({ ...r, terms: hadithSearchTerms(r.title) }));
  const initial = language === "en" ? ["evidence Islam is true", "how to know Islam is true"] : ["أدلة صدق الإسلام", "كيف يعرف صحة الإسلام"];
  const concepts = language === "en" ? ["prophets miracles people believed", "prophet revelation"] : ["الأنبياء آمن البشر", "نبي وحي"];
  const before = rankHadithTitles(entries, initial, 8), after = rankHadithTitles(entries, concepts, 8);
  assert(after.includes("65231"), `Missing target in ${language}`);
  const negative = rankHadithTitles(entries, language === "en" ? ["portents Hour knowledge"] : ["أشراط الساعة العلم"], 8);
  assert(!negative.includes("65231"), `Unrelated concept promoted target in ${language}`);
  report.push({ language, catalogueSize: records.length, targetFoundBefore: before.includes("65231"), targetFoundAfter: true, before, after, unrelatedQueryTargetFound: false });
}
writeFileSync(`${root}/discovery-report.json`, JSON.stringify({ modelCalls: 0, modelGeneratedQueries: false, report }, null, 2));
console.log(JSON.stringify({ modelCalls: 0, modelGeneratedQueries: false, report }, null, 2));
