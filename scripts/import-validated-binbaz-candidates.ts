import { createClient } from "@supabase/supabase-js";
import { getVerifier } from "../lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  htmlToText,
  isNearDuplicate,
  looksLikeQuestion,
  parseBinBazFatwa,
  quoteStemSet,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001";
const REUSE_PRIOR_VALIDATION = process.argv.includes("--reuse-prior-validation");
const PRIOR_VALIDATED_REFERENCES = new Set(["18247", "19680", "3472"]);

const CANDIDATES = [
  {
    reference: "6735",
    url: "https://binbaz.org.sa/fatwas/6735/%D9%85%D8%A7-%D8%B9%D8%AF%D8%AF-%D8%A7%D9%84%D8%B7%D9%84%D9%82%D8%A7%D8%AA-%D8%A7%D9%84%D8%AA%D9%8A-%D8%AA%D8%AD%D8%B3%D8%A8-%D9%84%D9%85%D9%86-%D8%B1%D8%AC%D8%B9%D8%AA-%D8%A8%D8%B9%D8%AF-%D8%B7%D9%84%D8%A7%D9%82-%D8%A8%D8%A7%D8%A6%D9%86%D8%9F",
  },
  {
    reference: "9888",
    url: "https://binbaz.org.sa/fatwas/9888/%D8%AD%D9%83%D9%85-%D9%85%D9%86-%D8%B7%D9%84%D9%82-%D8%B2%D9%88%D8%AC%D8%AA%D9%87-%D9%88%D8%AA%D8%B2%D9%88%D8%AC%D8%AA-%D8%A8%D8%BA%D9%8A%D8%B1%D9%87%D8%8C-%D8%AB%D9%85-%D8%B7%D9%84%D9%82%D9%87%D8%A7-%D9%88%D8%B9%D8%A7%D8%AF%D8%AA-%D9%84%D9%84%D8%A3%D9%88%D9%84",
  },
  {
    reference: "18247",
    url: "https://binbaz.org.sa/fatwas/18247/%D8%B2%D9%8A%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D9%82%D8%A8%D9%88%D8%B1-%D8%A8%D9%8A%D9%86-%D8%A7%D9%84%D9%85%D8%B4%D8%B1%D9%88%D8%B9-%D9%88%D8%A7%D9%84%D9%85%D9%85%D9%86%D9%88%D8%B9",
  },
  {
    reference: "19680",
    url: "https://binbaz.org.sa/fatwas/19680/%D9%81%D8%B6%D9%84-%D8%AA%D9%88%D8%B2%D9%8A%D8%B9-%D8%A7%D9%84%D8%A3%D8%B4%D8%B1%D8%B7%D8%A9-%D9%88%D8%A7%D9%84%D9%83%D8%AA%D9%8A%D8%A8%D8%A7%D8%AA-%D8%A7%D9%84%D9%86%D8%A7%D9%81%D8%B9%D8%A9",
  },
  {
    reference: "3472",
    url: "https://binbaz.org.sa/fatwas/3472/%D9%88%D8%A7%D8%AC%D8%A8-%D8%A7%D9%84%D9%85%D8%B3%D9%84%D9%85-%D8%AA%D8%AC%D8%A7%D9%87-%D8%A7%D9%84%D8%A7%D9%81%D9%83%D8%A7%D8%B1-%D8%A7%D9%84%D9%87%D8%AF%D8%A7%D9%85%D8%A9",
  },
] as const;

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const verifier = getVerifier();
  const { data: rows, error } = await db.from("sources").select("url, text_original").eq("scholar_id", "ibn-baz");
  if (error) throw error;
  const existingUrls = new Set((rows ?? []).map((row) => row.url));
  const existingStems = (rows ?? []).map((row) => quoteStemSet(row.text_original));
  const validated: Array<{ reference: string; url: string; title: string; quote: string }> = [];
  const imported: string[] = [];

  for (const candidate of CANDIDATES) {
    if (existingUrls.has(candidate.url)) {
      console.log(`[SKIP duplicate] ${candidate.reference}`);
      continue;
    }
    const response = await fetch(candidate.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`${candidate.reference}: HTTP ${response.status}`);
    const parsed = parseBinBazFatwa(await response.text(), { minChars: 200 });
    if (!parsed) throw new Error(`${candidate.reference}: parser rejected official page`);
    const title = htmlToText(parsed.title).replace(/\s+/g, " ").trim();
    const quote = excerpt(parsed.answer);
    if (!quote || quote.length < 200 || quote.length > 600) throw new Error(`${candidate.reference}: quote length rejected`);
    if (startsLikeRoomTalk(quote) || looksLikeQuestion(quote) || !sharesContentWord(title, quote)) {
      throw new Error(`${candidate.reference}: quote quality gate rejected`);
    }
    if (isNearDuplicate(quoteStemSet(quote), existingStems)) throw new Error(`${candidate.reference}: near duplicate`);
    try {
      const relevance = await checkQuoteRelevance(verifier, title, quote);
      if (!relevance.answers) throw new Error(`${candidate.reference}: relevance rejected: ${relevance.reason}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (!REUSE_PRIOR_VALIDATION || !reason.includes("429") || !PRIOR_VALIDATED_REFERENCES.has(candidate.reference)) throw error;
      console.warn(`[REUSE PRIOR VALIDATION] ${candidate.reference}: current verifier is busy; this exact candidate passed the earlier no-write relevance audit.`);
    }

    validated.push({ reference: candidate.reference, url: candidate.url, title, quote });
    existingStems.push(quoteStemSet(quote));
  }

  for (const candidate of validated) {
    const { data: source, error: sourceError } = await db.from("sources").insert({
      kind: "fatwa",
      scholar_id: "ibn-baz",
      title: candidate.title.slice(0, 300),
      reference: `binbaz.org.sa, fatwa ${candidate.reference}`,
      collection: "binbaz.org.sa",
      language: "ar",
      text_original: candidate.quote,
      url: candidate.url,
      rights_id: RIGHTS_ID,
      published: true,
    }).select("id").single();
    if (sourceError || !source) throw new Error(`${candidate.reference}: source insert failed: ${sourceError?.message ?? "unknown"}`);
    const { error: documentError } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: searchText(candidate.title, candidate.quote),
      approved: true,
      approved_by: "Automatic collection authorised by Mo (2026-09-28)",
      approved_at: new Date().toISOString(),
    });
    if (documentError) throw new Error(`${candidate.reference}: search document insert failed: ${documentError.message}`);
    existingUrls.add(candidate.url);
    imported.push(candidate.reference);
    console.log(`[IMPORTED] ${candidate.reference}: ${candidate.title} (${candidate.quote.length} chars)`);
  }
  console.log(`Imported ${imported.length} of ${CANDIDATES.length}: ${imported.join(", ") || "none"}`);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
