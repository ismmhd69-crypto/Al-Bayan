// Source-only matched query experiment. No AI providers or spending ledger writes.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pointSearchPlans, interleaveUnique } from "../lib/ask/library-flow";
import { buildSearchQueries, type QuestionFrame } from "../lib/ask/retrieval";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

async function main() {
  const traceBytes = readFileSync(resolve("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"), "utf8");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const raw = events.find(e => e.event === "model_response" && e.data.call_id === "A2").data.value;
  const frame: QuestionFrame = { kind: raw.kind, language: raw.language, questionType: raw.question_type, subjects: raw.subjects, qualifiers: raw.qualifiers,
    requiredFacets: [...new Set(raw.requested_points.map((r: any) => r.facet))] as any,
    searchQueries: { ar: raw.search_queries_ar, en: raw.search_queries_en, de: raw.search_queries_de },
    requirements: raw.requested_points.map((r: any, i: number) => ({ id: `R${i + 1}`, text: r.text, facet: r.facet, searchQueries: r.search_queries, quranArabic: r.quran_ar, hadithArabic: r.hadith_ar })) };
  const oldPlans = pointSearchPlans(frame);
  const recorded = events.filter(e => e.event === "source_started" && e.data.source === "search").map(e => e.data.input[0]);
  if (oldPlans.some((p, i) => JSON.stringify(p.quran) !== JSON.stringify(recorded[i]))) throw Error("actual_old_query_plan_changed");
  // Fixed before source calls: one source-wording phrase, one visitor-language
  // concept phrase, then one phrase per remaining language, within four slots.
  const plans = oldPlans.map((old, i) => {
    const point = frame.requirements[i], focused = point.searchQueries!;
    const candidates = [...(point.quranArabic?.slice(0, 1) ?? []), ...(focused[frame.language]?.slice(0, 1) ?? []),
      ...["ar", "en", "de"].filter(l => l !== frame.language).flatMap(l => focused[l as "ar" | "en" | "de"]?.slice(0, 1) ?? []),
      ...(point.quranArabic?.slice(1) ?? []), ...buildSearchQueries({ ...frame, searchQueries: focused })];
    const proposed = [...new Set(candidates)].slice(0, 4);
    return { id: old.id, old: old.quran, proposed };
  });
  const target = resolve("work/private-ask-evaluation/quran-query-balance-control-20261024.json");
  if (existsSync(target)) throw Error("completed_source_control_no_automatic_repeat");
  const queries = [...new Set(plans.flatMap(p => [...p.old, ...p.proposed]))];
  if (queries.length > 12) throw Error("source_query_bound_exceeded");
  if (!process.argv.includes("--source-only-live")) { console.log(JSON.stringify({ status: "offline_no_calls", plans, uniqueQueries: queries.length })); return; }
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8");
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  const { searchQuran, getVerse } = await import("../lib/sources/quran");
  const report: any = { status: "source_only_running", scope: "Same saved two concern plans and four source queries per method, shared overlapping live responses. Candidate recall only; no source selection, generated answer or accuracy claim. Query-budget tradeoff is removal of additional same-language/source phrases, not guaranteed universal superiority.",
    traceHash: digest(traceBytes), plans, expectedUsefulKeysFixedBeforeCalls: ["51:56", "35:15", "41:46", "45:15", "31:12"], results: [], modelCalls: 0, modelCost: 0 };
  const save = () => persistCampaign(target, report);
  save();
  try {
    for (const query of queries) {
      const row: any = { query, started: Date.now(), status: "running" }; report.results.push(row); save();
      try { row.keys = await searchQuran([query], 20); row.status = "returned"; }
      catch { row.keys = []; row.status = "source_failed"; }
      row.ms = Date.now() - row.started; delete row.started; save();
      if (report.results.slice(-3).every((r: any) => r.status === "source_failed") && report.results.length >= 3) break;
    }
    const keys = (qs: string[]) => interleaveUnique<string>(qs.map(q => report.results.find((r: any) => r.query === q)?.keys ?? []), k => k, 16);
    report.comparison = plans.map(p => ({ id: p.id, oldKeys: keys(p.old), proposedKeys: keys(p.proposed) }));
    report.targetOriginals = [];
    for (const key of report.expectedUsefulKeysFixedBeforeCalls) {
      if (!report.comparison.some((p: any) => [...p.oldKeys, ...p.proposedKeys].includes(key))) continue;
      const original = await getVerse(key); if (original) report.targetOriginals.push(original);
    }
    report.status = report.results.length === queries.length && report.results.every((r: any) => r.status === "returned") ? "source_component_review_required" : "partial_source_failure_review_required";
  } finally {
    if (readFileSync(ledgerPath, "utf8") !== ledgerBytes) throw Error("source_control_changed_model_ledger");
    save();
  }
  console.log(JSON.stringify({ status: report.status, queries: report.results.length, comparison: report.comparison, originals: report.targetOriginals?.map((v: any) => v.key), modelCalls: 0 }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "source_control_failed"); process.exitCode = 1; });
