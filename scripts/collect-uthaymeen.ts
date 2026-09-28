// Collects short quotes from Shaykh Ibn Uthaymeen's official website (binothaimeen.net)
// into the private scholar library. Run by an agent or Mo on a computer, never by visitors:
//
//   npx tsx scripts/collect-uthaymeen.ts            (all queries in data/scholar-queries.ts)
//   npx tsx scripts/collect-uthaymeen.ts --dry-run  (fetch and print, write nothing)
//   add --limit=5 to try only the first 5 queries
//
// Rules (Mo's decisions, 2026-09-28): at most 600 characters of the Shaykh's own answer, unchanged,
// with the printed/recorded source and a link to the original page. Rights record:
// binothaimeen.net, "short quotes only, written permission pending". Pace: one page every 1.5 s.

import { createClient } from "@supabase/supabase-js";
import { SCHOLAR_QUERIES } from "@/data/scholar-queries";
import {
  excerpt,
  htmlToText,
  looksLikeQuestion,
  parseUthaymeenFatwa,
  searchText,
} from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const RESULTS_PER_QUERY = 4;
const PAUSE_MS = 1500;
const SITE = "https://binothaimeen.net";
const API_URL = "https://shekhapi.binothaimeen.net";
const CP_URL = "https://shekhcp.binothaimeen.net";
const RIGHTS_ID = "7306bf6c-4898-4da9-8cd0-3473cb07a65c"; // editorial.source_rights, owner binothaimeen.net
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const HEADERS = {
  "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)",
  "Content-Type": "application/json",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SearchHit = {
  id: string;
  title: { ar?: string };
};

type AudioDetail = {
  id: string;
  title: { ar?: string };
  objective?: {
    content?: {
      ar?: string;
    };
  };
  many_sections?: Array<{
    id: string;
    title: { ar?: string };
    all_parent?: {
      id: string;
      title: { ar?: string };
      all_parent?: {
        id: string;
        title: { ar?: string };
      } | null;
    } | null;
  }>;
};

async function search(q: string): Promise<SearchHit[]> {
  // First try exact mode
  let res = await fetch(`${CP_URL}/api/search-data`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page: 1, mode: "exact" }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`search failed with status ${res.status}`);
  let data = (await res.json()) as { data?: SearchHit[]; meta?: { total?: number } };
  let hits = data.data ?? [];

  // Fallback to similar mode if no hits found
  if (hits.length === 0) {
    await sleep(500);
    res = await fetch(`${CP_URL}/api/search-data`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page: 1, mode: "similar" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      data = (await res.json()) as { data?: SearchHit[]; meta?: { total?: number } };
      hits = data.data ?? [];
    }
  }

  return hits.filter((h) => typeof h.id === "string" && typeof h.title?.ar === "string");
}

async function fetchAudioDetail(id: string): Promise<AudioDetail | null> {
  const url = `${API_URL}/lessons/audios/show/${id}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": HEADERS["User-Agent"] },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: AudioDetail };
  return json.data ?? null;
}

function pageUrl(detail: AudioDetail, sectionTitle: string, cleanTitle: string): string {
  const encSec = encodeURIComponent(sectionTitle.trim().replace(/\s+/g, "-"));
  const encTitle = encodeURIComponent(cleanTitle.trim().replace(/\s+/g, "-"));
  return `${SITE}/ar/voice_library/lessonDetails/${encSec}/${encTitle}/${detail.id}`;
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
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);

      const { data: preExisting } = await db.from("sources").select("id").ilike("url", `%/${hit.id}`).limit(1);
      if (preExisting?.length) {
        existing++;
        continue;
      }

      const detail = await fetchAudioDetail(hit.id);
      await sleep(PAUSE_MS);
      if (!detail) {
        skipped++;
        continue;
      }

      // Check if it belongs to a structured fatwa collection (Nur ala al-Darb, Liqa al-Bab al-Maftuh, etc.)
      const section = detail.many_sections?.[0];
      const parent = section?.all_parent;
      const topParentTitle = parent?.all_parent?.title?.ar ?? "";
      const seriesTitle = parent?.title?.ar ?? "";
      const isFatwaCollection =
        topParentTitle.includes("فتاوى") ||
        topParentTitle.includes("اللقاءات") ||
        seriesTitle.includes("فتاوى") ||
        seriesTitle.includes("الباب المفتوح") ||
        seriesTitle.includes("نور على الدرب") ||
        seriesTitle.includes("اللقاء الشهري");

      if (!isFatwaCollection) {
        skipped++;
        continue;
      }

      const rawHtml = detail.objective?.content?.ar;
      if (!rawHtml) {
        skipped++;
        continue;
      }

      const rawTitle = detail.title?.ar ?? hit.title?.ar ?? "";
      const cleanTitle = htmlToText(rawTitle).replace(/^-\s*/, "").trim();
      const sectionTitle = section?.title?.ar?.trim() || "فتاوى";
      const collectionName = seriesTitle || topParentTitle || "فتاوى الشيخ ابن عثيمين";
      const reference = `${collectionName} (${sectionTitle})`;
      const link = pageUrl(detail, sectionTitle, cleanTitle);

      const { data: already } = await db.from("sources").select("id").eq("url", link).limit(1);
      if (already?.length) {
        existing++;
        continue;
      }

      const fatwa = parseUthaymeenFatwa(rawHtml, { title: cleanTitle, printedSource: reference });
      const quote = fatwa && excerpt(fatwa.answer);

      if (!fatwa || !quote || looksLikeQuestion(quote)) {
        skipped++;
        console.log(`[${topic}] skipped ${hit.id}: ${!fatwa ? "not parsed" : !quote ? "no clean excerpt" : "looks like question"}`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`[${topic}] ${hit.id} | ${reference} | ${quote.length} chars\n  Title: ${fatwa.title}\n  Quote: ${quote.slice(0, 150)}...\n  URL: ${link}\n`);
        stored++;
        queryStored++;
        continue;
      }

      const { data: source, error } = await db
        .from("sources")
        .insert({
          kind: "fatwa",
          scholar_id: "ibn-uthaymeen",
          title: fatwa.title.slice(0, 300),
          reference,
          collection: collectionName,
          language: "ar",
          text_original: quote,
          url: link,
          rights_id: RIGHTS_ID,
          published: true,
        })
        .select("id")
        .single();

      if (error || !source) {
        console.log(`[${topic}] could not store ${hit.id}: ${error?.message}`);
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
        console.log(`[${topic}] stored ${hit.id} but not search doc: ${docError.message}`);
      }

      stored++;
      queryStored++;
      console.log(`[${topic}] stored ${hit.id} (${quote.length} chars) ${reference}`);
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
