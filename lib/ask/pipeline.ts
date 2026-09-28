import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { searchVideos } from "@/lib/sources/videos";
import { runPipeline, type AskResult } from "./core";

const HADITH_ON = process.env.HADITH_SOURCE === "hadeethenc";
// Scholar quotes need the server's secret key (the library is private); SCHOLAR_QUOTES=off disables them.
const SCHOLARS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.SCHOLAR_QUOTES !== "off";
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
    ...(SCHOLARS_ON ? { searchScholars: (phrases) => searchScholarQuotes(phrases) } : {}),
    // Related clips from the approved YouTube channels, shown under the answer (never evidence).
    ...(VIDEOS_ON ? { searchVideos: (phrases) => searchVideos(phrases) } : {}),
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
    onStep: process.env.ASK_DEBUG === "true" ? (name, ms) => console.info(`ask step: ${name} at ${ms} ms`) : undefined,
  });
}
