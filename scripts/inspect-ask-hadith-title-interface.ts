// Source-discovery diagnosis only. No model calls, overrides or answer generation.
// The known source below is an evaluation control, never inserted in production.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pointSearchPlans } from "../lib/ask/library-flow";
import { parseQuestionFrame } from "../lib/ask/retrieval";
import { parseHadith, hadithAllowed } from "../lib/sources/hadith-rules";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

async function main() {
  const path = resolve("work/private-ask-evaluation/hadith-title-interface-20261024.json");
  if (existsSync(path)) throw Error("completed_probe_not_repeated");
  const tracePath = resolve("work/local-ask-traces/fadc13d1-9af2-402a-b490-4af97684233f.jsonl"), traceBytes = readFileSync(tracePath, "utf8");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const raw = events.find(e => e.event === "model_response" && e.data.phase === "frame")?.data.value;
  const frame = parseQuestionFrame(raw), plan = frame && pointSearchPlans(frame).find(p => p.id === "R1");
  if (!frame || !plan || !plan.hadith.ar?.length) throw Error("recorded_point_queries_missing");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-scholar-name-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8");
  const ledger = JSON.parse(ledgerBytes), originalPath = resolve("docs/ask-repair-runs/spend.json"), originalBytes = readFileSync(originalPath, "utf8");
  const report: any = { status: "offline_catalogue_control", traceHash: digest(traceBytes),
    control: { id: "65989", title: "نعم، صلي أمك", sourceUrl: "https://hadeethenc.com/ar/browse/hadith/65989", role: "Known relevant example for the kindness concern, not full coverage or an automatic ruling." },
    recordedArabicQueries: plan.hadith.ar, controlQuery: "صلي أمك", modelCalls: 0, modelCost: 0, liveSourceReads: 0,
    sourcePresentInSavedCandidateTrace: traceBytes.includes("HE65989"), noQuestionHintsInserted: true };
  const originalFetch = globalThis.fetch;
  // Optional single official Arabic read; never send a visitor question or use
  // anonymous explanations as evidence. No automatic source retry or import.
  if (process.argv.includes("--verify-official-record")) {
    report.liveSourceReads++;
    const response = await originalFetch("https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65989", { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!response.ok) throw Error("official_source_unavailable_no_retry");
    const ar = await response.json() as any, h = parseHadith(ar, null, null);
    if (!h || !hadithAllowed(h) || h.id !== "HE65989" || ar.title !== report.control.title) throw Error("official_identity_grade_or_title_not_verified");
    report.officialArabic = { id: h.id, title: ar.title, original: h.arabic, originalHash: digest(h.arabic),
      grade: h.gradeAr, attribution: h.attributionAr, numbers: h.numbers, url: report.control.sourceUrl,
      translationsFetched: false, anonymousExplanationUsed: false };
  }
  const store = globalThis as typeof globalThis & { __bayanHadithCatalogues?: unknown };
  const oldCatalogue = store.__bayanHadithCatalogues; delete store.__bayanHadithCatalogues;
  const simulatedRequests: string[] = [];
  try {
    globalThis.fetch = async (input: string | URL | Request) => {
      const url = new URL(String(input)); simulatedRequests.push(url.pathname);
      if (url.origin !== "https://hadeethenc.com" || url.searchParams.get("language") !== "ar") throw Error("unexpected_catalogue_control_request");
      if (url.pathname.endsWith("/categories/roots/")) return Response.json([{ id: "4" }]);
      if (url.pathname.endsWith("/hadeeths/list/") && url.searchParams.get("page") === "1") return Response.json({ data: [{ id: report.control.id, title: report.control.title }], meta: { last_page: 1 } });
      throw Error("unexpected_detail_or_extra_page_request");
    };
    const { searchHadithIds } = await import("../lib/sources/hadith");
    // Same oracle catalogue in both runs; use the actual provider tokenizer/ranker.
    report.recordedPlanResults = await searchHadithIds(plan.hadith.ar, "ar", 24);
    report.exactWordingControlResults = await searchHadithIds([report.controlQuery], "ar", 24);
    report.simulatedCatalogueRequests = simulatedRequests;
  } finally {
    globalThis.fetch = originalFetch;
    if (oldCatalogue === undefined) delete store.__bayanHadithCatalogues; else store.__bayanHadithCatalogues = oldCatalogue;
  }
  if (readFileSync(ledgerPath, "utf8") !== ledgerBytes || readFileSync(originalPath, "utf8") !== originalBytes
    || digest(originalBytes) !== ledger.originalLedgerHash || readFileSync(tracePath, "utf8") !== traceBytes) throw Error("inspection_changed_history");
  report.finding = !report.recordedPlanResults.includes(report.control.id) && report.exactWordingControlResults.includes(report.control.id)
    ? "Recorded source-name/topic hints fail this entry even when it is supplied to the real title matcher; exact title wording succeeds. This is a query/index interface miss before authenticity, ranking, selection or writing, not proof that the complete catalogue or every failed request behaved identically."
    : "The control does not reproduce the expected title-interface miss; inspect before proposing a repair.";
  report.limitations = "One known-source oracle control, not full-catalogue recall or end-to-end retrieval. No original-passage index, narrator/topic override, family mapping, production query or approved source rule was changed. Hadith collection/grade checks remain mandatory. Official explanation/hints are not used.";
  persistCampaign(path, report);
  console.log(JSON.stringify({ status: report.status, recordedPlanResults: report.recordedPlanResults, exactWordingControlResults: report.exactWordingControlResults,
    officialOriginalValidated: !!report.officialArabic, liveSourceReads: report.liveSourceReads, modelCalls: 0, modelCost: 0, finding: report.finding }));
}
if (process.argv[1]?.includes("inspect-ask-hadith-title-interface")) main().catch(e => { console.error(e instanceof Error ? e.message : "source_probe_failed"); process.exitCode = 1; });
