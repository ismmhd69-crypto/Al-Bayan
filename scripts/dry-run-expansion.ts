import { createClient } from "@supabase/supabase-js";
import { getVerifier } from "../lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  htmlToText,
  isNearDuplicate,
  isUthaymeenTafsirLesson,
  looksLikeQuestion,
  parseAlbaniFatwa,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  printedCollection,
  quoteStemSet,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";
import { parseBarrakFatwa } from "../lib/sources/parsers/barrak";

process.loadEnvFile(".env");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 1500;
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };

export const PRIORITY_25 = [
  { topic: "who-created", q: "معنى لا إله إلا الله" },
  { topic: "who-created", q: "أسماء الله وصفاته" },
  { topic: "purpose", q: "الحكمة من خلق الخلق" },
  { topic: "qadar", q: "الإيمان بالقدر" },
  { topic: "prayer", q: "نواقض الوضوء" },
  { topic: "prayer", q: "صفة الغسل من الجنابة" },
  { topic: "prayer", q: "حكم تارك الصلاة" },
  { topic: "prayer", q: "صلاة الجماعة في المسجد" },
  { topic: "prayer", q: "قضاء الصلوات الفائتة" },
  { topic: "fasting", q: "مفطرات الصيام" },
  { topic: "fasting", q: "حكم صيام المريض والمسافر" },
  { topic: "zakat", q: "زكاة الذهب والفضة" },
  { topic: "zakat", q: "زكاة الفطر" },
  { topic: "hajj", q: "صفة العمرة" },
  { topic: "quran-preserved", q: "فضل قراءة القرآن" },
  { topic: "dua", q: "آداب الدعاء" },
  { topic: "repentance", q: "شروط التوبة" },
  { topic: "music", q: "حكم الغناء والموسيقى" },
  { topic: "marriage", q: "شروط النكاح" },
  { topic: "parents", q: "بر الوالدين" },
  { topic: "marriage", q: "أحكام الطلاق" },
  { topic: "riba", q: "حكم الربا" },
  { topic: "riba", q: "أحكام الديون" },
  { topic: "afterlife", q: "صلاة الجنازة" },
  { topic: "afterlife", q: "عذاب القبر ونعيمه" },
];

export type Candidate = {
  scholar: string;
  title: string;
  url: string;
  reference: string;
  quote: string;
  reason?: string;
};

