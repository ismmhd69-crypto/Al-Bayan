// Builds a resumable index (reference + title) of the official binbaz.org.sa fatwa archive
// by paging broad searches. Read-only: no database writes. 1.5 s pause between requests.
import fs from "node:fs";

const INDEX_PATH = "docs/binbaz-archive-index.json";
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)", Accept: "application/json" };
const PAUSE_MS = 1500;
const MAX_PAGE = Number(process.argv.find((a) => a.startsWith("--max-pages="))?.slice(12) ?? 1000); // the site stops answering deep pages; stop at the first empty or failing page
const QUERIES = (process.argv.find((a) => a.startsWith("--queries="))?.slice(10) ?? "حكم").split(",");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Index = { items: Record<string, { id: number; title: string }>; progress: Record<string, number>; errors: number; requests: number };
const index: Index = fs.existsSync(INDEX_PATH) ? JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) : { items: {}, progress: {}, errors: 0, requests: 0 };
const save = () => fs.writeFileSync(INDEX_PATH, JSON.stringify(index), "utf-8");

async function main() {
  for (const q of QUERIES) {
    let page = (index.progress[q] ?? 0) + 1;
    let emptyRun = 0;
    for (; page <= MAX_PAGE; page++) {
      index.requests++;
      let results: Array<{ id: number; reference: number; title: string }> = [];
      try {
        const res = await fetch(`https://binbaz.org.sa/api/search?type=fatwa&operator=AND_ONLY&page=${page}&q=${encodeURIComponent(q)}`, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { Search?: { results?: typeof results } };
        if (!data.Search?.results) throw new Error("no results field");
        results = data.Search.results;
      } catch (e) {
        index.errors++;
        console.log(`[${q}] page ${page} error: ${(e as Error).message} (errors ${index.errors}/${index.requests})`);
        if (++emptyRun >= 3) break;
        await sleep(PAUSE_MS * 2);
        page--; // retry same page
        continue;
      }
      emptyRun = 0;
      if (results.length === 0) break;
      for (const r of results) if (Number.isInteger(r.reference) && typeof r.title === "string") index.items[String(r.reference)] = { id: r.id, title: r.title.trim() };
      index.progress[q] = page;
      if (page % 25 === 0) { save(); console.log(`[${q}] page ${page}, index size ${Object.keys(index.items).length}`); }
      await sleep(PAUSE_MS);
    }
    index.progress[q] = Math.max(index.progress[q] ?? 0, page - 1);
    save();
    console.log(`[${q}] done at page ${index.progress[q]}, index size ${Object.keys(index.items).length}`);
  }
}
main();
