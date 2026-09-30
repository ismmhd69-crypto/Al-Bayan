import { createClient } from "@supabase/supabase-js";
import {
  excerpt,
  parseAlbaniFatwa,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  printedCollection,
} from "@/lib/sources/scholar-excerpt";
import { parseBarrakFatwa } from "@/lib/sources/parsers/barrak";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXPECTED_RIGHTS: Record<string, string> = {
  "ibn-baz": "fabd29fd-a03d-4421-a685-638383570001",
  "ibn-uthaymeen": "7306bf6c-4898-4da9-8cd0-3473cb07a65c",
  "al-albani": "b808230c-6e30-4986-ae07-9aefd1a7f622",
  "al-barrak": "98e7ca42-5684-45e4-a32e-bdf054bee8dc",
};

type SpotCheckResult = {
  id: string;
  scholarId: string;
  title: string;
  url: string;
  reference: string;
  rightsIdMatch: boolean;
  searchDocApproved: boolean;
  liveFetchOk: boolean;
  charExactMatch: boolean;
  diffSummary?: string;
  error?: string;
};

async function checkIbnBaz(source: any): Promise<SpotCheckResult> {
  const result: SpotCheckResult = {
    id: source.id,
    scholarId: source.scholar_id,
    title: source.title,
    url: source.url,
    reference: source.reference,
    rightsIdMatch: source.rights_id === EXPECTED_RIGHTS["ibn-baz"],
    searchDocApproved: false,
    liveFetchOk: false,
    charExactMatch: false,
  };

  try {
    const res = await fetch(source.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }
    result.liveFetchOk = true;
    const html = await res.text();
    const fatwa = parseBinBazFatwa(html, { minChars: 200 });
    if (!fatwa) {
      result.error = "Parser returned null on live HTML";
      return result;
    }
    const cleanExcerpt = excerpt(fatwa.answer);
    if (!cleanExcerpt) {
      result.error = "Excerpt returned null on live answer";
      return result;
    }
    result.charExactMatch = cleanExcerpt === source.text_original;
    if (!result.charExactMatch) {
      result.diffSummary = `Expected ${source.text_original.length} chars, got ${cleanExcerpt.length} chars`;
    }
  } catch (err) {
    result.error = (err as Error).message;
  }
  return result;
}

async function checkIbnUthaymeen(source: any): Promise<SpotCheckResult> {
  const result: SpotCheckResult = {
    id: source.id,
    scholarId: source.scholar_id,
    title: source.title,
    url: source.url,
    reference: source.reference,
    rightsIdMatch: source.rights_id === EXPECTED_RIGHTS["ibn-uthaymeen"],
    searchDocApproved: false,
    liveFetchOk: false,
    charExactMatch: false,
  };

  try {
    const audioId = source.url.split("/").pop();
    const detailUrl = `https://shekhapi.binothaimeen.net/lessons/audios/show/${audioId}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`;
    const res = await fetch(detailUrl, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }
    result.liveFetchOk = true;
    const json = await res.json();
    const content = json?.data?.objective?.content?.ar;
    if (!content) {
      result.error = "No objective.content.ar in API response";
      return result;
    }
    const fatwa = parseUthaymeenFatwa(content, { title: source.title, printedSource: source.reference, minChars: 200 });
    if (!fatwa) {
      result.error = "Parser returned null on live content";
      return result;
    }
    const cleanExcerpt = excerpt(fatwa.answer);
    result.charExactMatch = cleanExcerpt === source.text_original;
    if (!result.charExactMatch) {
      result.diffSummary = `Expected ${source.text_original.length} chars, got ${cleanExcerpt?.length ?? 0} chars`;
    }
  } catch (err) {
    result.error = (err as Error).message;
  }
  return result;
}

