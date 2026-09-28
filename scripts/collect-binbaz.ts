// Collects short quotes from Shaykh Ibn Baz's official website (binbaz.org.sa) into the private
// scholar library. Run by Claude or Mo on a computer, never by visitors:
//
//   npx tsx scripts/collect-binbaz.ts            (all queries in data/scholar-queries.ts)
//   npx tsx scripts/collect-binbaz.ts --dry-run  (fetch and print, write nothing)
//   add --limit=5 to try only the first 5 queries
//
// Rules (Mo's decisions, 2026-09-28): at most 600 characters of the Shaykh's own answer, unchanged,
// with the printed source when the page gives one and a link to the original page. Rights record:
// binbaz.org.sa, "short quotes only, written permission pending". Pace: one page every 1.5 s.

import { createClient } from "@supabase/supabase-js";
import { SCHOLAR_QUERIES } from "@/data/scholar-queries";
import { excerpt, parseBinBazFatwa, printedCollection, searchText } from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
// --limit=N runs only the first N queries (for trying things out).
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const RESULTS_PER_QUERY = 4;
const PAUSE_MS = 1500;
const SITE = "https://binbaz.org.sa";
const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001"; // editorial.source_rights, owner binbaz.org.sa
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SearchHit = { id: number; reference: number; title: string };

async function search(q: string): Promise<SearchHit[]> {
  // AND_ONLY: every word of the query must appear, which keeps loosely related fatwas out.
  const res = await fetch(`${SITE}/api/search?type=fatwa&operator=AND_ONLY&page=1&q=${encodeURIComponent(q)}`, {
    headers: { ...HEADERS, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`search failed with status ${res.status}`);
  const data = (await res.json()) as { Search?: { results?: SearchHit[] } };
  return (data.Search?.results ?? []).filter((h) => Number.isInteger(h.reference) && typeof h.title === "string");
}

const pageUrl = (hit: SearchHit) => `${SITE}/fatwas/${hit.reference}/${encodeURIComponent(hit.title.trim().replace(/\s+/g, "-"))}`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const seen = new Set<number>();
  let stored = 0, skipped = 0, existing = 0;

  for (const { topic, q } of SCHOLAR_QUERIES.slice(0, LIMIT)) {
    let hits: SearchHit[] = [];
    try {
      hits = (await search(q)).slice(0, RESULTS_PER_QUERY);
    } catch (err) {
      console.log(`[${topic}] search failed: ${(err as Error).message}`);
      continue;
    }
    await sleep(PAUSE_MS);

    for (const hit of hits) {
      if (seen.has(hit.reference)) continue;
      seen.add(hit.reference);
      const link = pageUrl(hit);

      const { data: already } = await db.from("sources").select("id").eq("url", link).limit(1);
      if (already?.length) {
        existing++;
        continue;
      }

      const res = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      await sleep(PAUSE_MS);
      const fatwa = res.ok ? parseBinBazFatwa(await res.text()) : null;
      const quote = fatwa && excerpt(fatwa.answer);
      // The page must be the fatwa the search pointed to, and have a usable answer.
      if (!fatwa || !quote || fatwa.title.replace(/\s+/g, " ") !== hit.title.trim().replace(/\s+/g, " ")) {
        skipped++;
        console.log(`[${topic}] skipped ${hit.reference}: ${!fatwa ? "not parsed" : !quote ? "no clean excerpt" : "title mismatch"}`);
        continue;
      }

      // Printed reference when the page names Majmu' Fatawa Ibn Baz; otherwise the site's fatwa number.
      const printed = printedCollection(fatwa.printedSource);
      const reference = printed?.reference ?? `binbaz.org.sa, fatwa ${hit.reference}`;
      const collection = printed?.collection ?? "binbaz.org.sa";
      if (DRY_RUN) {
        console.log(`[${topic}] ${hit.reference} | ${reference} | ${quote.length} chars\n  ${quote.slice(0, 140)}...`);
        stored++;
        continue;
      }

      const { data: source, error } = await db
        .from("sources")
        .insert({
          kind: "fatwa",
          scholar_id: "ibn-baz",
          title: fatwa.title.slice(0, 300),
          reference,
          collection,
          language: "ar",
          text_original: quote,
          url: link,
          rights_id: RIGHTS_ID,
          published: true,
        })
        .select("id")
        .single();
      if (error || !source) {
        console.log(`[${topic}] could not store ${hit.reference}: ${error?.message}`);
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
      if (docError) console.log(`[${topic}] stored ${hit.reference} but not its search entry: ${docError.message}`);
      stored++;
      console.log(`[${topic}] stored ${hit.reference} (${quote.length} chars) ${reference}`);
    }
  }
  console.log(`\nDone. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
