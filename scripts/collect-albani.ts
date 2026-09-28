// Collects short quotes from Shaykh al-Albani's official website (al-albany.com)
// into the private scholar library. Run by an agent or Mo on a computer, never by visitors:
//
//   npx tsx scripts/collect-albani.ts            (all queries in data/scholar-queries.ts)
//   npx tsx scripts/collect-albani.ts --dry-run  (fetch and print, write nothing)
//   add --limit=5 to try only the first 5 queries
//
// Rules (Mo's decisions, 2026-09-28): at most 600 characters of the Shaykh's own answer, unchanged,
// with the recorded session source and a link to the original page. Rights record:
// al-albany.com, "short quotes only, written permission pending". Pace: one page every 1.5 s.

import { createClient } from "@supabase/supabase-js";
import { SCHOLAR_QUERIES } from "@/data/scholar-queries";
import {
  excerpt,
  htmlToText,
  looksLikeQuestion,
  parseAlbaniFatwa,
  searchText,
} from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const RESULTS_PER_QUERY = 4;
const PAUSE_MS = 1500;
const SITE = "https://www.al-albany.com";
const RIGHTS_ID = "b808230c-6e30-4986-ae07-9aefd1a7f622"; // editorial.source_rights, owner al-albany.com
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const HEADERS = {
  "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SearchHit = {
  url: string;
  title: string;
  series: string;
  tape: string;
};

async function search(q: string): Promise<SearchHit[]> {
  const hits: SearchHit[] = [];
  const seenUrls = new Set<string>();

  // Try title search first (highest relevance), then exact phrase search
  for (const searchType of ["title", "phrase"]) {
    const sUrl = `${SITE}/audios/search.php?query=${encodeURIComponent(q)}&type=${searchType}`;
    let res: Response;
    try {
      res = await fetch(sUrl, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const html = await res.text();
    const matches = [
      ...html.matchAll(
        /<a\s+href='(https:\/\/(?:www\.)?al-albany\.com\/audios\/content\/\d+\/[^']+)'[\s\S]*?<div class='result-title'>([\s\S]*?)<\/div>[\s\S]*?<div class='result-series'>السلسلة : <span[^>]*>([\s\S]*?)<\/span><\/div>[\s\S]*?<div class='result-tape'>رقم الشريط : ([\s\S]*?)<\/div>/gi
      ),
    ];

    for (const m of matches) {
      const url = m[1];
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      hits.push({
        url,
        title: htmlToText(m[2]).trim(),
        series: htmlToText(m[3]).trim(),
        tape: htmlToText(m[4]).trim(),
      });
      if (hits.length >= RESULTS_PER_QUERY * 2) break;
    }

    if (hits.length >= RESULTS_PER_QUERY) break;
    await sleep(500);
  }

  return hits;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const seen = new Set<string>();
  let stored = 0,
    skipped = 0,
    existing = 0;

  for (const { topic, q } of SCHOLAR_QUERIES.slice(0, LIMIT)) {
    let hits: SearchHit[] = [];
    try {
      hits = await search(q);
    } catch (err) {
      console.log(`[${topic}] search failed: ${(err as Error).message}`);
      continue;
    }
    await sleep(PAUSE_MS);

    let queryStored = 0;
    for (const hit of hits) {
      if (queryStored >= RESULTS_PER_QUERY) break;
      if (seen.has(hit.url)) continue;
      seen.add(hit.url);

      const { data: already } = await db.from("sources").select("id").eq("url", hit.url).limit(1);
      if (already?.length) {
        existing++;
        continue;
      }

      let res: Response;
      try {
        res = await fetch(hit.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      } catch {
        skipped++;
        continue;
      }
      await sleep(PAUSE_MS);
      if (!res.ok) {
        skipped++;
        continue;
      }

      const collection = hit.series || "صوتيات الإمام الألباني";
      const reference = hit.tape ? `${collection} (الشريط ${hit.tape})` : collection;
      const html = await res.text();
      const fatwa = parseAlbaniFatwa(html, { title: hit.title, printedSource: reference });
      const quote = fatwa && excerpt(fatwa.answer);

      if (!fatwa || !quote || looksLikeQuestion(quote) || quote.length < 200) {
        skipped++;
        console.log(
          `[${topic}] skipped: ${!fatwa ? "not parsed / other speaker / title mismatch" : !quote ? "no clean excerpt" : quote.length < 200 ? "too short < 200" : "looks like question"}`
        );
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `[${topic}] ${reference} | ${quote.length} chars\n  Title: ${fatwa.title}\n  Quote: ${quote.slice(0, 150)}...\n  URL: ${hit.url}\n`
        );
        stored++;
        queryStored++;
        continue;
      }

      const { data: source, error } = await db
        .from("sources")
        .insert({
          kind: "fatwa",
          scholar_id: "al-albani",
          title: fatwa.title.slice(0, 300),
          reference,
          collection,
          language: "ar",
          text_original: quote,
          url: hit.url,
          rights_id: RIGHTS_ID,
          published: true,
        })
        .select("id")
        .single();

      if (error || !source) {
        console.log(`[${topic}] could not store: ${error?.message}`);
        continue;
      }

      const { error: docError } = await db.from("source_search_documents").insert({
        source_id: source.id,
        lang: "ar",
        search_text: searchText(fatwa.title, quote),
        approved: true,
        approved_by: APPROVED_BY,
        approved_at: new Date().toISOString(),
      });

      if (docError) {
        console.log(`[${topic}] stored quote but not search doc: ${docError.message}`);
      }

      stored++;
      queryStored++;
      console.log(`[${topic}] stored (${quote.length} chars) ${reference}`);
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
