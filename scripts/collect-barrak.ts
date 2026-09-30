import { createClient } from "@supabase/supabase-js";
import { SCHOLAR_QUERIES } from "@/data/scholar-queries";
import { getVerifier } from "@/lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  htmlToText,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "@/lib/sources/scholar-excerpt";
import { parseBarrakFatwa } from "@/lib/sources/parsers/barrak";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const OFFSET = Number(process.argv.find((arg) => arg.startsWith("--offset="))?.split("=")[1] ?? 0);
const PAUSE_MS = 1500;
const RESULTS_PER_QUERY = 3;
const SITE = "https://sh-albarrak.com";
const RIGHTS_ID = "98e7ca42-5684-45e4-a32e-bdf054bee8dc"; // editorial.source_rights, owner sh-albarrak.com
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Hit = { id: string; title: string; link: string };
type SearchPost = { id?: unknown; title?: unknown; link?: unknown; fatwaCategory?: { slug?: unknown } | null };

async function searchFatwas(query: string): Promise<Hit[]> {
  const response = await fetch(`${SITE}/search?q=${encodeURIComponent(query)}&type=fatwas`, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`fatwa search failed with status ${response.status}`);
  const html = await response.text();
  const data = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!data) throw new Error("fatwa search page had no public result data");
  let posts: SearchPost[];
  try { posts = (JSON.parse(data) as { props?: { pageProps?: { posts?: SearchPost[] } } }).props?.pageProps?.posts ?? []; } catch { throw new Error("fatwa search data was not valid JSON"); }
  // Category 1 is the site's written fatwa collection. Category 2 contains lesson fatwas, which
  // do not carry the explicit dictated-by signature required by this collector.
  const hits = posts
    .filter((post) => post.fatwaCategory?.slug === "1" && typeof post.id === "string" && typeof post.title === "string" && typeof post.link === "string" && /^\/fatwas\/\d+$/.test(post.link))
    .map((post) => ({ id: post.id as string, title: htmlToText(post.title as string), link: `${SITE}${post.link as string}` }))
    .filter((hit) => hit.title.length > 0);
  return [...new Map(hits.map((hit) => [hit.id, hit])).values()].slice(0, RESULTS_PER_QUERY);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const verifier = getVerifier();
  let stored = 0, skipped = 0, existing = 0;

  const seen = new Set<string>();
  for (const { topic, q } of SCHOLAR_QUERIES.slice(Math.max(0, OFFSET), Math.max(0, OFFSET) + LIMIT)) {
    let hits: Hit[];
    try {
      hits = await searchFatwas(q);
    } catch (error) {
      console.log(`[${topic}] search failed: ${error instanceof Error ? error.message : "unknown error"}`);
      await sleep(PAUSE_MS);
      continue;
    }
    await sleep(PAUSE_MS);
    for (const hit of hits) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    const { data: already, error: existsError } = await db.from("sources").select("id").eq("url", hit.link).limit(1);
    if (existsError) throw new Error(`could not check existing URLs: ${existsError.message}`);
    if (already?.length) { existing++; continue; }
    const response = await fetch(hit.link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    const fatwa = response.ok ? parseBarrakFatwa(await response.text()) : null;
    await sleep(PAUSE_MS);
    const quote = fatwa ? excerpt(fatwa.answer) : null;
    if (
      !fatwa ||
      !quote ||
      quote.length < 200 ||
      startsLikeRoomTalk(quote) ||
      !sharesContentWord(fatwa.title, quote) ||
      fatwa.title.replace(/\s+/g, " ") !== hit.title.replace(/\s+/g, " ")
    ) {
      skipped++;
      console.log(
        `[${topic}] skipped ${hit.id}: ${
          !response.ok
            ? `HTTP ${response.status}`
            : !fatwa
              ? "not a signed written fatwa"
              : !quote
                ? "no clean excerpt"
                : quote.length < 200
                  ? "too short < 200"
                  : startsLikeRoomTalk(quote)
                    ? "starts like room talk"
                    : !sharesContentWord(fatwa.title, quote)
                      ? "no shared content word"
                      : "title mismatch"
        }`
      );
      continue;
    }

    // AI relevance check before storing
    const relevance = await checkQuoteRelevance(verifier, fatwa.title, quote);
    if (!relevance.answers) {
      skipped++;
      console.log(`[${topic}] skipped ${hit.id}: AI relevance rejected (${relevance.reason})`);
      continue;
    }
    const reference = fatwa.printedSource ?? `sh-albarrak.com, fatwa ${hit.id}`;
    if (DRY_RUN) {
      console.log(`[${topic}] ${fatwa.title} | ${reference} | ${quote.length} chars\n  ${quote.slice(0, 150)}\n  ${hit.link}`);
      stored++;
      continue;
    }
    const { data: source, error } = await db.from("sources").insert({ kind: "fatwa", scholar_id: "al-barrak", title: fatwa.title.slice(0, 300), reference, collection: "sh-albarrak.com", language: "ar", text_original: quote, url: hit.link, rights_id: RIGHTS_ID, published: true }).select("id").single();
    if (error || !source) { console.log(`[${topic}] could not store ${hit.id}: ${error?.message ?? "unknown error"}`); continue; }
    const { error: docError } = await db.from("source_search_documents").insert({ source_id: source.id, lang: "ar", search_text: searchText(fatwa.title, quote), approved: true, approved_by: APPROVED_BY, approved_at: new Date().toISOString() });
    if (docError) console.log(`[${topic}] stored ${hit.id} but not its search entry: ${docError.message}`);
    stored++;
    }
  }
  console.log(`Done. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
