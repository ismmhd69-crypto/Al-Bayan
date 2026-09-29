import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { searchScholarsLive } from "@/lib/sources/scholars-live";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { searchVideos } from "@/lib/sources/videos";
import { runPipeline, type AskResult } from "./core";

const HADITH_ON = process.env.HADITH_SOURCE === "hadeethenc";
// Scholar quotes need the server's secret key (the library is private); SCHOLAR_QUOTES=off disables them.
const SCHOLARS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.SCHOLAR_QUOTES !== "off";
// Live search of Ibn Baz's and Ibn Uthaymeen's websites (Mo, 2026-09-29); SCHOLARS_LIVE=off disables it.
const LIVE_ON = process.env.SCHOLARS_LIVE !== "off";
const LIVE_TIMEOUT_MS = 7_000;

// Stored library first, then live quotes from the scholars' websites, without repeating a page.
// A slow website only loses its own quotes, never the library's.
async function scholarQuotes(phrases: string[]): Promise<ScholarQuote[]> {
  const live = LIVE_ON
    ? Promise.race([
        searchScholarsLive(phrases).catch(() => [] as ScholarQuote[]),
        new Promise<ScholarQuote[]>((resolve) => setTimeout(() => resolve([]), LIVE_TIMEOUT_MS)),
      ])
    : Promise.resolve([] as ScholarQuote[]);
  const [stored, fresh] = await Promise.all([searchScholarQuotes(phrases).catch(() => [] as ScholarQuote[]), live]);
  const seen = new Set(stored.map((q) => q.url));
  return [...stored.slice(0, 2), ...fresh.filter((q) => !seen.has(q.url))].slice(0, 4);
}

// Related videos from the approved channels (same secret key); VIDEOS=off disables them.
const VIDEOS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.VIDEOS !== "off";
if (HADITH_ON) warmHadithCatalogues();

export type { Answer, AskResult, Evidence } from "./core";

// Plugs the real AI models and the Quran source into the pipeline logic in core.ts.
export function ask(question: string, uiLanguage: Locale): Promise<AskResult> {
  return runPipeline(question, uiLanguage, {
    writer: getProvider(),
    verifier: getVerifier(),
    search: searchQuran,
    getVerse,
    neighbours,
    // Hadith from Sahih al-Bukhari / Sahih Muslim via HadeethEnc (permission requested 2026-09-28).
    // Off unless HADITH_SOURCE=hadeethenc, so it can be switched off instantly.
    ...(HADITH_ON ? { searchHadith: (q) => searchHadithMulti(q) } : {}),
    // Short quotes of approved scholars from our private library (rights: short quotes, permission pending).
    ...(SCHOLARS_ON ? { searchScholars: (phrases) => scholarQuotes(phrases) } : {}),
    // Related clips from the approved YouTube channels, shown under the answer (never evidence).
    ...(VIDEOS_ON ? { searchVideos: (phrases) => searchVideos(phrases) } : {}),
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
    onStep: process.env.ASK_DEBUG === "true" ? (name, ms) => console.info(`ask step: ${name} at ${ms} ms`) : undefined,
  });
}
