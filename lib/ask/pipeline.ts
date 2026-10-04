import "server-only";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { getHadith, searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";
import { getLibraryHadith, searchLibraryHadith } from "@/lib/sources/hadith-library";
import { hadithMode } from "@/lib/sources/hadith-mode";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { getMappedScholarQuote, searchScholarsLive } from "@/lib/sources/scholars-live";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { searchVideos } from "@/lib/sources/videos";
import { runPipeline, type AskResult, type PipelineDeps } from "./core";
import { askClaimAudit, askDeadlineMs, askMaxVideos, askTiered, askVideoBudgetMs, LEAN_CANDIDATE_LIMITS } from "./settings";
import { approvedForQuestion } from "./approved";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions, getTopics } from "@/lib/content";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";
import { TOPIC_ANSWERS } from "@/data/topic-answers";

// HADITH_SOURCE=library: stored Sahih al-Bukhari / Sahih Muslim hadith. =hadeethenc: the old live path.
// Anything else: hadith off. Never both.
const HADITH_MODE = hadithMode();
const HADITH_ON = HADITH_MODE === "hadeethenc";
// Scholar quotes need the server's secret key (the library is private); SCHOLAR_QUOTES=off disables them.
const SCHOLARS_ON = !!process.env.SUPABASE_SECRET_KEY && process.env.SCHOLAR_QUOTES !== "off";
// Live search of Ibn Baz's and Ibn Uthaymeen's websites (Mo, 2026-09-29); SCHOLARS_LIVE=off disables it.
const LIVE_ON = process.env.SCHOLARS_LIVE !== "off";
const LIVE_TIMEOUT_MS = 7_000;

// Checked mapped pages first; otherwise stored library and live quotes, without repeating a page.
// A slow website only loses its own quotes, never the library's.
export async function scholarQuotes(phrases: string[], mappedUrls: string[] = []): Promise<ScholarQuote[]> {
  // Checked pages rank first, but a broad mapped page must not suppress a more specific library or
  // live result needed for another requested point.
  const mapped = Promise.all(mappedUrls.slice(0, 2).map((url) => getMappedScholarQuote(url).catch(() => null)));
  const live = LIVE_ON
    ? Promise.race([
        searchScholarsLive(phrases).catch(() => [] as ScholarQuote[]),
        new Promise<ScholarQuote[]>((resolve) => setTimeout(() => resolve([]), LIVE_TIMEOUT_MS)),
      ])
    : Promise.resolve([] as ScholarQuote[]);
  const [direct, stored, fresh] = await Promise.all([
    mapped.then((items) => items.filter((quote): quote is ScholarQuote => !!quote)),
    phrases.length ? searchScholarQuotes(phrases, 6).catch(() => [] as ScholarQuote[]) : Promise.resolve([] as ScholarQuote[]),
    live,
  ]);
  const seen = new Set<string>();
  return [...direct, ...stored, ...fresh]
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
// A prepared answer approved by Mo is shown when the visitor asks the same question: first a clear word
// match with a stored wording, then the checker model must confirm it is the same question. Any doubt,
// error or personal question falls through to the normal live pipeline.
export async function askPreparedOnly(question: string): Promise<AskResult | null> {
  if (process.env.PREPARED_PUBLISHING_ENABLED !== "true" || process.env.PREPARED_ANSWERS === "off") return null;
  const answer = await approvedForQuestion(question, {
    common: PREPARED_ANSWERS, topics: TOPIC_ANSWERS,
    topicsEnabled: process.env.ASK_APPROVED_TOPICS !== "false",
    blockedCommon: PREPARED_IDS_AWAITING_VIEW_DECISION,
    getReviews: getReviewDecisions,
    getTopicQuestions: async () => (await Promise.all((["ar", "en", "de"] as const).map(async (language) =>
      (await getTopics(language)).map((topic) => ({ id: topic.id, language, question: topic.question }))))).flat(),
    verifier: getVerifier, load: loadPrepared,
  });
  return answer ? { status: "answer", answer } : null;
}

export async function ask(question: string, uiLanguage: Locale, trace?: Pick<PipelineDeps, "onFrame" | "onRetrieved" | "onCandidates" | "onSelection">): Promise<AskResult> {
  // Evaluation traces measure the live pipeline, so they skip prepared answers.
  const prepared = trace ? null : await askPreparedOnly(question);
  if (prepared) return prepared;
  return runPipeline(question, uiLanguage, {
    ...trace,
    writer: getProvider(),
    verifier: getVerifier(),
    deadlineMs: askDeadlineMs(),
    claimAudit: askClaimAudit(),
    ...(process.env.ASK_LEAN === "true" ? { candidateLimits: { ...LEAN_CANDIDATE_LIMITS } } : {}),
    // ASK_TIERED=true: Quran, then hadith, then fatwas, then videos (read per question so it can be switched).
    ...(askTiered() ? { tiered: { videoBudgetMs: askVideoBudgetMs(), maxVideos: askMaxVideos() } } : {}),
    search: searchQuran,
    getVerse,
    neighbours,
    // Hadith from Sahih al-Bukhari / Sahih Muslim via HadeethEnc (permission requested 2026-09-28).
    // Off unless HADITH_SOURCE=hadeethenc, so it can be switched off instantly.
    ...(HADITH_ON ? { searchHadith: (q) => searchHadithMulti(q, 8), getHadith } : {}),
    // Stored hadith from our own library (Sunnah.com text). Needs the server's secret key.
    ...(HADITH_MODE === "library" ? { searchHadith: searchLibraryHadith, getHadith: getLibraryHadith } : {}),
    // Short quotes of approved scholars from our private library (rights: short quotes, permission pending).
    ...(SCHOLARS_ON ? { searchScholars: (phrases: string[], mappedUrls?: string[]) => scholarQuotes(phrases, mappedUrls) } : {}),
    // Related clips from the approved YouTube channels, shown under the answer (never evidence).
    ...(VIDEOS_ON ? { searchVideos: (phrases) => searchVideos(phrases) } : {}),
    // Reason codes only, never the question. Local testing only.
    onRefuse: process.env.ASK_DEBUG === "true" ? (reason) => console.info(`ask refused: ${reason}`) : undefined,
    onStep: process.env.ASK_DEBUG === "true" ? (name, ms) => console.info(`ask step: ${name} at ${ms} ms`) : undefined,
  });
}
