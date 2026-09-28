import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
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
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
  });
}
