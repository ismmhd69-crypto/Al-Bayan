import "server-only";
import { randomUUID } from "node:crypto";
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
import { askClaimAudit, askDeadlineMs, askLibraryFlow, askMaxVideos, askTiered, askVideoBudgetMs, LEAN_CANDIDATE_LIMITS } from "./settings";
import type { SearchOptions } from "@/lib/sources/search-audit";
import { approvedForQuestion } from "./approved";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions, getTopics } from "@/lib/content";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { diagnosticLogger } from "./diagnostics";
import { currentAskRequestId, currentAskStarted, observedProvider, errorCategory } from "./trace-context";

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
export async function scholarQuotes(phrases: string[], mappedUrls: string[] = [], options: SearchOptions = {}): Promise<ScholarQuote[]> {
  // Checked pages rank first, but a broad mapped page must not suppress a more specific library or
  // live result needed for another requested point.
  const mapped = Promise.all(mappedUrls.slice(0, 2).map((url) => getMappedScholarQuote(url).catch(() => null)));
  const live = LIVE_ON && !options.allVariants
    ? Promise.race([
        searchScholarsLive(phrases).catch(() => [] as ScholarQuote[]),
        new Promise<ScholarQuote[]>((resolve) => setTimeout(() => resolve([]), LIVE_TIMEOUT_MS)),
      ])
    : Promise.resolve([] as ScholarQuote[]);
  const [direct, stored, fresh] = await Promise.all([
    mapped.then((items) => items.filter((quote): quote is ScholarQuote => !!quote)),
    phrases.length ? searchScholarQuotes(phrases, 6, options).catch(() => [] as ScholarQuote[]) : Promise.resolve([] as ScholarQuote[]),
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
export async function askPreparedOnly(question: string, observe?: (provider: ReturnType<typeof getVerifier>) => ReturnType<typeof getVerifier>): Promise<AskResult | null> {
  if (process.env.PREPARED_PUBLISHING_ENABLED !== "true" || process.env.PREPARED_ANSWERS === "off") return null;
  const answer = await approvedForQuestion(question, {
    common: PREPARED_ANSWERS, topics: TOPIC_ANSWERS,
    topicsEnabled: process.env.ASK_APPROVED_TOPICS !== "false",
    blockedCommon: PREPARED_IDS_AWAITING_VIEW_DECISION,
    getReviews: getReviewDecisions,
    getTopicQuestions: async () => (await Promise.all((["ar", "en", "de"] as const).map(async (language) =>
      (await getTopics(language)).map((topic) => ({ id: topic.id, language, question: topic.question }))))).flat(),
    verifier: () => observe ? observe(getVerifier()) : getVerifier(), load: loadPrepared,
  });
  return answer ? { status: "answer", answer } : null;
}

export async function ask(question: string, uiLanguage: Locale, trace?: Pick<PipelineDeps, "onFrame" | "onRetrieved" | "onCandidates" | "onSelection" | "onCoverage">, previousUserMessages: string[] = []): Promise<AskResult> {
  const requestStarted = currentAskStarted() ?? Date.now();
  const debug = process.env.ASK_DEBUG === "true";
  const libraryFlow = askLibraryFlow(), claimAudit = askClaimAudit(), tiered = askTiered();
  const requestId = currentAskRequestId() ?? randomUUID();
  const context = {
    requestId, revision: process.env.VERCEL_GIT_COMMIT_SHA,
    writerChain: "unknown", verifierChain: "unknown",
    claimAudit, tiered, lean: process.env.ASK_LEAN === "true", libraryFlow,
  };
  let onDiagnostic = diagnosticLogger(debug, context, (line) => console.info(line));
  let calls = 0;
  const observe = (provider: ReturnType<typeof getProvider>, role: "writer" | "checker") => debug
    ? observedProvider(provider, role, onDiagnostic, requestStarted, () => `A${++calls}`) : provider;
  const skipPrepared = !!trace || !!(libraryFlow && previousUserMessages.length);
  onDiagnostic("prepared", "reuse_started", Date.now() - requestStarted, { skipped: skipPrepared, prepared_enabled: process.env.PREPARED_PUBLISHING_ENABLED === "true" && process.env.PREPARED_ANSWERS !== "off", approved_topics_enabled: process.env.ASK_APPROVED_TOPICS !== "false" });
  const prepared = skipPrepared ? null : await askPreparedOnly(question, (provider) => observe(provider, "checker"));
  onDiagnostic("prepared", "reuse_finished", Date.now() - requestStarted, { outcome: skipPrepared ? "skipped" : prepared ? "matched" : "miss" });
  if (prepared) {
    onDiagnostic("answer", "approved_answer_ready", Date.now() - requestStarted, { status: "answer" });
    return prepared;
  }
  const writer = getProvider(), verifier = getVerifier();
  onDiagnostic = diagnosticLogger(debug, { ...context, writerChain: writer.id, verifierChain: verifier.id }, (line) => console.info(line));
  onDiagnostic("request", "runtime_configuration", Date.now() - requestStarted, { scholar_enabled: SCHOLARS_ON, live_scholar_enabled: LIVE_ON && SCHOLARS_ON, videos_enabled: VIDEOS_ON, deadline_ms: askDeadlineMs() });
  onDiagnostic("retrieval", `hadith_mode_${HADITH_MODE}`, Date.now() - requestStarted);
  if (!SCHOLARS_ON) onDiagnostic("retrieval", process.env.SCHOLAR_QUOTES === "off"
    ? "scholar_disabled" : "scholar_server_configuration_missing", Date.now() - requestStarted);
  try {
    const result = await runPipeline(question, uiLanguage, {
      ...trace,
      writer: observe(writer, "writer"),
      verifier: observe(verifier, "checker"),
      deadlineMs: askDeadlineMs(),
      claimAudit,
      libraryFlow,
      previousUserMessages,
      ...(process.env.ASK_LEAN === "true" ? { candidateLimits: { ...LEAN_CANDIDATE_LIMITS } } : {}),
      // ASK_TIERED=true: Quran, then hadith, then fatwas, then videos (read per question so it can be switched).
      ...(tiered ? { tiered: { videoBudgetMs: askVideoBudgetMs(), maxVideos: askMaxVideos() } } : {}),
      search: searchQuran,
      getVerse,
      neighbours,
      // Hadith from Sahih al-Bukhari / Sahih Muslim via HadeethEnc (permission requested 2026-09-28).
      // Off unless HADITH_SOURCE=hadeethenc, so it can be switched off instantly.
      ...(HADITH_ON ? { searchHadith: (q) => searchHadithMulti(q, 8), getHadith } : {}),
      // Stored hadith from our own library (Sunnah.com text). Needs the server's secret key.
      ...(HADITH_MODE === "library" ? { searchHadith: (queries) => searchLibraryHadith(queries, {
        onAudit: (audit) => {
          onDiagnostic("retrieval", "library_filter_totals", Date.now() - requestStarted, {
            kind: audit.group, query_count: audit.queries, configuration_missing: audit.configurationMissing,
            filters: Object.fromEntries(Object.entries(audit).filter(([, count]) => typeof count === "number")
              .map(([name, count]) => [name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), count])),
          });
          if (audit.configurationMissing) onDiagnostic("retrieval", "hadith_server_configuration_missing", Date.now() - requestStarted);
          for (const [name, count] of Object.entries(audit)) if (typeof count === "number" && count > 0)
            onDiagnostic("retrieval", `hadith_${name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}_${count}`, Date.now() - requestStarted);
        },
      }), getHadith: getLibraryHadith } : {}),
      // Short quotes of approved scholars from our private library (rights: short quotes, permission pending).
      ...(SCHOLARS_ON ? { searchScholars: (phrases: string[], mappedUrls?: string[]) => scholarQuotes(phrases, mappedUrls, {
        allVariants: libraryFlow,
        onAudit: (audit) => {
          onDiagnostic("retrieval", "library_filter_totals", Date.now() - requestStarted, {
            kind: audit.group, query_count: audit.queries, configuration_missing: audit.configurationMissing,
            filters: Object.fromEntries(Object.entries(audit).filter(([, count]) => typeof count === "number")
              .map(([name, count]) => [name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), count])),
          });
          if (audit.configurationMissing) onDiagnostic("retrieval", "scholar_server_configuration_missing", Date.now() - requestStarted);
          for (const [name, count] of Object.entries(audit)) if (typeof count === "number" && count > 0)
            onDiagnostic("retrieval", `scholar_${name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}_${count}`, Date.now() - requestStarted);
        },
      }) } : {}),
      ...(libraryFlow && LIVE_ON && SCHOLARS_ON ? { searchScholarsLive } : {}),
      // Related clips from the approved YouTube channels, shown under the answer (never evidence).
      ...(VIDEOS_ON ? { searchVideos: (phrases) => searchVideos(phrases) } : {}),
      // Reason codes only, never the question. Local testing only.
      onRefuse: debug ? (reason) => { console.info(`ask refused: ${reason}`); onDiagnostic("answer", `refused_${reason}`, Date.now() - requestStarted); } : undefined,
      onStep: debug ? (name, ms) => { console.info(`ask step: ${name} at ${ms} ms`); onDiagnostic("request", `step_${name.replace(/[^a-z0-9_]/g, "_")}`, Date.now() - requestStarted); } : undefined,
      onDiagnostic: debug ? (stage, code, _ms, details) => onDiagnostic(stage, code, Date.now() - requestStarted, details) : undefined,
    });
    onDiagnostic("answer", "live_process_finished", Date.now() - requestStarted, { status: result.status, duration_ms: Date.now() - requestStarted });
    return result;
  } catch (error) {
    onDiagnostic("answer", "live_process_failed", Date.now() - requestStarted, { outcome: errorCategory(error) });
    throw error;
  }
}
