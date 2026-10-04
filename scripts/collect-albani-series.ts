// Official al-albany.com series collector.
// Dry-run only: this file never writes to Supabase and never calls an AI provider.
// It saves parser-test results or candidate batches for manual review and import.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { htmlToText, excerpt, isNearDuplicate, looksLikeQuestion, parseAlbaniFatwa, quoteStemSet, searchText, sharesContentWord, startsLikeRoomTalk } from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const SITE = "https://www.al-albany.com";
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const PAUSE_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SeriesConfig = { id: number; slug: string; label: string };
type Candidate = {
  title: string;
  series: string;
  seriesId: number;
  tape: string;
  url: string;
  excerpt: string;
  searchText: string;
};
type ListingItem = { title: string; tape: string; url: string; series: string; seriesId: number };

const SERIES: SeriesConfig[] = [
  { id: 4, slug: "jeddah-fatwas", label: "Jeddah fatwas" },
  { id: 5, slug: "emirati-fatwas", label: "Emirati fatwas" },
  { id: 7, slug: "kuwait-fatwas", label: "Kuwait fatwas" },
  { id: 3, slug: "rabigh-fatwas", label: "Rabigh fatwas" },
  { id: 8, slug: "madinah-fatwas", label: "Madinah fatwas" },
  { id: 12, slug: "sifat-salat-al-nabi", label: "Sifat Salat al-Nabi" },
];

const arg = (name: string, fallback = "") => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const mode = process.argv.includes("--parser-test") ? "parser-test" : "batch";
const output = arg("out", mode === "parser-test" ? "docs/albani-parser-test.json" : "docs/albani-candidate-batch.json");
const batchSize = Math.max(1, Math.min(50, Number(arg("batch", "50"))));
const maxPages = Math.max(1, Number(arg("max-pages", "100")));
const requestedSeries = arg("series");
const stateFile = arg("state", "docs/albani-series-state.json");

type State = { processed: Record<string, { status: string; title?: string; series?: string; reason?: string }> };

function loadState(): State {
  if (!fs.existsSync(stateFile)) return { processed: {} };
  return JSON.parse(fs.readFileSync(stateFile, "utf8")) as State;
}

function saveState(state: State) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
}

