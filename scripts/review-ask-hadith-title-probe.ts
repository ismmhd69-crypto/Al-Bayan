// Summarise completed public source probes only. No HTTP or model calls.
import { existsSync, readFileSync } from "node:fs";
import { parseHadith } from "../lib/sources/hadith-rules";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

function idsFromHtml(html: string) {
  if (Buffer.byteLength(html, "utf8") > 1_000_000) throw Error("source_fixture_too_large");
  const ids = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/giu)) {
    try {
      const u = new URL(match[2], "https://hadeethenc.com");
      const id = u.pathname.match(/^\/ar\/browse\/hadith\/([1-9]\d{0,8})\/?$/u)?.[1];
      if (u.origin === "https://hadeethenc.com" && !u.username && !u.password && !u.search && !u.hash && id) ids.add(id);
    } catch { /* Search snippets and other links are not evidence. */ }
  }
  return [...ids];
}
const path = "work/private-ask-evaluation/hadith-title-diagnosis-review-20261024.json";
if (existsSync(path)) throw Error("completed_review_not_repeated");
const controlBytes = readFileSync("work/private-ask-evaluation/hadith-title-interface-20261024.json", "utf8"), control = JSON.parse(controlBytes);
if (!control.officialArabic || control.recordedPlanResults.length || !control.exactWordingControlResults.includes("65989")) throw Error("source_control_not_verified");
const results = ["", "-1", "-2"].map((suffix, index) => {
  const bytes = readFileSync(`work/private-ask-evaluation/hadeethenc-official-search-20261024${suffix}.html`, "utf8"), ids = idsFromHtml(bytes);
  return { queryIndex: index, responseHash: digest(bytes), uniqueOfficialIds: ids.length, topEight: ids.slice(0, 8), knownSourceFound: ids.includes("65989") };
});
const recordBytes = readFileSync("work/private-ask-evaluation/hadeethenc-official-search-candidate-65784-20261024.json", "utf8"), saved = JSON.parse(recordBytes);
if (digest(saved.original) !== saved.originalHash) throw Error("saved_original_changed");
const parsed = parseHadith({ id: saved.id, hadeeth: saved.original, grade: saved.grade, attribution: saved.attribution, reference: saved.reference }, null, null);
if (!parsed || parsed.arabic !== saved.original || parsed.numbers.bukhari !== 4141 || parsed.numbers.muslim !== 2770) throw Error("range_repair_not_verified");
const report = { status: "reviewed_source_interface_limitation_and_reference_repair", modelCalls: 0, modelCost: 0,
  controlHash: digest(controlBytes), sourceRecordHash: digest(recordBytes), results,
  findings: [
    "The known source passes existing Arabic grade/collection rules. Its short title does not match the recorded source-name/topic hints even in an oracle catalogue; exact title wording matches. Its ID was absent from the saved candidate trace. This establishes a miss mechanism, not complete-catalogue recall or sole causation.",
    "Three official-site searches using the recorded Arabic point queries all missed the known narration. Other results were not all reviewed. The new recurring topic result 65784 concerns the slander incident, not specifically kindness to non-Muslim parents. No general source-search improvement is demonstrated, so this alternative stays unwired.",
    "The same returned source had a valid Bukhari page range that the old parser ignored. Generic range parsing now recovers both confirmed collection numbers with exact original bytes and grade/attribution/introduction checks preserved. No source text is corrected or religious meaning certified.",
  ],
  bibliography: { beforeRecordedNumbers: saved.numbers, afterNumbers: parsed.numbers, originalUnchanged: true },
  boundaries: "No question/source-specific production mapping, query relaxation, model, source approval, visitor-query forwarding or privacy setting changed. Anonymous explanation/hints were not used. Source-only probes are not full Ask attempts or an accuracy score. Any future remote-search integration would change current local-title query handling and needs privacy review before activation.",
  next: "A general discovery repair needs matched evaluation of approved original-passage access and question-purpose wording. Do not insert this one known source, deploy an unproven remote search, weaken authenticity or repeat paid full questions before the remaining verification can fit.",
};
persistCampaign(path, report);
console.log(JSON.stringify({ status: report.status, remoteKnownSourceMatches: results.filter(r => r.knownSourceFound).length,
  beforeNumbers: saved.numbers, afterNumbers: parsed.numbers, modelCalls: 0, modelCost: 0 }));
