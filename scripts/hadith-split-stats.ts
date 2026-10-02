// Read-only, Phase 3 evaluation (docs/hadith-card-report.md): what would conservative rules add for hadith
// that are NOT split today (dialogues with several quotes, and hadith with no quote at all)? Nothing here
// changes what Ask shows. Run: npx tsx scripts/hadith-split-stats.ts
import { loadHadithRows } from "./hadith-split-samples";
import { analyseHadithSplit, QUOTE_MARK, speakerOf } from "../lib/sources/hadith-split";
import { maskQuranTags } from "../lib/sources/hadith-markup";
import { isContinuationHadith } from "../lib/sources/hadith-rules";

async function main() {
  const rows = await loadHadithRows();
  let dialogues = 0, lastIsProphet = 0, lastIsProphetShort = 0, onlyLastIsProphet = 0, noQuote = 0;
  const examples: string[] = [];
  for (const row of rows) {
    const reason = analyseHadithSplit(row.text_original).reason;
    if (reason === "no_quote") {
      // No quote marks: there is nothing that marks where spoken words begin or end, so no rule is tried.
      noQuote++;
      continue;
    }
    if (reason !== "several_quotes" || isContinuationHadith(row.text_original)) continue;
    dialogues++;
    const masked = maskQuranTags(row.text_original);
    const marks: number[] = [];
    for (let i = masked.indexOf(QUOTE_MARK); i >= 0; i = masked.indexOf(QUOTE_MARK, i + QUOTE_MARK.length)) marks.push(i);
    if (marks.length % 2 !== 0) continue;
    const openings = marks.filter((_, i) => i % 2 === 0);
    const speakers = openings.map((at) => speakerOf(row.text_original.slice(0, at)));
    if (speakers[speakers.length - 1] !== "prophet") continue;
    lastIsProphet++;
    const last = row.text_original.slice(openings[openings.length - 1] + QUOTE_MARK.length, marks[marks.length - 1]);
    if (last.replace(/[^ء-ي]/g, "").length < 25) lastIsProphetShort++;
    if (speakers.slice(0, -1).every((s) => s === "other")) {
      onlyLastIsProphet++;
      if (examples.length < 8) examples.push(`${row.url}: ${last.trim().slice(0, 80)}`);
    }
  }
  console.log(JSON.stringify({ total: rows.length, dialogues, lastIsProphet, lastIsProphetShort, onlyLastIsProphet, noQuote }, null, 1));
  console.log(examples.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
