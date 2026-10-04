import { createClient } from "@supabase/supabase-js";
import { getVerifier } from "../lib/ai";
import {
  checkQuoteRelevance,
  excerpt,
  htmlToText,
  isNearDuplicate,
  isUthaymeenTafsirLesson,
  looksLikeQuestion,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  printedCollection,
  quoteStemSet,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";
import { isScholarTitleRelevant } from "../lib/sources/scholar-rules";
import { TARGETED_GAPS, type TargetedGap } from "../data/targeted-scholar-library-gaps";
import * as fs from "fs";

process.loadEnvFile(".env");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 1500;
// The original gap audit only inspected page one. Keep the default bounded, but allow a deeper
// read-only pass so a missing answer is not confused with a first-page search miss.
const SEARCH_PAGES = Math.max(1, Math.min(5, Number(process.argv.find((a) => a.startsWith("--pages="))?.split("=")[1] ?? 3)));
const TARGET_FILTER = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1]?.trim();
const SELECTED_TARGETS = TARGET_FILTER
  ? TARGETED_GAPS.filter((target) => target.id === TARGET_FILTER)
  : TARGETED_GAPS;
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };

const CP_URL = "https://shekhcp.binothaimeen.net";
const API_URL = "https://shekhapi.binothaimeen.net";

export type GapCandidate = {
  targetId: string;
  scholar: "ibn-baz" | "ibn-uthaymeen";
  title: string;
  reference: string;
  url: string;
  charCount: number;
  snippet: string;
  fullQuote: string;
  reason: string;
};

export type TargetResult = {
  target: TargetedGap;
  status: "found" | "gap";
  candidates: GapCandidate[];
  rejections: Array<{ title: string; url: string; reason: string }>;
};

// --- Ibn Baz Search ---
async function searchBinBaz(q: string) {
  const all: Array<{ id: number; reference: number; title: string }> = [];
  const seen = new Set<number>();
  for (let page = 1; page <= SEARCH_PAGES; page++) {
    let res = await fetch(`https://binbaz.org.sa/api/search?type=fatwa&operator=AND_ONLY&page=${page}&q=${encodeURIComponent(q)}`, {
      headers: { ...HEADERS, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    let results: Array<{ id: number; reference: number; title: string }> = [];
    if (res.ok) {
      const data = (await res.json()) as { Search?: { results?: Array<{ id: number; reference: number; title: string }> } };
      results = data.Search?.results ?? [];
    }
    // Some pages expose no strict AND_ONLY result but do return a useful broader page. Keep the
    // fallback on the same page number and let the title/relevance gates reject false matches.
    if (results.length === 0) {
      await sleep(500);
      res = await fetch(`https://binbaz.org.sa/api/search?type=fatwa&page=${page}&q=${encodeURIComponent(q)}`, {
        headers: { ...HEADERS, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { Search?: { results?: Array<{ id: number; reference: number; title: string }> } };
        results = data.Search?.results ?? [];
      }
    }
    for (const hit of results) {
      if (Number.isInteger(hit.reference) && typeof hit.title === "string" && !seen.has(hit.reference)) {
        seen.add(hit.reference);
        all.push(hit);
      }
    }
    if (results.length === 0) break;
    await sleep(500);
  }
  return all;
}

// --- Ibn Uthaymeen Search ---
type UthaymeenSearchHit = { id: string; title: { ar?: string } };
type UthaymeenAudioDetail = {
  id: string;
  title: { ar?: string };
  objective?: { content?: { ar?: string } };
  many_sections?: Array<{
    id: string;
    title: { ar?: string };
    all_parent?: { id: string; title: { ar?: string }; all_parent?: { id: string; title: { ar?: string } } | null } | null;
  }>;
};

async function searchUthaymeen(q: string): Promise<UthaymeenSearchHit[]> {
  const all: UthaymeenSearchHit[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= SEARCH_PAGES; page++) {
    let res = await fetch(`${CP_URL}/api/search-data`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page, mode: "exact" }),
      signal: AbortSignal.timeout(20_000),
    });
    let hits: UthaymeenSearchHit[] = [];
    if (res.ok) hits = ((await res.json()) as { data?: UthaymeenSearchHit[] }).data ?? [];
    if (hits.length === 0) {
      await sleep(500);
      res = await fetch(`${CP_URL}/api/search-data`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ pageSize: 10, searchTerm: q, type: "audios", page, mode: "similar" }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) hits = ((await res.json()) as { data?: UthaymeenSearchHit[] }).data ?? [];
    }
    for (const hit of hits) {
      if (typeof hit.id === "string" && typeof hit.title?.ar === "string" && !seen.has(hit.id)) {
        seen.add(hit.id);
        all.push(hit);
      }
    }
    if (hits.length === 0) break;
    await sleep(500);
  }
  return all;
}

async function fetchUthaymeenAudioDetail(id: string): Promise<UthaymeenAudioDetail | null> {
  const url = `${API_URL}/lessons/audios/show/${id}/0/1?getManySectionsWithAllParent=audio_library&getAllPaths=1`;
  const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: UthaymeenAudioDetail };
  return json.data ?? null;
}

