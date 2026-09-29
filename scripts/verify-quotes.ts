// Checks that every scholar quote in the prepared answers is the scholar's exact words on the linked
// official page (vowel marks and punctuation ignored). Run before any answer goes to Mo's review:
//
//   npx tsx scripts/verify-quotes.ts                 (all files in data/topic-answers and data/prepared-answers)
//   npx tsx scripts/verify-quotes.ts prepared-answers
//
// Exits with an error if any quote is not found word for word. Never type a quote by hand: copy it
// from the page (or extract it with parseBinBazFatwa / excerpt in lib/sources/scholar-excerpt.ts).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const norm = (t: string) =>
  t.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ")
    .replace(/[ً-ْـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي")
    .replace(/[^ء-ي0-9 ]/g, " ").replace(/\s+/g, " ").trim();

async function main() {
  const folders = process.argv[2] ? [process.argv[2]] : ["topic-answers", "prepared-answers"];
  let failed = 0;
  for (const folder of folders) {
    const dir = path.join(process.cwd(), "data", folder);
    let names: string[] = [];
    try {
      names = readdirSync(dir).filter((n) => n.endsWith(".json"));
    } catch {
      continue;
    }
    for (const name of names) {
      const file = JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { sources: { id: string; kind: string; arabic?: string; url?: string }[] };
      for (const s of file.sources.filter((x) => x.kind === "scholar")) {
        const html = await fetch(s.url ?? "", { headers: HEADERS }).then((r) => r.text()).catch(() => "");
        const page = norm(html);
        const quote = norm(s.arabic ?? "");
        // The whole quote must appear on the page, allowing only for line breaks and punctuation.
        const ok = quote.length > 0 && page.includes(quote);
        if (!ok) failed++;
        console.log(`${ok ? "ok      " : "NOT EXACT"} ${folder}/${name} ${s.id}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  console.log(failed === 0 ? "\nAll quotes are the scholars' exact words." : `\n${failed} quote(s) are not the scholars' exact words.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
