import { createClient } from "@supabase/supabase-js";
import { getVerifier } from "../lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  isNearDuplicate,
  looksLikeQuestion,
  parseBinBazFatwa,
  printedCollection,
  quoteStemSet,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";
import { isScholarTitleRelevant } from "../lib/sources/scholar-rules";

process.loadEnvFile(".env");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 1500;
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001"; // binbaz.org.sa
const APPROVED_BY = "Targeted gap collection authorised by Mo (2026-09-29)";

export type ApprovedTarget = {
  id: string;
  exactPoint: string;
  expectedTitle: string;
  url: string;
};

export const APPROVED_TARGETS: ApprovedTarget[] = [
  {
    id: "fasting-fajr-cutoff",
    exactPoint: "Eating and drinking must cease upon the appearance of the true dawn (Fajr), based on Quran 2:187.",
    expectedTitle: "إذا أكل بعد طلوع الفجر بطل صومه",
    url: "https://binbaz.org.sa/fatwas/12004/%D8%A5%D8%B0%D8%A7-%D8%A3%D9%83%D9%84-%D8%A8%D8%B9%D8%AF-%D8%B7%D9%84%D9%88%D8%B9-%D8%A7%D9%84%D9%81%D8%AC%D8%B1-%D8%A8%D8%B7%D9%84-%D8%B5%D9%88%D9%85%D9%87",
  },
  {
    id: "qibla-facing-kabah",
    exactPoint: "Facing the Ka'bah (the Qibla) is an obligatory condition for the validity of prayer when able.",
    expectedTitle: "حكم استقبال القبلة في الصلاة في السفر",
    url: "https://binbaz.org.sa/fatwas/23115/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%A8%D8%A7%D9%84-%D8%A7%D9%84%D9%82%D8%A8%D9%84%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D9%81%D8%B1",
  },
  {
    id: "riba-categorical-prohibition",
    exactPoint: "Riba is categorically forbidden in the Quran and Sunnah, and is one of the major destructive sins.",
    expectedTitle: "حكم التعامل مع البنوك بالربا وزكاتها",
    url: "https://binbaz.org.sa/fatwas/5796/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B9%D8%A7%D9%85%D9%84-%D9%85%D8%B9-%D8%A7%D9%84%D8%A8%D9%86%D9%88%D9%83-%D8%A8%D8%A7%D9%84%D8%B1%D8%A8%D8%A7-%D9%88%D8%B2%D9%83%D8%A7%D8%AA%D9%87%D8%A7",
  },
  {
    id: "widow-waiting-period",
    exactPoint: "The waiting period ('iddah) for a woman whose husband passes away is four months and ten days unless pregnant.",
    expectedTitle: "أحكام المعتدة عدة وفاة",
    url: "https://binbaz.org.sa/fatwas/15720/%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%B9%D8%AA%D8%AF%D8%A9-%D8%B9%D8%AF%D8%A9-%D9%88%D9%81%D8%A7%D8%A9",
  },
  {
    id: "intention-in-worship",
    exactPoint: "Intention (niyyah) in the heart is a required condition for the validity and acceptance of every act of worship.",
    expectedTitle: "محل النية وحكم التلفظ بها",
    url: "https://binbaz.org.sa/fatwas/8343/%D9%85%D8%AD%D9%84-%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%88%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D9%87%D8%A7",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const verifier = getVerifier();

  // Load existing published sources for deduplication
  const { data: existingRows } = await db
    .from("sources")
    .select("id, url, text_original, scholar_id")
    .eq("published", true);

  const existingUrls = new Set((existingRows ?? []).map((r) => r.url));
  const existingStems: Set<string>[] = (existingRows ?? [])
    .filter((r) => r.scholar_id === "ibn-baz")
    .map((r) => quoteStemSet(r.text_original));

  console.log(`Starting targeted gap collection for exactly ${APPROVED_TARGETS.length} approved targets...\n`);

  let storedCount = 0;
  const storedItems: Array<{ id: string; title: string; sourceId: string; url: string; charCount: number }> = [];

  for (let i = 0; i < APPROVED_TARGETS.length; i++) {
    const target = APPROVED_TARGETS[i];
    console.log(`[Target ${i + 1}/${APPROVED_TARGETS.length}] Processing ${target.id}...`);

    if (existingUrls.has(target.url)) {
      console.log(`   Skipped: URL already published in library: ${target.url}`);
      continue;
    }

    await sleep(PAUSE_MS);

    // Re-fetch the full official URL immediately before inserting
    const res = await fetch(target.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${target.url}: HTTP ${res.status}`);
    }

    const html = await res.text();
    const fatwa = parseBinBazFatwa(html);
    if (!fatwa) {
      throw new Error(`Failed to parse fatwa content for ${target.url}`);
    }

    // Exact title match confirmation
    const cleanFatwaTitle = fatwa.title.trim().replace(/\s+/g, " ");
    const cleanExpectedTitle = target.expectedTitle.trim().replace(/\s+/g, " ");
    if (cleanFatwaTitle !== cleanExpectedTitle) {
      throw new Error(`Title mismatch for ${target.id}: got "${cleanFatwaTitle}", expected "${cleanExpectedTitle}"`);
    }

    const quote = excerpt(fatwa.answer);
    if (!quote) {
      throw new Error(`No clean excerpt under 600 characters for ${target.id}`);
    }
    if (quote.length < 200 || quote.length > 600) {
      throw new Error(`Quote length out of bounds (${quote.length} chars) for ${target.id}`);
    }
    if (looksLikeQuestion(quote)) {
      throw new Error(`Quote contains question text for ${target.id}`);
    }
    if (startsLikeRoomTalk(quote)) {
      throw new Error(`Quote starts like room talk for ${target.id}`);
    }
    if (!sharesContentWord(fatwa.title, quote)) {
      throw new Error(`Quote does not share content word with title for ${target.id}`);
    }

    // Strict title relevance check
    if (!isScholarTitleRelevant([target.exactPoint, fatwa.title], fatwa.title)) {
      throw new Error(`Title failed strict title relevance gate for ${target.id}`);
    }

    // Deduplication check
    const stems = quoteStemSet(quote);
    if (isNearDuplicate(stems, existingStems)) {
      throw new Error(`Near duplicate detected for ${target.id}`);
    }

    // AI verifier relevance check
    const rel = await checkQuoteRelevance(verifier, fatwa.title, quote);
    if (!rel.answers) {
      throw new Error(`AI verifier rejected relevance for ${target.id}: ${rel.reason}`);
    }

    // All checks passed! Perform database insertion
    const printed = printedCollection(fatwa.printedSource);
    const fatwaNumMatch = target.url.match(/\/fatwas\/(\d+)\//);
    const refNum = fatwaNumMatch ? fatwaNumMatch[1] : "";
    const reference = printed?.reference ?? `binbaz.org.sa, fatwa ${refNum}`;
    const collection = printed?.collection ?? "binbaz.org.sa";

    const { data: source, error: insertError } = await db
      .from("sources")
      .insert({
        kind: "fatwa",
        scholar_id: "ibn-baz",
        title: fatwa.title.slice(0, 300),
        reference,
        collection,
        language: "ar",
        text_original: quote,
        url: target.url,
        rights_id: RIGHTS_ID,
        published: true,
      })
      .select("id")
      .single();

    if (insertError || !source) {
      throw new Error(`Could not insert source for ${target.id}: ${insertError?.message}`);
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
      throw new Error(`Inserted source ${source.id} but search document failed: ${docError.message}`);
    }

    storedCount++;
    existingUrls.add(target.url);
    existingStems.push(stems);
    storedItems.push({
      id: target.id,
      title: fatwa.title,
      sourceId: source.id,
      url: target.url,
      charCount: quote.length,
    });

    console.log(`   Stored successfully: "${fatwa.title}" (source_id: ${source.id}, length: ${quote.length} chars)`);
  }

  console.log(`\nTargeted gap collection complete: stored ${storedCount} new quotes.`);
}

main().catch((e) => {
  console.error("Targeted gap collection fatal error:", e);
  process.exit(1);
});
