import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { getHadith, searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { getMappedScholarQuote, searchScholarsLive } from "@/lib/sources/scholars-live";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { searchVideos } from "@/lib/sources/videos";
import { runPipeline, type AskResult, type PipelineDeps } from "./core";

const HADITH_ON = process.env.HADITH_SOURCE === "hadeethenc";
// Scholar quotes need the server's secret key (the library is private); SCHOLAR_QUOTES=off disables them.
const SCHOLARS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.SCHOLAR_QUOTES !== "off";
// Live search of Ibn Baz's and Ibn Uthaymeen's websites (Mo, 2026-09-29); SCHOLARS_LIVE=off disables it.
const LIVE_ON = process.env.SCHOLARS_LIVE !== "off";
const LIVE_TIMEOUT_MS = 7_000;

// Checked mapped pages first; otherwise stored library and live quotes, without repeating a page.
// A slow website only loses its own quotes, never the library's.
async function scholarQuotes(phrases: string[], mappedUrls: string[] = []): Promise<ScholarQuote[]> {
  // A checked direct page must not be lost when a broad library or live search times out.
  if (mappedUrls.length > 0) {
    const mapped = await Promise.all(mappedUrls.slice(0, 2).map((url) => getMappedScholarQuote(url).catch(() => null)));
    const direct = mapped.filter((quote): quote is ScholarQuote => !!quote);
    if (direct.length > 0) return direct;
  }
  const live = LIVE_ON
    ? Promise.race([
        searchScholarsLive(phrases).catch(() => [] as ScholarQuote[]),
        new Promise<ScholarQuote[]>((resolve) => setTimeout(() => resolve([]), LIVE_TIMEOUT_MS)),
      ])
    : Promise.resolve([] as ScholarQuote[]);
  const [stored, fresh] = await Promise.all([
    phrases.length ? searchScholarQuotes(phrases, 6).catch(() => [] as ScholarQuote[]) : Promise.resolve([] as ScholarQuote[]),
    live,
  ]);
  const seen = new Set<string>();
  return [...stored, ...fresh]
    .filter((quote) => {
      if (seen.has(quote.url)) return false;
      seen.add(quote.url);
      return true;
    }).slice(0, 8);
}

// Related videos from the approved channels (same secret key); VIDEOS=off disables them.
const VIDEOS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.VIDEOS !== "off";
if (HADITH_ON) warmHadithCatalogues();

export type { Answer, AskResult, Evidence } from "./core";

// Plugs the real AI models and the Quran source into the pipeline logic in core.ts.
export function ask(question: string, uiLanguage: Locale, trace?: Pick<PipelineDeps, "onFrame" | "onRetrieved" | "onCandidates" | "onSelection">): Promise<AskResult> {
  return runPipeline(question, uiLanguage, {
    ...trace,
    writer: getProvider(),
    verifier: getVerifier(),
    search: searchQuran,
    getVerse,
    neighbours,
    // Hadith from Sahih al-Bukhari / Sahih Muslim via HadeethEnc (permission requested 2026-09-28).
    // Off unless HADITH_SOURCE=hadeethenc, so it can be switched off instantly.
    ...(HADITH_ON ? { searchHadith: (q) => searchHadithMulti(q, 8), getHadith } : {}),
    // Short quotes of approved scholars from our private library (rights: short quotes, permission pending).
    ...(SCHOLARS_ON ? { searchScholars: (phrases: string[], mappedUrls?: string[]) => scholarQuotes(phrases, mappedUrls) } : {}),
    // Related clips from the approved YouTube channels, shown under the answer (never evidence).
    ...(VIDEOS_ON ? { searchVideos: (phrases) => searchVideos(phrases) } : {}),
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
    onStep: process.env.ASK_DEBUG === "true" ? (name, ms) => console.info(`ask step: ${name} at ${ms} ms`) : undefined,
  });
}
