import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";

const HADITH_ON = process.env.HADITH_SOURCE === "hadeethenc";
if (HADITH_ON) warmHadithCatalogues();
import { runPipeline, type AskResult } from "./core";

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
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
    onStep: process.env.ASK_DEBUG === "true" ? (name, ms) => console.info(`ask step: ${name} at ${ms} ms`) : undefined,
  });
}