// --- Ibn Baz Search ---
async function searchBinBaz(q: string) {
  const res = await fetch(`https://binbaz.org.sa/api/search?type=fatwa&operator=AND_ONLY&page=1&q=${encodeURIComponent(q)}`, {
    headers: { ...HEADERS, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { Search?: { results?: Array<{ id: number; reference: number; title: string }> } };
  return (data.Search?.results ?? []).filter((h) => Number.isInteger(h.reference) && typeof h.title === "string");
}

// --- Ibn Uthaymeen Search ---
async function searchUthaymeen(q: string) {
  const res = await fetch("https://shekhcp.binothaimeen.net/api/search-data", {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ pageSize: 6, searchTerm: q, type: "audios", page: 1, mode: "exact" }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: Array<{ id: string; title: { ar?: string } }> };
  return (data.data ?? []).filter((h) => typeof h.id === "string" && typeof h.title?.ar === "string");
}

// --- Al-Albani Search ---
async function searchAlbani(q: string) {
  const sUrl = `https://www.al-albany.com/audios/search.php?query=${encodeURIComponent(q)}&type=title`;
  const res = await fetch(sUrl, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return [];
  const html = await res.text();
  const matches = [
    ...html.matchAll(
      /<a\s+href='(https:\/\/(?:www\.)?al-albany\.com\/audios\/content\/\d+\/[^']+)'[\s\S]*?<div class='result-title'>([\s\S]*?)<\/div>[\s\S]*?<div class='result-series'>السلسلة : <span[^>]*>([\s\S]*?)<\/span><\/div>[\s\S]*?<div class='result-tape'>رقم الشريط : ([\s\S]*?)<\/div>/gi
    ),
  ];
  return matches.map((m) => ({
    url: m[1],
    title: htmlToText(m[2]).trim(),
    series: htmlToText(m[3]).trim(),
    tape: htmlToText(m[4]).trim(),
  }));
}

// --- Al-Barrak Search ---
async function searchBarrak(q: string) {
  const res = await fetch(`https://sh-albarrak.com/search?q=${encodeURIComponent(q)}&type=fatwas`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const data = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!data) return [];
  try {
    const parsed = (JSON.parse(data) as { props?: { pageProps?: { posts?: Array<{ id?: unknown; title?: unknown; link?: unknown; fatwaCategory?: { slug?: unknown } | null }> } } }).props?.pageProps?.posts ?? [];
    return parsed
      .filter((post) => post.fatwaCategory?.slug === "1" && typeof post.id === "string" && typeof post.title === "string" && typeof post.link === "string" && /^\/fatwas\/\d+$/.test(post.link))
      .map((post) => ({ id: post.id as string, title: htmlToText(post.title as string), link: `https://sh-albarrak.com${post.link as string}` }));
  } catch {
    return [];
  }
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const verifier = getVerifier();

  // Load existing published URLs and stem sets for deduplication
  const { data: existingRows } = await db.from("sources").select("url, text_original, scholar_id").eq("published", true);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.url));
  const existingStemsByScholar: Record<string, Set<string>[]> = {
    "ibn-baz": [],
    "ibn-uthaymeen": [],
    "al-albani": [],
    "al-barrak": [],
  };
  for (const r of existingRows ?? []) {
    if (existingStemsByScholar[r.scholar_id]) {
      existingStemsByScholar[r.scholar_id].push(quoteStemSet(r.text_original));
    }
  }

  const results: Record<string, { attempted: number; found: number; existing: number; skipped: number; acceptable: Candidate[]; skipReasons: Record<string, number> }> = {
    "ibn-baz": { attempted: 0, found: 0, existing: 0, skipped: 0, acceptable: [], skipReasons: {} },
    "ibn-uthaymeen": { attempted: 0, found: 0, existing: 0, skipped: 0, acceptable: [], skipReasons: {} },
    "al-albani": { attempted: 0, found: 0, existing: 0, skipped: 0, acceptable: [], skipReasons: {} },
    "al-barrak": { attempted: 0, found: 0, existing: 0, skipped: 0, acceptable: [], skipReasons: {} },
  };

  const recordSkip = (scholar: string, reason: string) => {
    results[scholar].skipped++;
    results[scholar].skipReasons[reason] = (results[scholar].skipReasons[reason] || 0) + 1;
  };

  console.log("=== STARTING DRY RUN ON 25 PRIORITY TOPICS ===\n");

  // --- 1. Ibn Baz Dry Run ---
  console.log("--- 1. Ibn Baz (binbaz.org.sa) ---");
  for (const { topic, q } of PRIORITY_25) {
    results["ibn-baz"].attempted++;
    let hits: any[] = [];
    try {
      hits = await searchBinBaz(q);
    } catch {
      continue;
    }
    await sleep(PAUSE_MS);

    for (const hit of hits.slice(0, 2)) {
      results["ibn-baz"].found++;
      const link = `https://binbaz.org.sa/fatwas/${hit.reference}/${encodeURIComponent(hit.title.trim().replace(/\s+/g, "-"))}`;
      if (existingUrls.has(link)) {
        results["ibn-baz"].existing++;
        continue;
      }

      const res = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      await sleep(PAUSE_MS);
      if (!res.ok) { recordSkip("ibn-baz", `HTTP ${res.status}`); continue; }

      const fatwa = parseBinBazFatwa(await res.text());
      const quote = fatwa && excerpt(fatwa.answer);

      if (!fatwa) { recordSkip("ibn-baz", "Not parsed / question-like"); continue; }
      if (!quote) { recordSkip("ibn-baz", "No clean excerpt"); continue; }
      if (quote.length < 200) { recordSkip("ibn-baz", "Under 200 chars"); continue; }
      if (startsLikeRoomTalk(quote)) { recordSkip("ibn-baz", "Starts like room talk"); continue; }
      if (!sharesContentWord(fatwa.title, quote)) { recordSkip("ibn-baz", "No shared content word"); continue; }
      if (fatwa.title.replace(/\s+/g, " ") !== hit.title.trim().replace(/\s+/g, " ")) { recordSkip("ibn-baz", "Title mismatch"); continue; }

      const stems = quoteStemSet(quote);
      if (isNearDuplicate(stems, existingStemsByScholar["ibn-baz"])) {
        recordSkip("ibn-baz", "Near duplicate of existing quote");
        continue;
      }

      const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
      if (!rel.answers) {
        recordSkip("ibn-baz", `AI rejected: ${rel.reason}`);
        continue;
      }

      const printed = printedCollection(fatwa.printedSource);
      const reference = printed?.reference ?? `binbaz.org.sa, fatwa ${hit.reference}`;

      results["ibn-baz"].acceptable.push({
        scholar: "ibn-baz",
        title: fatwa.title,
        url: link,
        reference,
        quote,
      });
      existingStemsByScholar["ibn-baz"].push(stems);
      console.log(`[ibn-baz] Found safe candidate: ${fatwa.title} (${quote.length} chars)`);
    }
  }

  // --- 2. Ibn Uthaymeen Dry Run ---
  console.log("\n--- 2. Ibn Uthaymeen (binothaimeen.net) ---");
  for (const { topic, q } of PRIORITY_25) {
    results["ibn-uthaymeen"].attempted++;
    let hits: any[] = [];
    try {
      hits = await searchUthaymeen(q);
    } catch {
      continue;
    }
    await sleep(PAUSE_MS);

    for (const hit of hits.slice(0, 2)) {
      results["ibn-uthaymeen"].found++;
      const cleanTitle = htmlToText(hit.title.ar).replace(/^-\s*/, "").trim();
      if (isUthaymeenTafsirLesson(cleanTitle)) {
        recordSkip("ibn-uthaymeen", "Tafsir lesson");
        continue;
      }

      const url = `https://shekhapi.binothaimeen.net/lessons/audios/show/${hit.id}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`;
      const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(20_000) });
      await sleep(PAUSE_MS);
      if (!res.ok) { recordSkip("ibn-uthaymeen", `HTTP ${res.status}`); continue; }

      const detail = (await res.json())?.data;
      if (!detail?.objective?.content?.ar) { recordSkip("ibn-uthaymeen", "No content"); continue; }

      const section = detail.many_sections?.[0];
      const seriesTitle = section?.all_parent?.title?.ar ?? "";
      const topParentTitle = section?.all_parent?.all_parent?.title?.ar ?? "";
      const isFatwaCollection =
        topParentTitle.includes("فتاوى") ||
        topParentTitle.includes("اللقاءات") ||
        seriesTitle.includes("فتاوى") ||
        seriesTitle.includes("الباب المفتوح") ||
        seriesTitle.includes("نور على الدرب") ||
        seriesTitle.includes("اللقاء الشهري");
      if (!isFatwaCollection) { recordSkip("ibn-uthaymeen", "Not fatwa collection"); continue; }

      const sectionTitle = section?.title?.ar?.trim() || "فتاوى";
      const collectionName = seriesTitle || topParentTitle || "فتاوى الشيخ ابن عثيمين";
      const reference = `${collectionName} (${sectionTitle})`;
      const link = `https://binothaimeen.net/ar/voice_library/lessonDetails/${encodeURIComponent(sectionTitle.replace(/\s+/g, "-"))}/${encodeURIComponent(cleanTitle.replace(/\s+/g, "-"))}/${hit.id}`;

      if (existingUrls.has(link)) { results["ibn-uthaymeen"].existing++; continue; }

      const fatwa = parseUthaymeenFatwa(detail.objective.content.ar, { title: cleanTitle, printedSource: reference });
      const quote = fatwa && excerpt(fatwa.answer);

      if (!fatwa) { recordSkip("ibn-uthaymeen", "Not parsed / question-like"); continue; }
      if (!quote) { recordSkip("ibn-uthaymeen", "No clean excerpt"); continue; }
      if (quote.length < 200) { recordSkip("ibn-uthaymeen", "Under 200 chars"); continue; }
      if (startsLikeRoomTalk(quote)) { recordSkip("ibn-uthaymeen", "Starts like room talk"); continue; }
      if (!sharesContentWord(fatwa.title, quote)) { recordSkip("ibn-uthaymeen", "No shared content word"); continue; }
      if (looksLikeQuestion(quote)) { recordSkip("ibn-uthaymeen", "Looks like question"); continue; }

      const stems = quoteStemSet(quote);
      if (isNearDuplicate(stems, existingStemsByScholar["ibn-uthaymeen"])) {
        recordSkip("ibn-uthaymeen", "Near duplicate of existing quote");
        continue;
      }

      const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
      if (!rel.answers) {
        recordSkip("ibn-uthaymeen", `AI rejected: ${rel.reason}`);
        continue;
      }

      results["ibn-uthaymeen"].acceptable.push({
        scholar: "ibn-uthaymeen",
        title: fatwa.title,
        url: link,
        reference,
        quote,
      });
      existingStemsByScholar["ibn-uthaymeen"].push(stems);
      console.log(`[ibn-uthaymeen] Found safe candidate: ${fatwa.title} (${quote.length} chars)`);
    }
  }

  // --- 3. Al-Albani Dry Run ---
  console.log("\n--- 3. Al-Albani (al-albany.com) ---");
  for (const { topic, q } of PRIORITY_25) {
    results["al-albani"].attempted++;
    let hits: any[] = [];
    try {
      hits = await searchAlbani(q);
    } catch {
      continue;
    }
    await sleep(PAUSE_MS);

    for (const hit of hits.slice(0, 2)) {
      results["al-albani"].found++;
      if (existingUrls.has(hit.url)) {
        results["al-albani"].existing++;
        continue;
      }

      const res = await fetch(hit.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      await sleep(PAUSE_MS);
      if (!res.ok) { recordSkip("al-albani", `HTTP ${res.status}`); continue; }

      const collection = hit.series || "صوتيات الإمام الألباني";
      const reference = hit.tape ? `${collection} (الشريط ${hit.tape})` : collection;
      const html = await res.text();
      const fatwa = parseAlbaniFatwa(html, { title: hit.title, printedSource: reference });
      const quote = fatwa && excerpt(fatwa.answer);

      if (!fatwa) { recordSkip("al-albani", "Not parsed / multi-speaker / other speaker"); continue; }
      if (!quote) { recordSkip("al-albani", "No clean excerpt"); continue; }
      if (quote.length < 200) { recordSkip("al-albani", "Under 200 chars"); continue; }
      if (startsLikeRoomTalk(quote)) { recordSkip("al-albani", "Starts like room talk"); continue; }
      if (!sharesContentWord(fatwa.title, quote)) { recordSkip("al-albani", "No shared content word"); continue; }
      if (looksLikeQuestion(quote)) { recordSkip("al-albani", "Looks like question"); continue; }

      const stems = quoteStemSet(quote);
      if (isNearDuplicate(stems, existingStemsByScholar["al-albani"])) {
        recordSkip("al-albani", "Near duplicate of existing quote");
        continue;
      }

      const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
      if (!rel.answers) {
        recordSkip("al-albani", `AI rejected: ${rel.reason}`);
        continue;
      }

      results["al-albani"].acceptable.push({
        scholar: "al-albani",
        title: fatwa.title,
        url: hit.url,
        reference,
        quote,
      });
      existingStemsByScholar["al-albani"].push(stems);
      console.log(`[al-albani] Found safe candidate: ${fatwa.title} (${quote.length} chars)`);
    }
  }

  // --- 4. Al-Barrak Dry Run ---
  console.log("\n--- 4. Al-Barrak (sh-albarrak.com) ---");
  for (const { topic, q } of PRIORITY_25) {
    results["al-barrak"].attempted++;
    let hits: any[] = [];
    try {
      hits = await searchBarrak(q);
    } catch {
      continue;
    }
    await sleep(PAUSE_MS);

    for (const hit of hits.slice(0, 2)) {
      results["al-barrak"].found++;
      if (existingUrls.has(hit.link)) {
        results["al-barrak"].existing++;
        continue;
      }

      const res = await fetch(hit.link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      await sleep(PAUSE_MS);
      if (!res.ok) { recordSkip("al-barrak", `HTTP ${res.status}`); continue; }

      const fatwa = parseBarrakFatwa(await res.text());
      const quote = fatwa ? excerpt(fatwa.answer) : null;

      if (!fatwa) { recordSkip("al-barrak", "Not a signed written fatwa"); continue; }
      if (!quote) { recordSkip("al-barrak", "No clean excerpt"); continue; }
      if (quote.length < 200) { recordSkip("al-barrak", "Under 200 chars"); continue; }
      if (startsLikeRoomTalk(quote)) { recordSkip("al-barrak", "Starts like room talk"); continue; }
      if (!sharesContentWord(fatwa.title, quote)) { recordSkip("al-barrak", "No shared content word"); continue; }
      if (fatwa.title.replace(/\s+/g, " ") !== hit.title.replace(/\s+/g, " ")) { recordSkip("al-barrak", "Title mismatch"); continue; }

      const stems = quoteStemSet(quote);
      if (isNearDuplicate(stems, existingStemsByScholar["al-barrak"])) {
        recordSkip("al-barrak", "Near duplicate of existing quote");
        continue;
      }

      const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
      if (!rel.answers) {
        recordSkip("al-barrak", `AI rejected: ${rel.reason}`);
        continue;
      }

      const reference = fatwa.printedSource ?? `sh-albarrak.com, fatwa ${hit.id}`;
      results["al-barrak"].acceptable.push({
        scholar: "al-barrak",
        title: fatwa.title,
        url: hit.link,
        reference,
        quote,
      });
      existingStemsByScholar["al-barrak"].push(stems);
      console.log(`[al-barrak] Found safe candidate: ${fatwa.title} (${quote.length} chars)`);
    }
  }

  // --- Output Summary ---
  console.log("\n==========================================");
  console.log("DRY RUN SUMMARY (25 Priority Topics)");
  console.log("==========================================");
  for (const [s, data] of Object.entries(results)) {
    console.log(`\nScholar: ${s}`);
    console.log(`  Queries attempted: ${data.attempted}`);
    console.log(`  Hits found: ${data.found}`);
    console.log(`  Already existing: ${data.existing}`);
    console.log(`  Skipped: ${data.skipped}`);
    console.log(`  Acceptable candidates: ${data.acceptable.length}`);
    console.log("  Skip reasons:");
    for (const [r, count] of Object.entries(data.skipReasons)) {
      console.log(`    - ${r}: ${count}`);
    }
    console.log("  Samples:");
    for (let i = 0; i < Math.min(3, data.acceptable.length); i++) {
      const c = data.acceptable[i];
      console.log(`    ${i + 1}. [${c.title}]`);
      console.log(`       Ref: ${c.reference}`);
      console.log(`       URL: ${c.url}`);
      console.log(`       Quote: ${c.quote.slice(0, 120)}... (${c.quote.length} chars)`);
    }
  }

  // Save results to json for report generation
  const fs = await import("fs");
  fs.writeFileSync("docs/dry-run-results.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("\nWrote results to docs/dry-run-results.json");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
