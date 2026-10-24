// Offline actual chooser replay, Quran subset only. No model/network/ledger writes.
import { readFileSync } from "node:fs";
import { chooseSealedPackage } from "../lib/ask/package";
import { RICH_CAPS } from "../lib/ask/rich-engine";
import type { SelectedPassage } from "../lib/ask/retrieval";

export function recordedQuranDiversity() {
  const bytes = readFileSync("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl", "utf8");
  const events = bytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const input = events.find(e => e.event === "model_request" && e.data.call_id === "A7").data.prompt;
  const assessments = events.find(e => e.event === "model_response" && e.data.call_id === "A7").data.value.quran_assessments;
  const pool: SelectedPassage[] = input.quran_candidates.flatMap((p: any) => {
    const a = assessments.find((a: any) => a.source_id === p.source.id);
    if (a.context_safe !== "yes" || !(a.relevance === "direct" || a.relevance === "partial" && a.contribution.role === "direct") || !a.supported_requirement_ids.length) return [];
    const key = p.source.id.slice(1);
    return [{ id: p.source.id, context: [], requirementIds: a.supported_requirement_ids, explanationRequirementIds: [], contribution: a.contribution, facets: [],
      source: { kind: "quran", verse: { key, arabic: p.source.arabic, arabicPlain: p.source.arabic, translations: { en: p.source.translation_en, de: null }, url: `https://quran.com/${key.replace(":", "/")}` } } }];
  });
  const options = { caps: RICH_CAPS, tierOrder: true };
  const before = chooseSealedPackage(pool, ["R1", "R2"], options)!;
  const after = chooseSealedPackage(pool, ["R1", "R2"], { ...options, diverseQuranFillers: true })!;
  const saved = events.find(e => e.event === "model_request" && e.data.call_id === "A8").data.prompt.evidence_package.passages.filter((p: any) => p.type === "quran").map((p: any) => p.id).sort();
  if (JSON.stringify(before.passages.map(p => p.id).sort()) !== JSON.stringify(saved)) throw Error("Quran_subset_does_not_reproduce_actual_package");
  return { pool, before, after, contextFromSelection: input.quran_candidates, traceBytes: bytes };
}
if (process.argv.includes("--inspect")) {
  const c = recordedQuranDiversity();
  console.log(JSON.stringify({ scope: "Quran-only actual chooser replay, not full selection or semantic acceptance", before: c.before.passages.map(p => p.id), after: c.after.passages.map(p => p.id), cardsBefore: c.before.cards.length, cardsAfter: c.after.cards.length, modelCalls: 0 }));
}
