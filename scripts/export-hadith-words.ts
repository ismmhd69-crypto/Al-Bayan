// Read-only: exports the quoted words of every stored hadith whose split is certain, for the words-only
// translation job (docs/hadith-words-translation-job.md). Prophet ﷺ first, then the neutral ones.
// Writes data/hadith-words/batch-NNN.json, 50 items each: { id, url, speaker, words, words_shown }.
// Arabic words only: no chain, no full text, no chapter heading.
// Run: npx tsx scripts/export-hadith-words.ts [--out=data/hadith-words] [--size=50]
import fs from "node:fs";
import path from "node:path";
import { loadHadithRows } from "./hadith-split-samples";
import { splitHadith } from "../lib/sources/hadith-split";
import { cleanHadithMarkup } from "../lib/sources/hadith-markup";

// words = exactly as stored (the import checks it against the current text); words_shown = the same with
// Sunnah.com's [quran ...] tags tidied as on the page; translate words_shown.
export type HadithWordsItem = { id: string; url: string; speaker: "prophet" | "other"; words: string; words_shown: string };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

async function main() {
  const out = arg("out") ?? path.join("data", "hadith-words");
  const size = Number(arg("size") ?? 50);
  if (!Number.isInteger(size) || size < 1 || size > 200) throw new Error("--size must be 1 to 200");
  const rows = await loadHadithRows();
  const items: HadithWordsItem[] = [];
  for (const row of rows) {
    const split = splitHadith(row.text_original);
    if (split) items.push({ id: row.id, url: row.url, speaker: split.speaker, words: split.words.trim(), words_shown: cleanHadithMarkup(split.words).trim() });
  }
  items.sort((a, b) => (a.speaker === b.speaker ? 0 : a.speaker === "prophet" ? -1 : 1));
  fs.mkdirSync(out, { recursive: true });
  let batches = 0;
  for (let i = 0; i < items.length; i += size) {
    batches++;
    fs.writeFileSync(path.join(out, `batch-${String(batches).padStart(3, "0")}.json`), JSON.stringify(items.slice(i, i + size), null, 1));
  }
  console.log(JSON.stringify({ hadith: rows.length, exported: items.length, prophet: items.filter((i) => i.speaker === "prophet").length, other: items.filter((i) => i.speaker === "other").length, batches, out }));
}

main().catch((e) => { console.error(e); process.exit(1); });
