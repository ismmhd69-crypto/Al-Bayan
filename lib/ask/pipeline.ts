import { askSimplePipeline } from "./settings";
import "server-only";
import { abortable } from "./abort";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/lib/i18n";
import { getProvider, getVerifier } from "@/lib/ai";
import { getVerse, neighbours, searchQuran } from "@/lib/sources/quran";
import { getHadith, searchHadithMulti, warmHadithCatalogues } from "@/lib/sources/hadith";
import { findLibraryHadithByReference, getLibraryHadith, searchLibraryHadith } from "@/lib/sources/hadith-library";
import { resolveLibraryHadithHint } from "./hadith-hints";
import { hadithMode } from "@/lib/sources/hadith-mode";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { getMappedScholarQuote, searchScholarsLive } from "@/lib/sources/scholars-live";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { searchVideos } from "@/lib/sources/videos";
import { runPipeline, toEvidence, type AskResult, type PipelineDeps } from "./core";
import { askClaimAudit, askRichVideos, askCorpusRetrieval, askDeadlineMs, askLibraryFlow, askMaxVideos, askMeaningRanking, askResearchRecovery, askTiered, askVideoBudgetMs, LEAN_CANDIDATE_LIMITS } from "./settings";
import { serverCorpusRetriever } from "./search-engine/server-corpus-router";
import { pipelineMeaningRanker } from "./search-engine/pipeline-ranking";
import { modelMeaningReranker } from "./search-engine/reranker";
import { modelRecoveryPlanner } from "./search-engine/recovery-planner";
import type { SearchOptions } from "@/lib/sources/search-audit";
import { approvedForQuestion } from "./approved";
import { loadPrepared } from "@/lib/prepared";
import { getReviewDecisions, getTopics } from "@/lib/content";
import { PREPARED_ANSWERS } from "@/data/prepared-answers";
import { PREPARED_IDS_AWAITING_VIEW_DECISION } from "@/data/view-decisions";
import { TOPIC_ANSWERS } from "@/data/topic-answers";
import { diagnosticLogger } from "./diagnostics";
import { currentAskRequestId, currentAskStarted, observedProvider, errorCategory } from "./trace-context";
import type { RichCallbacks } from "./rich-answer";
import { lookupDisplayTranslations } from "./display-translation-lookup";
import { recordLocalAskEvent } from "./local-trace";
import { pointSearchPlans } from "./library-flow";
import { localAskTraceEnabled, localAskUnhurried, askFocusedChecks, askDistinctSelection } from "./settings";
import { remainingResearchMs } from "./research-runtime";

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
  const mapped = Promise.all(mappedUrls.slice(0, 2).map((url) => getMappedScholarQuote(url, options.signal).catch(() => { options.onFailure?.("search_failed"); return null; })));
  const live = LIVE_ON && !options.allVariants
    ? Promise.race([
        searchScholarsLive(phrases, options.signal).catch(() => { options.onFailure?.("search_failed"); return [] as ScholarQuote[]; }),
        ...(localAskUnhurried() || remainingResearchMs() === Infinity ? [] : [new Promise<ScholarQuote[]>((resolve) => setTimeout(() => resolve([]), LIVE_TIMEOUT_MS))]),
      ])
    : Promise.resolve([] as ScholarQuote[]);
  const [direct, stored, fresh] = await Promise.all([
    mapped.then((items) => items.filter((quote): quote is ScholarQuote => !!quote)),
    phrases.length ? searchScholarQuotes(phrases, 6, options).catch(() => { options.onFailure?.("search_failed"); return [] as ScholarQuote[]; }) : Promise.resolve([] as ScholarQuote[]),
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

/** Re-read through the existing current publication/rights/AI-use gate. A missing
 * or changed stored quote is never approved from its previous ID alone. */
export async function progressiveScholarFreshness(candidates: import("./retrieval").PassageForSelection[], queries: string[][], language: Locale, signal: AbortSignal) {
  const current = (await Promise.all(queries.map(phrases => searchScholarQuotes(phrases, 8, { allVariants: true, meaningCandidates: true, signal })))).flat();
  signal.throwIfAborted();
  return new Set(candidates.filter(p => p.source.kind === "scholar" && current.some(q => q.id === p.id
    && JSON.stringify(toEvidence({ kind: "scholar", quote: q }, language)) === JSON.stringify(toEvidence(p.source, language)))).map(p => p.id));
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

export async function ask(question: string, uiLanguage: Locale, trace?: Pick<PipelineDeps, "onFrame" | "onRetrieved" | "onCandidates" | "onSelection" | "onCoverage">, previousUserMessages: string[] = [], options?: { rich?: RichCallbacks; signal?: AbortSignal; disableReferenceHints?: boolean; checkpoint?: import("./progressive-checkpoint").ProgressiveCheckpoint }): Promise<AskResult> {
  const requestStarted = currentAskStarted() ?? Date.now();
  const debug = process.env.ASK_DEBUG === "true" || localAskTraceEnabled();
  const libraryFlow = !!options?.rich || askLibraryFlow(), claimAudit = askClaimAudit(), tiered = !!options?.rich || askTiered();
  const requestId = currentAskRequestId() ?? randomUUID();
  const context = {
    requestId, revision: process.env.VERCEL_GIT_COMMIT_SHA,
    writerChain: "unknown", verifierChain: "unknown",
    claimAudit: !!options?.rich || claimAudit, tiered, lean: process.env.ASK_LEAN === "true", libraryFlow,
    ...(options?.rich ? { rich: true } : {}),
  };
  const makeDiagnostic = (runtime: typeof context) => {
    const publicLog = diagnosticLogger(debug, runtime, line => console.info(line));
    return ((stage, code, elapsedMs, details) => {
      recordLocalAskEvent("stage", { stage, code, elapsed_ms: elapsedMs, details });
      publicLog(stage, code, elapsedMs, details);
    }) as ReturnType<typeof diagnosticLogger>;
  };
  let onDiagnostic = makeDiagnostic(context);
  let calls = 0;
  const observe = (provider: ReturnType<typeof getProvider>, role: "writer" | "checker") => {
    const bounded = options?.signal ? { id: provider.id, generateJson: (request: Parameters<typeof provider.generateJson>[0]) => {
      options.signal!.throwIfAborted();
      return provider.generateJson({ ...request, signal: request.signal ? AbortSignal.any([request.signal, options.signal!]) : options.signal });
    } } : provider;
    return debug ? observedProvider(bounded, role, onDiagnostic, requestStarted, () => `A${++calls}`) : bounded;
  };
  const skipPrepared = askSimplePipeline() || !!trace || !!options?.checkpoint?.frame || !!(libraryFlow && previousUserMessages.length);
  onDiagnostic("prepared", "reuse_started", Date.now() - requestStarted, { skipped: skipPrepared, prepared_enabled: process.env.PREPARED_PUBLISHING_ENABLED === "true" && process.env.PREPARED_ANSWERS !== "off", approved_topics_enabled: process.env.ASK_APPROVED_TOPICS !== "false" });
  const prepared = skipPrepared ? null : await askPreparedOnly(question, (provider) => observe(provider, "checker"));
  onDiagnostic("prepared", "reuse_finished", Date.now() - requestStarted, { outcome: skipPrepared ? "skipped" : prepared ? "matched" : "miss" });
  if (prepared) {
    recordLocalAskEvent("terminal_result", prepared);
    onDiagnostic("answer", "approved_answer_ready", Date.now() - requestStarted, { status: "answer" });
    return prepared;
  }
  const writer = getProvider(), verifier = getVerifier();
  onDiagnostic = makeDiagnostic({ ...context, writerChain: writer.id, verifierChain: verifier.id });
  onDiagnostic("request", "runtime_configuration", Date.now() - requestStarted, { scholar_enabled: SCHOLARS_ON, live_scholar_enabled: LIVE_ON && SCHOLARS_ON, videos_enabled: VIDEOS_ON, deadline_ms: askDeadlineMs() });
  onDiagnostic("retrieval", `hadith_mode_${HADITH_MODE}`, Date.now() - requestStarted);
  if (!SCHOLARS_ON) onDiagnostic("retrieval", process.env.SCHOLAR_QUOTES === "off"
    ? "scholar_disabled" : "scholar_server_configuration_missing", Date.now() - requestStarted);
  try {
    const sourceProblems: PipelineDeps["sourceProblems"] = {};
    const checkpoint = options?.checkpoint;
    const result = await runPipeline(question, uiLanguage, {
      ...trace,
      ...(checkpoint ? {
        progressiveCheckpoint: checkpoint,
        meaningApprovals: checkpoint.meaningApprovals,
        revalidateStable: async (candidates, signal) => {
          const { serverJobFreshness } = await import("./search-engine/server-job-freshness");
          const freshness = serverJobFreshness({ freshOriginals: askSimplePipeline() }), rejectedIds: string[] = [];
          let unavailable = false;
          const report = (p: import("./retrieval").PassageForSelection, reason: string) => onDiagnostic("retrieval", "stable_source_recheck_detail", Date.now() - requestStarted,
            { source_id: p.id, group: p.source.kind, revalidation_reason: reason });
          const scholars = candidates.filter(p => p.source.kind === "scholar");
          const validScholars = scholars.length && checkpoint.frame ? await progressiveScholarFreshness(scholars,
            pointSearchPlans(checkpoint.frame).map(plan => [...plan.scholar, ...(checkpoint.recoveryQueries ?? []).filter(q => q.family === "scholar").map(q => q.text)]), uiLanguage, signal) : new Set<string>();
          await Promise.all(candidates.map(async p => {
            if (p.source.kind === "scholar") { if (!validScholars.has(p.id)) { unavailable = true; report(p, "scholar_unconfirmed"); } return; }
            try {
              const status = await freshness.evidence({ id: p.id, evidence: toEvidence(p.source, uiLanguage) }, uiLanguage, signal);
              if (status === "changed") { rejectedIds.push(p.id); report(p, "source_changed"); return; }
              if (status === "unavailable") { unavailable = true; report(p, "source_unavailable"); return; }
              if (p.source.kind === "quran") {
                const key = p.source.verse.key, current = await abortable(neighbours(key, askSimplePipeline()), signal);
                const ordered = (rows: typeof current) => JSON.stringify([...rows].sort((a, b) => a.key.localeCompare(b.key)));
                const surrounding = current.filter(v => v.key !== key);
                if (JSON.stringify(surrounding.map(v => v.key).sort()) !== JSON.stringify(p.context.map(v => v.key).sort())) { unavailable = true; report(p, "context_unavailable"); }
                else if (ordered(surrounding) !== ordered(p.context)) { rejectedIds.push(p.id); report(p, "context_changed"); }
              }
            } catch { signal.throwIfAborted(); unavailable = true; report(p, "source_request_failed"); }
          }));
          return { unavailable, rejectedIds };
        },
        onFrame: (frame: import("./retrieval").QuestionFrame) => { checkpoint.frame = structuredClone(frame); trace?.onFrame?.(frame); },
        revalidateProgressive: async (candidates: import("./retrieval").PassageForSelection[], signal: AbortSignal) => {
          const { serverJobFreshness } = await import("./search-engine/server-job-freshness");
          const freshness = serverJobFreshness();
          // Ordinary stored-quote continuation uses the already deployed approved
          // search gate. The separate persistent-index RPC is not a prerequisite.
          const scholarCandidates = candidates.filter(p => p.source.kind === "scholar");
          const currentScholars = scholarCandidates.length && checkpoint.frame ? await progressiveScholarFreshness(scholarCandidates,
            pointSearchPlans(checkpoint.frame).map(plan => [...plan.scholar, ...(checkpoint.recoveryQueries ?? []).filter(q => q.family === "scholar").map(q => q.text)]), uiLanguage, signal) : new Set<string>();
          const results = await Promise.all(candidates.map(async p => {
            if (p.source.kind === "scholar") {
              return currentScholars.has(p.id);
            }
            if (await freshness.evidence({ id: p.id, evidence: toEvidence(p.source, uiLanguage) }, uiLanguage, signal) !== "valid") return false;
            if (p.source.kind !== "quran") return true;
            const key = p.source.verse.key;
            const current = await abortable(neighbours(key), signal);
            const ordered = (rows: typeof current) => JSON.stringify([...rows].sort((a, b) => a.key.localeCompare(b.key)));
            return ordered(current.filter(v => v.key !== key)) === ordered(p.context);
          }));
          return results.every(Boolean);
        },
      } : {}),
      simpleResearch: !!options?.rich?.stable && askSimplePipeline(),
      meaningReview: !!options?.rich,
      focusedChecks: !!options?.rich && askFocusedChecks(),
      distinctSelection: !!options?.rich && askDistinctSelection(),
      ...(options?.rich ? { rich: {
        progressive: options.rich.progressive,
        stable: options.rich.stable,
        onIntegrity: options.rich.onIntegrity,
        onGroupStatus: options.rich.onGroupStatus,
        onCard: card => { onDiagnostic("response", "checked_quran_card", Date.now() - requestStarted, { count: card.sources.length }); options.rich?.onCard?.(card); },
        onCardWithdraw: id => options.rich?.onCardWithdraw?.(id),
        onProgress: stage => { onDiagnostic("response", `rich_${stage}`, Date.now() - requestStarted); options.rich?.onProgress?.(stage); },
        onSection: (section, snapshot) => { onDiagnostic("response", `checked_${section.group}_${section.outcome}`, Date.now() - requestStarted, { count: section.presentation === "originals" ? section.sources.length : section.claims.length }); options.rich?.onSection?.(section, snapshot); },
        onWithdraw: group => { onDiagnostic("response", "rich_sections_withdrawn", Date.now() - requestStarted); options.rich?.onWithdraw?.(group); },
      }, sourceProblems, sourceAvailability: { hadith: HADITH_ON || (HADITH_MODE === "library" && !!process.env.SUPABASE_SECRET_KEY), scholar: SCHOLARS_ON } } : {}),
      ...(options?.signal ? { abortSignal: options.signal } : {}),
      writer: observe(writer, "writer"),
      verifier: observe(verifier, "checker"),
      ...(options?.rich && askCorpusRetrieval() ? { retrieveCorpusCandidates: serverCorpusRetriever([...(HADITH_MODE !== "off" ? ["hadith" as const] : []), ...(SCHOLARS_ON ? ["scholar" as const] : [])]) } : {}),
      ...(options?.rich && (askResearchRecovery() || options.rich.progressive) ? { planEvidenceRecovery: modelRecoveryPlanner(observe(writer, "writer")) } : {}),
      ...(options?.rich && askMeaningRanking() ? { meaningRankCandidates: pipelineMeaningRanker(modelMeaningReranker(observe(verifier, "checker")), audit => {
        recordLocalAskEvent("meaning_ranking", audit);
        onDiagnostic("candidates", audit.fallbackReason ? "meaning_ranking_invalid_retained_candidates" : "meaning_ranking_finished", Date.now() - requestStarted, { before: audit.before, after: audit.after, dropped_source_ids: audit.droppedIds, ignored_unknown_count: audit.ignoredUnknownCount, ...(audit.fallbackReason ? { reason: audit.fallbackReason } : {}) });
      }, 30, { retainCandidatesOnInvalidResult: true }) } : {}),
      deadlineMs: askDeadlineMs(),
      ...(options?.disableReferenceHints ? { disableReferenceHints: true } : {}),
      ...(options?.rich ? { displayTranslationLookup: lookupDisplayTranslations } : {}),
      claimAudit,
      libraryFlow,
      previousUserMessages,
      ...(process.env.ASK_LEAN === "true" ? { candidateLimits: { ...LEAN_CANDIDATE_LIMITS } } : {}),
      // ASK_TIERED=true: Quran, then hadith, then fatwas, then videos (read per question so it can be switched).
      ...(tiered ? { tiered: { videoBudgetMs: askVideoBudgetMs(), maxVideos: askMaxVideos() } } : {}),
      search: options?.signal ? (queries, limit) => searchQuran(queries, limit, options.signal, outcome => {
        sourceProblems.quran = outcome;
        onDiagnostic("retrieval", `quran_partial_${outcome}`, Date.now() - requestStarted);
      }) : searchQuran,
      getVerse,
      neighbours,
      // Hadith from Sahih al-Bukhari / Sahih Muslim via HadeethEnc (permission requested 2026-09-28).
      // Off unless HADITH_SOURCE=hadeethenc, so it can be switched off instantly.
      ...(HADITH_ON ? { searchHadith: (q) => searchHadithMulti(q, 8, () => {
        sourceProblems.hadith = "search_failed";
        onDiagnostic("retrieval", "hadith_partial_search_failed", Date.now() - requestStarted);
      }, options?.rich?.progressive ? uiLanguage : undefined), getHadith: (id: string) => getHadith(id, options?.rich?.progressive ? uiLanguage : undefined) } : {}),
      // Stored hadith from our own library (Sunnah.com text). Needs the server's secret key.
      ...(HADITH_MODE === "library" ? { searchHadith: (queries) => searchLibraryHadith(queries, {
        meaningCandidates: !!options?.rich && askMeaningRanking(),
        ...(options?.signal ? { signal: options.signal } : {}),
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
      }), getHadith: getLibraryHadith,
        resolveHadithHint: (id, signal) => resolveLibraryHadithHint(id, hintId => getHadith(hintId, "ar"), findLibraryHadithByReference, signal),
      } : {}),
      // Short quotes of approved scholars from our private library (rights: short quotes, permission pending).
      ...(SCHOLARS_ON ? { searchScholars: (phrases: string[], mappedUrls?: string[]) => scholarQuotes(phrases, mappedUrls, {
        allVariants: libraryFlow, meaningCandidates: !!options?.rich && askMeaningRanking(),
        ...(options?.rich ? { signal: options.signal, onFailure: (outcome: "timeout" | "search_failed") => { sourceProblems.scholar = outcome; onDiagnostic("retrieval", `scholar_partial_${outcome}`, Date.now() - requestStarted); } } : {}),
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
      ...(libraryFlow && LIVE_ON && SCHOLARS_ON ? { searchScholarsLive: async (queries: string[]) => {
        try { return await searchScholarsLive(queries, options?.signal); }
        catch (error) { if (options?.rich) sourceProblems.scholar = options.signal?.aborted ? "timeout" : "search_failed"; throw error; }
      } } : {}),
      // Related clips from the approved YouTube channels, shown under the answer (never evidence).
      richVideos: askRichVideos(),
      ...(VIDEOS_ON ? { searchVideos: (phrases, signal) => searchVideos(phrases, 12, signal) } : {}),
      // Reason codes only, never the question. Local testing only.
      onRefuse: debug ? (reason) => { console.info(`ask refused: ${reason}`); onDiagnostic("answer", `refused_${reason}`, Date.now() - requestStarted); } : undefined,
      onStep: debug ? (name, ms) => { console.info(`ask step: ${name} at ${ms} ms`); onDiagnostic("request", `step_${name.replace(/[^a-z0-9_]/g, "_")}`, Date.now() - requestStarted); } : undefined,
      onDiagnostic: debug ? (stage, code, _ms, details) => onDiagnostic(stage, code, Date.now() - requestStarted, details) : undefined,
    });
    onDiagnostic("answer", "live_process_finished", Date.now() - requestStarted, { status: result.status, duration_ms: Date.now() - requestStarted });
    recordLocalAskEvent("terminal_result", result);
    return result;
  } catch (error) {
    recordLocalAskEvent("pipeline_failed", { error, request_aborted: options?.signal?.aborted, reason: options?.signal?.reason });
    onDiagnostic("answer", "live_process_failed", Date.now() - requestStarted, { outcome: errorCategory(error) });
    throw error;
  }
}
