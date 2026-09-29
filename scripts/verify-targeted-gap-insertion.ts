import { createClient } from "@supabase/supabase-js";
import { parseBinBazFatwa } from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const EXPECTED_RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001";

const TARGET_URLS = [
  "https://binbaz.org.sa/fatwas/12004/%D8%A5%D8%B0%D8%A7-%D8%A3%D9%83%D9%84-%D8%A8%D8%B9%D8%AF-%D8%B7%D9%84%D9%88%D8%B9-%D8%A7%D9%84%D9%81%D8%AC%D8%B1-%D8%A8%D8%B7%D9%84-%D8%B5%D9%88%D9%85%D9%87",
  "https://binbaz.org.sa/fatwas/23115/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%A8%D8%A7%D9%84-%D8%A7%D9%84%D9%82%D8%A8%D9%84%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D9%81%D8%B1",
  "https://binbaz.org.sa/fatwas/5796/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B9%D8%A7%D9%85%D9%84-%D9%85%D8%B9-%D8%A7%D9%84%D8%A8%D9%86%D9%88%D9%83-%D8%A8%D8%A7%D9%84%D8%B1%D8%A8%D8%A7-%D9%88%D8%B2%D9%83%D8%A7%D8%AA%D9%87%D8%A7",
  "https://binbaz.org.sa/fatwas/15720/%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%B9%D8%AA%D8%AF%D8%A9-%D8%B9%D8%AF%D8%A9-%D9%88%D9%81%D8%A7%D8%A9",
  "https://binbaz.org.sa/fatwas/8343/%D9%85%D8%AD%D9%84-%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%88%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D9%87%D8%A7",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log("=== 1. Library Counts Verification ===");
  const scholars = ["ibn-baz", "ibn-uthaymeen", "al-albani", "al-barrak"];
  let totalPub = 0;
  let totalUnpub = 0;
  let totalSources = 0;

  for (const s of scholars) {
    const { count: pub } = await db.from("sources").select("*", { count: "exact", head: true }).eq("scholar_id", s).eq("published", true);
    const { count: unpub } = await db.from("sources").select("*", { count: "exact", head: true }).eq("scholar_id", s).eq("published", false);
    const { count: total } = await db.from("sources").select("*", { count: "exact", head: true }).eq("scholar_id", s);

    console.log(`Scholar ${s}: ${pub} published, ${unpub} unpublished, ${total} total`);
    totalPub += pub ?? 0;
    totalUnpub += unpub ?? 0;
    totalSources += total ?? 0;
  }
  console.log(`Totals: ${totalPub} published, ${totalUnpub} unpublished, ${totalSources} overall sources\n`);

  console.log("=== 2. Check Each of the 5 Inserted Sources ===");
  const { data: insertedRows, error: rowsError } = await db
    .from("sources")
    .select("id, scholar_id, rights_id, url, title, text_original, published")
    .in("url", TARGET_URLS);

  if (rowsError || !insertedRows) {
    throw new Error(`Failed to query inserted rows: ${rowsError?.message}`);
  }

  console.log(`Found ${insertedRows.length} rows for the 5 target URLs (expected 5).`);
  if (insertedRows.length !== 5) {
    throw new Error(`Expected 5 inserted rows, found ${insertedRows.length}`);
  }

  for (const row of insertedRows) {
    console.log(`\nChecking source ID: ${row.id}`);
    console.log(`Title: ${row.title}`);
    console.log(`URL: ${row.url}`);
    console.log(`Published: ${row.published}`);
    console.log(`Scholar ID: ${row.scholar_id} (valid: ${row.scholar_id === "ibn-baz"})`);
    console.log(`Rights ID: ${row.rights_id} (valid: ${row.rights_id === EXPECTED_RIGHTS_ID})`);
    console.log(`Quote Length: ${row.text_original.length} chars (valid: ${row.text_original.length >= 200 && row.text_original.length <= 600})`);

    // Verify search document
    const { data: docs, error: docErr } = await db
      .from("source_search_documents")
      .select("id, lang, approved, approved_by, approved_at, search_text")
      .eq("source_id", row.id);

    if (docErr || !docs || docs.length === 0) {
      throw new Error(`Missing search document for source ${row.id}: ${docErr?.message}`);
    }
    const doc = docs[0];
    console.log(`Search Doc: ID=${doc.id}, lang=${doc.lang}, approved=${doc.approved}, approved_by="${doc.approved_by}"`);
    if (!doc.approved || doc.lang !== "ar") {
      throw new Error(`Search document invalid for source ${row.id}`);
    }

    // Spot-check character-for-character against live page
    console.log("Fetching live page for character-for-character spot check...");
    const res = await fetch(row.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      throw new Error(`Live fetch failed for ${row.url}: HTTP ${res.status}`);
    }
    const html = await res.text();
    const fatwa = parseBinBazFatwa(html);
    if (!fatwa) {
      throw new Error(`Live page parser failed for ${row.url}`);
    }

    // Check if the stored quote is an exact substring of the live answer text
    const cleanQuote = row.text_original.trim();
    const cleanAnswer = fatwa.answer.trim();
    const isSubstring = cleanAnswer.includes(cleanQuote);
    console.log(`Character-for-character substring match in live answer: ${isSubstring}`);
    if (!isSubstring) {
      throw new Error(`Character-for-character mismatch for ${row.url}!`);
    }
  }

  console.log("\nAll 5 inserted quotes fully verified!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