async function checkAlbani(source: any): Promise<SpotCheckResult> {
  const result: SpotCheckResult = {
    id: source.id,
    scholarId: source.scholar_id,
    title: source.title,
    url: source.url,
    reference: source.reference,
    rightsIdMatch: source.rights_id === EXPECTED_RIGHTS["al-albani"],
    searchDocApproved: false,
    liveFetchOk: false,
    charExactMatch: false,
  };

  try {
    const res = await fetch(source.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }
    result.liveFetchOk = true;
    const html = await res.text();
    const fatwa = parseAlbaniFatwa(html, { title: source.title, printedSource: source.reference });
    if (!fatwa) {
      result.error = "Parser returned null on live HTML";
      return result;
    }
    const cleanExcerpt = excerpt(fatwa.answer);
    result.charExactMatch = cleanExcerpt === source.text_original;
    if (!result.charExactMatch) {
      result.diffSummary = `Expected ${source.text_original.length} chars, got ${cleanExcerpt?.length ?? 0} chars`;
    }
  } catch (err) {
    result.error = (err as Error).message;
  }
  return result;
}

async function checkBarrak(source: any): Promise<SpotCheckResult> {
  const result: SpotCheckResult = {
    id: source.id,
    scholarId: source.scholar_id,
    title: source.title,
    url: source.url,
    reference: source.reference,
    rightsIdMatch: source.rights_id === EXPECTED_RIGHTS["al-barrak"],
    searchDocApproved: false,
    liveFetchOk: false,
    charExactMatch: false,
  };

  try {
    const res = await fetch(source.url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }
    result.liveFetchOk = true;
    const html = await res.text();
    const fatwa = parseBarrakFatwa(html);
    if (!fatwa) {
      result.error = "Parser returned null on live HTML";
      return result;
    }
    const cleanExcerpt = excerpt(fatwa.answer);
    result.charExactMatch = cleanExcerpt === source.text_original;
    if (!result.charExactMatch) {
      result.diffSummary = `Expected ${source.text_original.length} chars, got ${cleanExcerpt?.length ?? 0} chars`;
    }
  } catch (err) {
    result.error = (err as Error).message;
  }
  return result;
}

async function main() {
  const scholars = ["ibn-baz", "ibn-uthaymeen", "al-albani", "al-barrak"];
  const allSpotChecks: SpotCheckResult[] = [];

  for (const s of scholars) {
    console.log(`\nSpot-checking 5 pages for ${s}...`);
    // Sample 5 published records (or all 6 for al-barrak, including newly added ones if applicable)
    let query = db.from("sources").select("*").eq("scholar_id", s).eq("published", true);
    if (s === "ibn-baz") {
      // Pick the 3 newly added ones + 2 established ones
      const { data: news } = await db.from("sources").select("*").eq("scholar_id", s).eq("published", true).order("id", { ascending: false }).limit(3);
      const { data: established } = await db.from("sources").select("*").eq("scholar_id", s).eq("published", true).limit(2);
      var sampleRows = [...(news ?? []), ...(established ?? [])];
    } else if (s === "al-barrak") {
      const { data } = await db.from("sources").select("*").eq("scholar_id", s).eq("published", true).limit(5);
      var sampleRows = data ?? [];
    } else {
      const { data } = await db.from("sources").select("*").eq("scholar_id", s).eq("published", true).limit(5);
      var sampleRows = data ?? [];
    }

    for (const row of sampleRows) {
      // Check search doc
      const { data: sDoc } = await db.from("source_search_documents").select("approved").eq("source_id", row.id).maybeSingle();
      const searchDocApproved = sDoc?.approved === true;

      let res: SpotCheckResult;
      if (s === "ibn-baz") res = await checkIbnBaz(row);
      else if (s === "ibn-uthaymeen") res = await checkIbnUthaymeen(row);
      else if (s === "al-albani") res = await checkAlbani(row);
      else res = await checkBarrak(row);

      res.searchDocApproved = searchDocApproved;
      allSpotChecks.push(res);

      console.log(
        `[${res.charExactMatch && res.rightsIdMatch && res.searchDocApproved ? "PASS" : "FAIL"}] ${res.scholarId}: ${res.title.slice(0, 40)}... ` +
        `(liveFetch=${res.liveFetchOk}, exactMatch=${res.charExactMatch}, rightsMatch=${res.rightsIdMatch}, docApproved=${res.searchDocApproved}${res.error ? `, err=${res.error}` : ""})`
      );

      await sleep(1500);
    }
  }

  const fs = await import("fs");
  fs.writeFileSync("docs/spot-check-results.json", JSON.stringify(allSpotChecks, null, 2), "utf-8");
  console.log(`\nCompleted spot check on ${allSpotChecks.length} pages. Results saved to docs/spot-check-results.json`);
}

main().catch(console.error);
