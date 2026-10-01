import { createClient } from "@supabase/supabase-js";
import { SCHOLAR_QUERIES } from "@/data/scholar-queries";
import { getVerifier } from "@/lib/ai";
import {
  checkQuoteRelevance,
  extractContentStems,
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
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "@/lib/sources/scholar-excerpt";
import { parseBarrakFatwa } from "@/lib/sources/parsers/barrak";

process.loadEnvFile(".env");

const SCHOLAR_ARG = process.argv.find((a) => a.startsWith("--scholar="))?.split("=")[1];
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const OFFSET = Number(process.argv.find((a) => a.startsWith("--offset="))?.split("=")[1] ?? 0);
const MAX_STORED = Number(process.argv.find((a) => a.startsWith("--max-stored="))?.split("=")[1] ?? 50);
const SEARCH_PAGES = Math.max(1, Math.min(5, Number(process.argv.find((a) => a.startsWith("--pages="))?.split("=")[1] ?? 1)));
const DRY_RUN = process.argv.includes("--dry-run");
// Review-by-hand mode: skip the Gemini relevance check. Only allowed with --dry-run so nothing unreviewed is stored.
const SKIP_AI = process.argv.includes("--skip-ai");
if (SKIP_AI && !DRY_RUN) throw new Error("--skip-ai is only allowed together with --dry-run");
const EXTRA_QUERY = process.argv.find((a) => a.startsWith("--extra-query="))?.slice("--extra-query=".length);
const HITS_PER_QUERY = Math.max(1, Math.min(10, Number(process.argv.find((a) => a.startsWith("--hits="))?.split("=")[1] ?? 3)));

// Index mode (Ibn Baz only): walk the saved archive index in order instead of searching topics.
// Every processed reference is recorded in the state file so a stopped run resumes where it left off.
const INDEX_FILE = process.argv.find((a) => a.startsWith("--from-index="))?.slice("--from-index=".length);
const STATE_FILE = process.argv.find((a) => a.startsWith("--state="))?.slice("--state=".length) ?? "docs/binbaz-run-state.json";
const BATCH_FILE = process.argv.find((a) => a.startsWith("--batch-file="))?.slice("--batch-file=".length);

const PAUSE_MS = 1500;
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RIGHTS_IDS: Record<string, string> = {
  "ibn-baz": "fabd29fd-a03d-4421-a685-638383570001",
  "ibn-uthaymeen": "7306bf6c-4898-4da9-8cd0-3473cb07a65c",
  "al-albani": "b808230c-6e30-4986-ae07-9aefd1a7f622",
  "al-barrak": "98e7ca42-5684-45e4-a32e-bdf054bee8dc",
};

// --- Search implementations ---
async function searchBinBaz(q: string) {
  const all: Array<{ id: number; reference: number; title: string }> = [];
  const seen = new Set<number>();
  for (let page = 1; page <= SEARCH_PAGES; page++) {
    const res = await fetch(`https://binbaz.org.sa/api/search?type=fatwa&operator=AND_ONLY&page=${page}&q=${encodeURIComponent(q)}`, {
      headers: { ...HEADERS, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { Search?: { results?: Array<{ id: number; reference: number; title: string }> } };
    const results = (data.Search?.results ?? []).filter((h) => Number.isInteger(h.reference) && typeof h.title === "string");
    for (const hit of results) {
      if (!seen.has(hit.reference)) { seen.add(hit.reference); all.push(hit); }
    }
    if (results.length === 0) break;
    await sleep(300);
  }
  return all;
}

async function searchUthaymeen(q: string) {
  const all: Array<{ id: string; title: { ar?: string } }> = [];
  const seen = new Set<string>();
  for (let page = 1; page <= SEARCH_PAGES; page++) {
    const res = await fetch("https://shekhcp.binothaimeen.net/api/search-data", {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page, mode: "exact" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { data?: Array<{ id: string; title: { ar?: string } }> };
    const results = (data.data ?? []).filter((h) => typeof h.id === "string" && typeof h.title?.ar === "string");
    for (const hit of results) {
      if (!seen.has(hit.id)) { seen.add(hit.id); all.push(hit); }
    }
    if (results.length === 0) break;
    await sleep(300);
  }
  return all;
}

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

async function runForScholar(scholarId: string) {
  console.log(`\n==================================================`);
  console.log(`STARTING COLLECTION FOR: ${scholarId.toUpperCase()}`);
  console.log(`${DRY_RUN ? "Dry-run validated candidates" : "Max to store this run"}: ${MAX_STORED}`);
  console.log(`Official search pages per query: ${SEARCH_PAGES}`);
  console.log(`==================================================\n`);

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const verifier = getVerifier();

  // Preload URLs and stem sets for deduplication
  const { data: existingRows } = await db.from("sources").select("id, url, title, text_original").eq("scholar_id", scholarId);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.url));
  const existingUthaymeenIds = new Set((existingRows ?? []).map((r) => r.url.split("/").pop()));
  const existingStems: Set<string>[] = (existingRows ?? []).map((r) => quoteStemSet(r.text_original));
  // Index mode: same-topic title gate (two or more shared title words, at least 75% of the shorter title).
  const titleStems: Set<string>[] = (existingRows ?? []).map((r) => extractContentStems(r.title ?? ""));
  const sameTopicTitle = (t: string) => {
    const mine = extractContentStems(t);
    if (mine.size < 2) return false;
    for (const other of titleStems) {
      if (other.size < 2) continue;
      let common = 0;
      for (const w of mine) if (other.has(w)) common++;
      if (common >= 2 && common / Math.min(mine.size, other.size) >= 0.6) return true;
    }
    return false;
  };

  const seenUrls = new Set<string>();
  let queriesAttempted = 0;
  let hitsFound = 0;
  let existingCount = 0;
  let skippedCount = 0;
  let storedCount = 0;
  const skipReasons: Record<string, number> = {};
  const newlyStored: Array<{ id: string; title: string; url: string; reference: string; collection?: string; quote: string }> = [];

  // Index-mode state: which archive references were already looked at (so the run can resume).
  const fsSync = await import("fs");
  const useIndex = Boolean(INDEX_FILE) && scholarId === "ibn-baz";
  const archiveIndex: Record<string, { id: number; title: string }> = useIndex ? JSON.parse(fsSync.readFileSync(INDEX_FILE!, "utf-8")).items : {};
  const runState: { processed: Record<string, string>; requests: number; requestErrors: number } = useIndex && fsSync.existsSync(STATE_FILE)
    ? JSON.parse(fsSync.readFileSync(STATE_FILE, "utf-8"))
    : { processed: {}, requests: 0, requestErrors: 0 };
  let currentRef: string | null = null;
  let runRequests = 0;
  let runRequestErrors = 0;
  const markState = (ref: string | null, status: string) => {
    if (!useIndex || !ref) return;
    runState.processed[ref] = status;
    fsSync.writeFileSync(STATE_FILE, JSON.stringify(runState), "utf-8");
  };

  const recordSkip = (reason: string) => {
    skippedCount++;
    skipReasons[reason] = (skipReasons[reason] || 0) + 1;
    markState(currentRef, reason);
  };

  const queries = useIndex
    ? [{ topic: "index", q: "index" }]
    : EXTRA_QUERY
      ? [{ topic: "extra-query", q: EXTRA_QUERY }]
      : SCHOLAR_QUERIES.slice(OFFSET, OFFSET + LIMIT);

  for (const { topic, q } of queries) {
    if (storedCount >= MAX_STORED) {
      console.log(`Reached max stored limit of ${MAX_STORED}. Stopping.`);
      break;
    }

    queriesAttempted++;
    if (queriesAttempted % 20 === 1) {
      console.log(`[${queriesAttempted}/${queries.length}] query: "${q}" (stored so far: ${storedCount})`);
    }
    let hits: any[] = [];
    try {
      if (useIndex) {
        const done = new Set(Object.keys(runState.processed));
        const from = Number(process.argv.find((a) => a.startsWith("--ref-from="))?.split("=")[1] ?? 0);
        hits = Object.entries(archiveIndex)
          .filter(([ref]) => !done.has(ref) && Number(ref) >= from)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([ref, v]) => ({ id: v.id, reference: Number(ref), title: v.title }));
      } else if (scholarId === "ibn-baz") hits = await searchBinBaz(q);
      else if (scholarId === "ibn-uthaymeen") hits = await searchUthaymeen(q);
      else if (scholarId === "al-albani") hits = await searchAlbani(q);
      else if (scholarId === "al-barrak") hits = await searchBarrak(q);
    } catch (err) {
      console.log(`[${topic}] search error: ${(err as Error).message}`);
      await sleep(PAUSE_MS);
      continue;
    }
    if (!useIndex) await sleep(PAUSE_MS);

    for (const hit of useIndex ? hits : hits.slice(0, HITS_PER_QUERY)) {
      if (storedCount >= MAX_STORED) break;
      currentRef = scholarId === "ibn-baz" ? String(hit.reference) : null;

      let link = "";
      let hitTitle = "";
      if (scholarId === "ibn-baz") {
        link = `https://binbaz.org.sa/fatwas/${hit.reference}/${encodeURIComponent(hit.title.trim().replace(/\s+/g, "-"))}`;
        hitTitle = hit.title.trim();
      } else if (scholarId === "ibn-uthaymeen") {
        hitTitle = htmlToText(hit.title?.ar ?? "").replace(/^-\s*/, "").trim();
      } else if (scholarId === "al-albani") {
        link = hit.url;
        hitTitle = hit.title;
      } else if (scholarId === "al-barrak") {
        link = hit.link;
        hitTitle = hit.title;
      }

      hitsFound++;

      if (link && (existingUrls.has(link) || seenUrls.has(link))) {
        existingCount++;
        markState(currentRef, "existing");
        continue;
      }
      if (link) seenUrls.add(link);
      if (useIndex && scholarId === "ibn-baz" && sameTopicTitle(hitTitle)) {
        recordSkip("Same topic as a stored title");
        continue;
      }

      let fatwa: { title: string; answer: string; printedSource: string | null } | null = null;
      let reference = "";
      let collectionName = "";

      if (scholarId === "ibn-baz") {
        let res: Response;
        runRequests++;
        try {
          res = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
        } catch {
          runRequestErrors++;
          console.log(`  request error for ${hit.reference} (${runRequestErrors}/${runRequests})`);
          await sleep(PAUSE_MS);
          continue; // not recorded in state: it is tried again next run
        }
        await sleep(PAUSE_MS);
        if (res.status >= 500 || res.status === 429) { runRequestErrors++; console.log(`  HTTP ${res.status} for ${hit.reference} (${runRequestErrors}/${runRequests})`); continue; }
        if (!res.ok) { recordSkip(`HTTP ${res.status}`); continue; }
        fatwa = parseBinBazFatwa(await res.text(), { minChars: 200 });
        if (fatwa && fatwa.title.replace(/\s+/g, " ") !== hitTitle.replace(/\s+/g, " ")) {
          recordSkip("Title mismatch");
          continue;
        }
        const printed = printedCollection(fatwa?.printedSource ?? null);
        reference = printed?.reference ?? `binbaz.org.sa, fatwa ${hit.reference}`;
        collectionName = printed?.collection ?? "binbaz.org.sa";
      } else if (scholarId === "ibn-uthaymeen") {
        if (existingUthaymeenIds.has(hit.id) || seenUrls.has(hit.id)) {
          existingCount++;
          continue;
        }
        seenUrls.add(hit.id);
        if (isUthaymeenTafsirLesson(hitTitle)) {
          recordSkip("Tafsir lesson");
          continue;
        }
        const detailUrl = `https://shekhapi.binothaimeen.net/lessons/audios/show/${hit.id}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`;
        const res = await fetch(detailUrl, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(20_000) });
        await sleep(PAUSE_MS);
        if (!res.ok) { recordSkip(`HTTP ${res.status}`); continue; }
        const detail = (await res.json())?.data;
        if (!detail?.objective?.content?.ar) { recordSkip("No content"); continue; }

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
        if (!isFatwaCollection) { recordSkip("Not fatwa collection"); continue; }

        const sectionTitle = section?.title?.ar?.trim() || "فتاوى";
        collectionName = seriesTitle || topParentTitle || "فتاوى الشيخ ابن عثيمين";
        reference = `${collectionName} (${sectionTitle})`;
        link = `https://binothaimeen.net/ar/voice_library/lessonDetails/${encodeURIComponent(sectionTitle.replace(/\s+/g, "-"))}/${encodeURIComponent(hitTitle.replace(/\s+/g, "-"))}/${hit.id}`;

        if (existingUrls.has(link) || seenUrls.has(link)) { existingCount++; continue; }
        seenUrls.add(link);

        fatwa = parseUthaymeenFatwa(detail.objective.content.ar, { title: hitTitle, printedSource: reference, minChars: 200 });
      } else if (scholarId === "al-albani") {
        const res = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
        await sleep(PAUSE_MS);
        if (!res.ok) { recordSkip(`HTTP ${res.status}`); continue; }
        collectionName = hit.series || "صوتيات الإمام الألباني";
        reference = hit.tape ? `${collectionName} (الشريط ${hit.tape})` : collectionName;
        fatwa = parseAlbaniFatwa(await res.text(), { title: hitTitle, printedSource: reference });
      } else if (scholarId === "al-barrak") {
        const res = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
        await sleep(PAUSE_MS);
        if (!res.ok) { recordSkip(`HTTP ${res.status}`); continue; }
        fatwa = parseBarrakFatwa(await res.text());
        if (fatwa && fatwa.title.replace(/\s+/g, " ") !== hitTitle.replace(/\s+/g, " ")) {
          recordSkip("Title mismatch");
          continue;
        }
        reference = fatwa?.printedSource ?? `sh-albarrak.com, fatwa ${hit.id}`;
        collectionName = "sh-albarrak.com";
      }

      if (!fatwa) { recordSkip("Not parsed / rejected by parser"); continue; }
      const quote = excerpt(fatwa.answer);
      if (!quote) { recordSkip("No clean excerpt"); continue; }
      if (quote.length < 200) { recordSkip("Quote under 200 chars"); continue; }
      if (startsLikeRoomTalk(quote)) { recordSkip("Starts like room talk"); continue; }
      if (!sharesContentWord(fatwa.title, quote)) { recordSkip("No shared content word with title"); continue; }
      if (looksLikeQuestion(quote)) { recordSkip("Looks like question"); continue; }
      // Index mode: stricter mechanical gate for text with gaps or openers that point to something we do not show.
      if (useIndex && (/\.{2,}|…|&[a-z]+;/.test(quote) || /^(فقد (وصلني|اطلعت|قرأت)|فلقد قرأت|تقدم|مثل ما تقدم|سبق|وسبق|ما سمعت|تكميل|أسئلة|على كل حال|بسم الله|سمعتم)/.test(quote))) { recordSkip("Gap or context opener"); continue; }

      // Deduplication check
      const stems = quoteStemSet(quote);
      if (isNearDuplicate(stems, existingStems, useIndex ? 0.5 : 0.7)) {
        recordSkip("Near duplicate of existing quote");
        continue;
      }

      // AI relevance check
      if (!SKIP_AI) {
        const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
        if (!rel.answers) {
          recordSkip(`AI rejected: ${rel.reason}`);
          continue;
        }
      }

      if (DRY_RUN) {
        existingStems.push(stems);
        titleStems.push(extractContentStems(fatwa.title));
        markState(currentRef, "candidate");
        storedCount++;
        newlyStored.push({
          id: "dry-run",
          title: fatwa.title,
          url: link,
          reference,
          collection: collectionName,
          quote,
        });
        console.log(`[VALIDATED ${storedCount}/${MAX_STORED}] (${scholarId}) ${fatwa.title} (${quote.length} chars)`);
        continue;
      }

      // Store in DB
      const rightsId = RIGHTS_IDS[scholarId];
      const { data: source, error: srcErr } = await db
        .from("sources")
        .insert({
          kind: "fatwa",
          scholar_id: scholarId,
          title: fatwa.title.slice(0, 300),
          reference,
          collection: collectionName,
          language: "ar",
          text_original: quote,
          url: link,
          rights_id: rightsId,
          published: true,
        })
        .select("id")
        .single();

      if (srcErr || !source) {
        console.error(`  Could not store ${link}: ${srcErr?.message}`);
        recordSkip(`DB insert error: ${srcErr?.message}`);
        continue;
      }

      const { error: docErr } = await db.from("source_search_documents").insert({
        source_id: source.id,
        lang: "ar",
        search_text: searchText(fatwa.title, quote),
        approved: true,
        approved_by: APPROVED_BY,
        approved_at: new Date().toISOString(),
      });

      if (docErr) {
        console.error(`  Search doc error for ${source.id}: ${docErr.message}`);
      }

      existingUrls.add(link);
      if (scholarId === "ibn-uthaymeen") existingUthaymeenIds.add(hit.id);
      existingStems.push(stems);
      storedCount++;
      newlyStored.push({
        id: source.id,
        title: fatwa.title,
        url: link,
        reference,
        collection: collectionName,
        quote,
      });

      console.log(`[STORED ${storedCount}/${MAX_STORED}] (${scholarId}) ${fatwa.title} (${quote.length} chars)`);
    }
  }

  console.log(`\n--- Batch Summary for ${scholarId} ---`);
  console.log(`Queries attempted: ${queriesAttempted}`);
  console.log(`Hits found: ${hitsFound}`);
  console.log(`Already existing: ${existingCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Newly stored: ${storedCount}`);
  if (useIndex) {
    console.log(`Index mode: ${runRequests} page requests, ${runRequestErrors} request errors, ${Object.keys(runState.processed).length} references processed in total`);
    if (BATCH_FILE) fsSync.writeFileSync(BATCH_FILE, JSON.stringify({ requests: runRequests, requestErrors: runRequestErrors, skipReasons, candidates: newlyStored }, null, 2), "utf-8");
  }
  console.log(`Skip reasons:`);
  for (const [r, c] of Object.entries(skipReasons)) {
    console.log(`  - ${r}: ${c}`);
  }

  return {
    scholarId,
    queriesAttempted,
    hitsFound,
    existingCount,
    skippedCount,
    storedCount,
    skipReasons,
    newlyStored,
  };
}

async function main() {
  const scholars = SCHOLAR_ARG ? [SCHOLAR_ARG] : ["ibn-baz", "ibn-uthaymeen", "al-albani", "al-barrak"];
  const fs = await import("fs");
  const resultsPath = DRY_RUN ? "docs/expansion-batch-dry-run.json" : "docs/expansion-batch-stored.json";
  let allResults: Record<string, any> = {};
  if (!DRY_RUN && fs.existsSync(resultsPath)) {
    try { allResults = JSON.parse(fs.readFileSync(resultsPath, "utf-8")); } catch {}
  }

  for (const s of scholars) {
    const res = await runForScholar(s);
    if (allResults[s]) {
      const prev = allResults[s];
      const mergedSkipReasons: Record<string, number> = { ...(prev.skipReasons || {}) };
      for (const [r, c] of Object.entries(res.skipReasons)) {
        mergedSkipReasons[r] = (mergedSkipReasons[r] || 0) + (c as number);
      }
      allResults[s] = {
        scholarId: s,
        queriesAttempted: (prev.queriesAttempted || 0) + res.queriesAttempted,
        hitsFound: (prev.hitsFound || 0) + res.hitsFound,
        existingCount: (prev.existingCount || 0) + res.existingCount,
        skippedCount: (prev.skippedCount || 0) + res.skippedCount,
        storedCount: (prev.storedCount || 0) + res.storedCount,
        skipReasons: mergedSkipReasons,
        newlyStored: [...(prev.newlyStored || []), ...res.newlyStored],
      };
    } else {
      allResults[s] = res;
    }
  }

  fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2), "utf-8");
  console.log(`\nSaved ${DRY_RUN ? "dry-run validation" : "expansion"} results to ${resultsPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