// Check if quote specifically answers the target requirement
async function verifyTargetRelevance(
  verifier: any,
  exactPoint: string,
  title: string,
  quote: string
): Promise<{ matches: boolean; reason: string }> {
  try {
    const prompt = `Required Point to Establish:\n"${exactPoint}"\n\nFatwa Title:\n"${title}"\n\nQuote:\n"${quote}"\n\nRules:\n1. The quote must directly state and establish the required point, not merely touch on the general topic.\n2. If the required point is about obligation, the quote must explicitly state obligation (not only voluntary or makeup acts).\n3. If the required point is a categorical prohibition, the quote must clearly state the prohibition (not only an exception or ignorance case).\n4. If the required point is a specific number (e.g. 2 divorces, 4 months and 10 days, 3 quru', 5 pillars, 2.5%), the quote must confirm that specific detail.\n5. If it only answers a personal dispute or subsidiary detail, reject it.`;

    const res = (await verifier.generateJson({
      system:
        "You are a strict Islamic content verifier checking whether an authentic scholar quote directly establishes a specific required point. Respond strictly in JSON.",
      prompt,
      schema: {
        type: "object",
        properties: {
          matches: { type: "boolean", description: "Whether the quote directly establishes the specific point required" },
          reason: { type: "string", description: "Short explanation in English" },
        },
        required: ["matches", "reason"],
      },
    })) as { matches: boolean; reason: string };

    return {
      matches: Boolean(res.matches),
      reason: String(res.reason ?? ""),
    };
  } catch (e: any) {
    return { matches: false, reason: `Verifier error: ${e.message}` };
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env");

  // Read-only database connection
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const verifier = getVerifier();

  // Load existing published sources for deduplication
  const { data: existingRows } = await db
    .from("sources")
    .select("url, text_original, scholar_id")
    .eq("published", true);

  const existingUrls = new Set((existingRows ?? []).map((r) => r.url));
  const existingStemsByScholar: Record<string, Set<string>[]> = {
    "ibn-baz": [],
    "ibn-uthaymeen": [],
  };
  for (const r of existingRows ?? []) {
    if (existingStemsByScholar[r.scholar_id]) {
      existingStemsByScholar[r.scholar_id].push(quoteStemSet(r.text_original));
    }
  }

  console.log(`Loaded ${existingRows?.length ?? 0} existing published quotes for deduplication.`);
  console.log(`Starting targeted gap dry run for ${SELECTED_TARGETS.length} evidence targets across up to ${SEARCH_PAGES} official search pages...\n`);

  const targetResults: TargetResult[] = [];

  for (let i = 0; i < SELECTED_TARGETS.length; i++) {
    const target = SELECTED_TARGETS[i];
    console.log(`[Target ${i + 1}/${SELECTED_TARGETS.length}] (${target.scholar}) ${target.id}: "${target.englishDescription}"`);

    const result: TargetResult = {
      target,
      status: "gap",
      candidates: [],
      rejections: [],
    };

    const seenUrlsInTarget = new Set<string>();

    for (const phrase of target.searchPhrases) {
      if (result.candidates.length >= 2) break; // at most 2 clean candidates per target

      if (target.scholar === "ibn-baz") {
        let hits: any[] = [];
        try {
          hits = await searchBinBaz(phrase);
        } catch (e: any) {
          console.log(`   Search error on '${phrase}': ${e.message}`);
          continue;
        }
        await sleep(PAUSE_MS);

        for (const hit of hits.slice(0, 4)) {
          const pageLink = `https://binbaz.org.sa/fatwas/${hit.reference}/${encodeURIComponent(
            hit.title.trim().replace(/\s+/g, "-")
          )}`;

          if (existingUrls.has(pageLink)) {
            result.rejections.push({ title: hit.title, url: pageLink, reason: "Already published in library" });
            continue;
          }
          if (seenUrlsInTarget.has(pageLink)) continue;
          seenUrlsInTarget.add(pageLink);

          let html = "";
          try {
            const pageRes = await fetch(pageLink, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
            await sleep(PAUSE_MS);
            if (!pageRes.ok) {
              result.rejections.push({ title: hit.title, url: pageLink, reason: `HTTP ${pageRes.status}` });
              continue;
            }
            html = await pageRes.text();
          } catch (e: any) {
            result.rejections.push({ title: hit.title, url: pageLink, reason: `Fetch error: ${e.message}` });
            continue;
          }

          const fatwa = parseBinBazFatwa(html);
          if (!fatwa) {
            result.rejections.push({ title: hit.title, url: pageLink, reason: "Failed to parse fatwa content" });
            continue;
          }

          const quote = excerpt(fatwa.answer);
          if (!quote) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "No clean excerpt under 600 chars" });
            continue;
          }
          if (quote.length < 200) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: `Quote too short (${quote.length} chars < 200)` });
            continue;
          }
          if (looksLikeQuestion(quote)) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "Quote contains question text" });
            continue;
          }
          if (startsLikeRoomTalk(quote)) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "Quote starts with conversational room talk" });
            continue;
          }
          if (!sharesContentWord(fatwa.title, quote)) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "No shared content word between title and quote" });
            continue;
          }

          // Strict title relevance gate against target point and search phrases
          if (!isScholarTitleRelevant([target.exactPoint, ...target.searchPhrases], fatwa.title)) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "Title failed strict title relevance gate" });
            continue;
          }

          // Duplicate stem check
          const stems = quoteStemSet(quote);
          if (isNearDuplicate(stems, existingStemsByScholar["ibn-baz"])) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: "Near duplicate of existing published quote" });
            continue;
          }

          // General verifier check
          const generalRel = await checkQuoteRelevance(verifier, fatwa.title, quote);
          if (!generalRel.answers) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: `General AI check failed: ${generalRel.reason}` });
            continue;
          }

          // Targeted exact point verification
          const targetRel = await verifyTargetRelevance(verifier, target.exactPoint, fatwa.title, quote);
          if (!targetRel.matches) {
            result.rejections.push({ title: fatwa.title, url: pageLink, reason: `Target point not established: ${targetRel.reason}` });
            continue;
          }

          // Passed all checks!
          const printedRef = printedCollection(fatwa.printedSource)?.reference ?? `binbaz.org.sa, fatwa ${hit.reference}`;
          result.candidates.push({
            targetId: target.id,
            scholar: "ibn-baz",
            title: fatwa.title,
            reference: printedRef,
            url: pageLink,
            charCount: quote.length,
            snippet: quote.slice(0, 150) + "...",
            fullQuote: quote,
            reason: targetRel.reason,
          });
          console.log(`   + Found clean candidate: "${fatwa.title}" (${quote.length} chars)`);
        }
      } else if (target.scholar === "ibn-uthaymeen") {
        let hits: UthaymeenSearchHit[] = [];
        try {
          hits = await searchUthaymeen(phrase);
        } catch (e: any) {
          console.log(`   Search error on '${phrase}': ${e.message}`);
          continue;
        }
        await sleep(PAUSE_MS);

        for (const hit of hits.slice(0, 4)) {
          const detail = await fetchUthaymeenAudioDetail(hit.id);
          await sleep(PAUSE_MS);
          if (!detail) {
            result.rejections.push({ title: hit.title.ar ?? hit.id, url: `audio_${hit.id}`, reason: "Failed to fetch audio detail" });
            continue;
          }
          const section = detail.many_sections?.[0];
          const allParent = section?.all_parent;
          const seriesTitle = allParent?.title?.ar?.trim() || "";
          const topParentTitle = allParent?.all_parent?.title?.ar?.trim() || "";

          // Rule 4: Only allow Noor ala al-Darb and Fatawa collections
          const isFatwaCollection =
            seriesTitle.includes("نور على الدرب") ||
            topParentTitle.includes("نور على الدرب") ||
            seriesTitle.includes("فتاوى") ||
            topParentTitle.includes("فتاوى") ||
            seriesTitle.includes("لقاء الباب المفتوح") ||
            seriesTitle.includes("اللقاء الشهري");

          if (!isFatwaCollection) {
            result.rejections.push({
              title: detail.title?.ar ?? hit.id,
              url: `audio_${hit.id}`,
              reason: "Not from Noor ala al-Darb or recognized fatwa collection",
            });
            continue;
          }

          const rawHtml = detail.objective?.content?.ar;
          if (!rawHtml) {
            result.rejections.push({
              title: detail.title?.ar ?? hit.id,
              url: `audio_${hit.id}`,
              reason: "No text content in audio detail",
            });
            continue;
          }

          const rawTitle = detail.title?.ar ?? hit.title?.ar ?? "";
          const cleanTitle = htmlToText(rawTitle).replace(/^-\s*/, "").trim();
          const sectionTitle = section?.title?.ar?.trim() || "فتاوى";
          const collectionName = seriesTitle || topParentTitle || "فتاوى الشيخ ابن عثيمين";
          const reference = `${collectionName} (${sectionTitle})`;
          const encSec = encodeURIComponent(sectionTitle.trim().replace(/\s+/g, "-"));
          const encTitle = encodeURIComponent(cleanTitle.trim().replace(/\s+/g, "-"));
          const link = `https://binothaimeen.net/ar/voice_library/lessonDetails/${encSec}/${encTitle}/${detail.id}`;

          if (existingUrls.has(link)) {
            result.rejections.push({ title: cleanTitle, url: link, reason: "Already published in library" });
            continue;
          }
          if (seenUrlsInTarget.has(link)) continue;
          seenUrlsInTarget.add(link);

          if (isUthaymeenTafsirLesson(cleanTitle)) {
            result.rejections.push({ title: cleanTitle, url: link, reason: "Tafsir lesson or lecture, not standalone fatwa" });
            continue;
          }

          const fatwa = parseUthaymeenFatwa(rawHtml, { title: cleanTitle, printedSource: reference });
          if (!fatwa) {
            result.rejections.push({ title: cleanTitle, url: link, reason: "Failed to parse audio fatwa" });
            continue;
          }

          const quote = excerpt(fatwa.answer);
          if (!quote) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "No clean excerpt under 600 chars" });
            continue;
          }
          if (quote.length < 200) {
            result.rejections.push({ title: fatwa.title, url: link, reason: `Quote too short (${quote.length} chars < 200)` });
            continue;
          }
          if (looksLikeQuestion(quote)) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "Quote contains question text" });
            continue;
          }
          if (startsLikeRoomTalk(quote)) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "Quote starts with conversational room talk" });
            continue;
          }
          if (!sharesContentWord(fatwa.title, quote)) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "No shared content word between title and quote" });
            continue;
          }

          // Strict title relevance gate against target point and search phrases
          if (!isScholarTitleRelevant([target.exactPoint, ...target.searchPhrases], fatwa.title)) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "Title failed strict title relevance gate" });
            continue;
          }

          // Duplicate stem check
          const stems = quoteStemSet(quote);
          if (isNearDuplicate(stems, existingStemsByScholar["ibn-uthaymeen"])) {
            result.rejections.push({ title: fatwa.title, url: link, reason: "Near duplicate of existing published quote" });
            continue;
          }

          // General verifier check
          const generalRel = await checkQuoteRelevance(verifier, fatwa.title, quote);
          if (!generalRel.answers) {
            result.rejections.push({ title: fatwa.title, url: link, reason: `General AI check failed: ${generalRel.reason}` });
            continue;
          }

          // Targeted exact point verification
          const targetRel = await verifyTargetRelevance(verifier, target.exactPoint, fatwa.title, quote);
          if (!targetRel.matches) {
            result.rejections.push({ title: fatwa.title, url: link, reason: `Target point not established: ${targetRel.reason}` });
            continue;
          }

          // Passed all checks!
          result.candidates.push({
            targetId: target.id,
            scholar: "ibn-uthaymeen",
            title: fatwa.title,
            reference: reference,
            url: link,
            charCount: quote.length,
            snippet: quote.slice(0, 150) + "...",
            fullQuote: quote,
            reason: targetRel.reason,
          });
          console.log(`   + Found clean candidate: "${fatwa.title}" (${quote.length} chars)`);
        }
      }
    }

    if (result.candidates.length > 0) {
      result.status = "found";
    }
    targetResults.push(result);
  }

  // Generate markdown report
  let md = "# Targeted Scholar Library Gap Dry-Run Report\n\n";
  md += `Date: 2026-09-29  \n`;
  md += `Scope: Read-only dry run across ${SELECTED_TARGETS.length} selected targeted evidence gaps, up to ${SEARCH_PAGES} official search pages per phrase.  \n`;
  md += `Database Operations: Read-only check. Zero rows written to database.  \n\n`;

  const foundCount = targetResults.filter((r) => r.status === "found").length;
  const gapCount = targetResults.filter((r) => r.status === "gap").length;
  const totalCandidates = targetResults.reduce((acc, r) => acc + r.candidates.length, 0);

  md += `## Summary\n\n`;
  md += `- Targets evaluated: ${SELECTED_TARGETS.length}\n`;
  md += `- Targets with clean candidate found: ${foundCount}\n`;
  md += `- Targets remaining as safe gaps: ${gapCount}\n`;
  md += `- Total clean candidates identified: ${totalCandidates}\n\n`;

  md += `## Detailed Target Results\n\n`;

  for (let i = 0; i < targetResults.length; i++) {
    const { target, status, candidates, rejections } = targetResults[i];
    md += `### ${i + 1}. [${status.toUpperCase()}] ${target.englishDescription} (\`${target.id}\`)\n\n`;
    md += `- **Scholar:** ${target.scholar}\n`;
    md += `- **Exact Point Required:** ${target.exactPoint}\n`;

    if (candidates.length > 0) {
      md += `- **Clean Candidates Found (${candidates.length}):**\n`;
      for (const c of candidates) {
        md += `  - **Title:** ${c.title}\n`;
        md += `    - **Reference:** ${c.reference}\n`;
        md += `    - **URL:** ${c.url}\n`;
        md += `    - **Length:** ${c.charCount} chars\n`;
        md += `    - **First 150 chars:** "${c.snippet}"\n`;
        md += `    - **Why it answers target:** ${c.reason}\n`;
      }
    } else {
      md += `- **Status:** Safe Gap. No candidate met all safety criteria.\n`;
    }

    if (rejections.length > 0) {
      md += `- **Rejected Candidates Explanations:**\n`;
      for (const rej of rejections.slice(0, 5)) {
        md += `  - "${rej.title}": ${rej.reason}\n`;
      }
      if (rejections.length > 5) {
        md += `  - *...and ${rejections.length - 5} more rejected attempts.*\n`;
      }
    }
    md += `\n---\n\n`;
  }

  fs.writeFileSync("docs/targeted-library-gap-dry-run.md", md, "utf8");
  console.log("\nSaved dry run report to docs/targeted-library-gap-dry-run.md");
}

main().catch((e) => {
  console.error("Dry run fatal error:", e);
  process.exit(1);
});
