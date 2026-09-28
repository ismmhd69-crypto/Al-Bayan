import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "./../lib/sources/scholar-excerpt";
process.loadEnvFile(".env");

const HEADERS = {
  "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)",
};

async function spotCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const db = createClient(url, key);

  const { data: rows } = await db
    .from("sources")
    .select("id, title, reference, collection, url, text_original")
    .eq("scholar_id", "al-albani")
    .order("id");

  console.log(`Total al-Albani quotes stored: ${rows?.length}\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < (rows?.length ?? 0); i++) {
    const r = rows![i];
    console.log(`Checking [${i + 1}/${rows!.length}] ${r.title.slice(0, 50)}...`);
    console.log(`URL: ${r.url}`);

    let res;
    try {
      res = await fetch(r.url, { headers: HEADERS });
    } catch (e) {
      console.log(`  ERROR: fetch failed: ${(e as Error).message}`);
      failed++;
      continue;
    }

    if (!res.ok) {
      console.log(`  ERROR: HTTP status ${res.status}`);
      failed++;
      continue;
    }

    const html = await res.text();
    const liveClean = htmlToText(html).replace(/\s+/g, " ");
    const quoteClean = r.text_original.replace(/\s+/g, " ");

    const quoteMatches = liveClean.includes(quoteClean);
    const titleClean = r.title.replace(/\s+/g, " ");
    const titleMatches = liveClean.includes(titleClean);

    if (quoteMatches && titleMatches) {
      console.log(`  PASS: Title matches, quote verbatim in live page (${r.text_original.length} chars).`);
      passed++;
    } else {
      console.log(`  FAIL: quoteMatches=${quoteMatches}, titleMatches=${titleMatches}`);
      failed++;
    }
  }

  console.log(`\nFinal Spot-Check Result: ${passed}/${rows?.length} PASSED, ${failed} FAILED.`);
}

spotCheck();