async function loadExisting() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows: Array<{ url: string; text_original: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sources").select("url, text_original").eq("scholar_id", "al-albani").range(from, from + 999);
    if (error) throw new Error(`Could not read existing Al-Albani rows: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { urls: new Set(rows.map((row) => row.url)), stems: rows.map((row) => quoteStemSet(row.text_original)) };
}

function decodeTitle(value: string): string {
  return htmlToText(value).replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();
}

function listingUrl(series: SeriesConfig, page: number): string {
  return page === 1 ? `${SITE}/audios/series/${series.id}/${series.slug}` : `${SITE}/audios/series/${series.id}/${series.slug}/page=${page}`;
}

function pageTemplate(html: string): string | null {
  const match = html.match(new RegExp("href=[\\\"'](https://(?:www\\.)?al-albany\\.com/audios/series/[0-9]+/[^\\\"']+/page=[0-9]+)[\\\"']", "i"));
  return match ? match[1].replace(/page=\d+$/i, "page={page}") : null;
}

function pageUrl(series: SeriesConfig, page: number, template: string | null): string {
  if (page === 1) return listingUrl(series, 1);
  return template ? template.replace("{page}", String(page)) : listingUrl(series, page);
}

function parseListing(html: string, series: SeriesConfig): ListingItem[] {
  const pageItems: ListingItem[] = [];
  const panels = [...html.matchAll(/<div\s+class=["']tape-panel["'][^>]*>([\s\S]*?)(?=<div\s+class=["']tape-panel["']|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/gi)];
  const blocks = panels.length ? panels.map((match) => match[1]) : [html];
  for (const block of blocks) {
    const tape = htmlToText(block.match(/<div\s+class=["']panel-title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "").replace(/^.*?\b(\d+)\s*$/, "$1").trim();
    for (const match of block.matchAll(/<a\s+href=["'](https:\/\/(?:www\.)?al-albany\.com\/audios\/content\/\d+\/[^"']*)["'][\s\S]*?<li[^>]*>([\s\S]*?)<\/li>/gi)) {
      pageItems.push({ title: decodeTitle(match[2]), series: series.label, seriesId: series.id, tape, url: match[1] });
    }
  }
  return pageItems;
}

async function get(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
  const html = await response.text();
  return { ok: response.ok, status: response.status, html };
}

async function collectListings(series: SeriesConfig, needed: number): Promise<ListingItem[]> {
  const items: ListingItem[] = [];
  const seen = new Set<string>();
  let template: string | null = null;
  for (let page = 1; page <= maxPages && items.length < needed; page++) {
    const result = await get(pageUrl(series, page, template));
    if (!result.ok) throw new Error(`${series.label} listing page ${page} returned HTTP ${result.status}`);
    if (page === 1) template = pageTemplate(result.html);
    for (const item of parseListing(result.html, series)) {
      if (!seen.has(item.url)) { seen.add(item.url); items.push(item); }
    }
    if (page < maxPages) await sleep(PAUSE_MS);
    if (!parseListing(result.html, series).length) break;
  }
  return items;
}

async function fetchAndParse(item: ListingItem) {
  const result = await get(item.url);
  if (!result.ok) return { item, status: `HTTP ${result.status}` } as const;
  const fatwa = parseAlbaniFatwa(result.html, { title: item.title, printedSource: `${item.series} (tape ${item.tape || "unknown"})` });
  const quote = fatwa ? excerpt(fatwa.answer) : null;
  if (!fatwa) return { item, status: "parser rejected" } as const;
  if (!quote) return { item, status: "no complete excerpt <= 600 chars" } as const;
  if (quote.length < 200) return { item, status: "under 200 characters" } as const;
  if (quote.length > 600) return { item, status: "over 600 characters" } as const;
  if (startsLikeRoomTalk(quote)) return { item, status: "room talk opener" } as const;
  if (looksLikeQuestion(quote)) return { item, status: "looks like a question" } as const;
  if (!sharesContentWord(fatwa.title, quote)) return { item, status: "no title-content overlap" } as const;
  return { item, status: "candidate", candidate: { title: fatwa.title, series: item.series, seriesId: item.seriesId, tape: item.tape, url: item.url, excerpt: quote, searchText: searchText(fatwa.title, quote) } satisfies Candidate } as const;
}

async function parserTest() {
  const results: Record<string, unknown> = {};
  for (const series of SERIES.filter((entry) => !requestedSeries || String(entry.id) === requestedSeries || entry.slug === requestedSeries)) {
    const items = await collectListings(series, 20);
    const checks: unknown[] = [];
    for (const item of items.slice(0, 20)) {
      const result = await fetchAndParse(item);
      checks.push({ ...item, status: result.status, excerpt: result.status === "candidate" ? result.candidate.excerpt : null });
      await sleep(PAUSE_MS);
    }
    results[series.label] = { seriesId: series.id, pagesVisited: Math.ceil(items.length / Math.max(items.length, 1)), checked: checks.length, checks };
  }
  fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), mode, results }, null, 2), "utf8");
  console.log(`Saved parser test to ${output}`);
}

async function batch() {
  const seriesList = SERIES.filter((entry) => !requestedSeries || String(entry.id) === requestedSeries || entry.slug === requestedSeries);
  if (!seriesList.length) throw new Error(`Unknown series: ${requestedSeries}`);
  const candidates: Candidate[] = [];
  const rejections: Array<{ title: string; series: string; tape: string; url: string; reason: string }> = [];
  const state = loadState();
  const existing = await loadExisting();
  const seenStems: Set<string>[] = [...existing.stems];
  const seenUrls = new Set<string>();
  let pagesVisited = 0;
  let detailRequests = 0;
  let detailErrors = 0;
  for (const series of seriesList) {
    let template: string | null = null;
    for (let page = 1; page <= maxPages && candidates.length < batchSize; page++) {
      const listing = await get(pageUrl(series, page, template));
      pagesVisited++;
      if (!listing.ok) throw new Error(`${series.label} listing page ${page} returned HTTP ${listing.status}`);
      if (page === 1) template = pageTemplate(listing.html);
      const items = parseListing(listing.html, series);
      if (!items.length) break;
      for (const item of items) {
        if (candidates.length >= batchSize) break;
        if (seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        if (state.processed[item.url]) continue;
        if (existing.urls.has(item.url)) {
          state.processed[item.url] = { status: "existing", title: item.title, series: item.series };
          saveState(state);
          continue;
        }
        detailRequests++;
        let result: Awaited<ReturnType<typeof fetchAndParse>>;
        try {
          result = await fetchAndParse(item);
        } catch (error) {
          detailErrors++;
          const message = error instanceof Error ? error.message : String(error);
          rejections.push({ title: item.title, series: item.series, tape: item.tape, url: item.url, reason: `request error: ${message}` });
          if (detailErrors / detailRequests > 0.2) throw new Error(`Request errors exceeded 20% (${detailErrors}/${detailRequests})`);
          await sleep(PAUSE_MS);
          continue;
        }
        if (result.status !== "candidate") {
          state.processed[item.url] = { status: "rejected", title: item.title, series: item.series, reason: result.status };
          rejections.push({ title: item.title, series: item.series, tape: item.tape, url: item.url, reason: result.status });
        } else if (isNearDuplicate(quoteStemSet(result.candidate.excerpt), seenStems, 0.7)) {
          state.processed[item.url] = { status: "near duplicate", title: item.title, series: item.series };
          rejections.push({ title: item.title, series: item.series, tape: item.tape, url: item.url, reason: "near duplicate of existing or batch text" });
        } else {
          state.processed[item.url] = { status: "candidate", title: item.title, series: item.series };
          candidates.push(result.candidate);
          seenStems.push(quoteStemSet(result.candidate.excerpt));
        }
        saveState(state);
        await sleep(PAUSE_MS);
      }
      if (page < maxPages && candidates.length < batchSize) await sleep(PAUSE_MS);
    }
    if (candidates.length >= batchSize) break;
  }
  fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), mode, batchSize, pagesVisited, detailRequests, detailErrors, candidates, rejections }, null, 2), "utf8");
  console.log(`Saved ${candidates.length} candidates and ${rejections.length} mechanical rejections to ${output}. Pages ${pagesVisited}, transcript requests ${detailRequests}.`);
}

(mode === "parser-test" ? parserTest : batch)().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
