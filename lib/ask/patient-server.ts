import "server-only";
import { getProvider, getVerifier } from "@/lib/ai";
import { searchQuran, getVerse, neighbours } from "@/lib/sources/quran";
import { searchHadithMulti } from "@/lib/sources/hadith";
import { searchLibraryHadith } from "@/lib/sources/hadith-library";
import { hadithMode } from "@/lib/sources/hadith-mode";
import { searchScholarQuotes } from "@/lib/sources/scholars";
import { searchScholarsLive } from "@/lib/sources/scholars-live";
import { toEvidence } from "./core";
import { lookupDisplayTranslations } from "./display-translation-lookup";
import { understandPatientQuestion } from "./patient-framing";
import { runPatientPipeline } from "./patient-pipeline";
import { serverJobFreshness } from "./search-engine/server-job-freshness";
import { pipelineMeaningRanker } from "./search-engine/pipeline-ranking";
import { modelMeaningReranker } from "./search-engine/reranker";
import { modelRecoveryPlanner } from "./search-engine/recovery-planner";
import { serverCorpusRetriever } from "./search-engine/server-corpus-router";
import { askMeaningRanking, askResearchRecovery, askCorpusRetrieval, askFocusedChecks, askDistinctSelection } from "./settings";
import { localAskTraceEnabled } from "./settings";
import { observeSourceFunctions, recordLocalAskEvent } from "./local-trace";
import { observedProvider } from "./trace-context";
import { diagnosticLogger } from "./diagnostics";
import type { PatientWorkerDeps } from "./search-engine/patient-worker";
import { emptyPatientState, reducePatientEvent, type PatientEvent } from "./patient-protocol";

/** Worker-only construction. Spending interception and owner binding are installed by its caller. */
export const executePatientRequest: PatientWorkerDeps["execute"] = async (request, checkpoint, append, signal) => {
  const began = Date.now(), mode = hadithMode(), rawWriter = getProvider(), rawVerifier = getVerifier(); let call = 0;
  const sink = diagnosticLogger(process.env.ASK_DIAGNOSTICS === "true" || localAskTraceEnabled(), {
    requestId: requestJobId(), revision: request.engineRevision, writerChain: rawWriter.id, verifierChain: rawVerifier.id,
    claimAudit: true, tiered: true, lean: false, libraryFlow: true, rich: true,
  }, line => console.info(line));
  const log: Parameters<typeof observedProvider>[2] = (stage, code, elapsedMs, details) => {
    sink(stage, code, elapsedMs, details); recordLocalAskEvent("stage", { stage, code, elapsed_ms: elapsedMs, details });
  };
  const attempt = (checkpoint?.attempt ?? 0) + (checkpoint?.state.status === "paused" ? 1 : 0);
  if (!Number.isSafeInteger(attempt) || attempt < 0) throw new Error("invalid_patient_attempt");
  const scoped = (provider: typeof rawWriter): typeof rawWriter => ({ id: provider.id, generateJson: req => provider.generateJson({ ...req,
    prompt: JSON.stringify({ ...JSON.parse(req.prompt), research_execution: { job_id: requestJobId(), attempt } }) }) });
  const writer = observedProvider(scoped(rawWriter), "writer", log, began, () => `P${++call}`);
  const verifier = observedProvider(scoped(rawVerifier), "checker", log, began, () => `P${++call}`);
  if (!checkpoint && !request.previous_user_messages.length) {
    const { askPreparedOnly } = await import("./pipeline");
    const prepared = await askPreparedOnly(request.question, () => verifier);
    if (prepared?.status === "answer") {
      const state = emptyPatientState(requestJobId(), request.lang);
      const event: PatientEvent = { version: 2, job_id: state.jobId, sequence: 1, type: "prepared", answer: prepared.answer };
      const result = { version: 2 as const, engineRevision: request.engineRevision, state: reducePatientEvent(state, event), evidenceRevision: 1, research: {} };
      await append(event, result); return result;
    }
  }
  const frame = checkpoint?.frame ?? await understandPatientQuestion(request.question, request.previous_user_messages, writer, signal);
  if (!frame || frame.kind !== "question" || frame.clarificationNeeded || frame.checklistStatus !== "complete") {
    const state = checkpoint?.state ?? emptyPatientState(requestJobId(), request.lang);
    const event: PatientEvent = { version: 2, job_id: state.jobId, sequence: state.sequence + 1, type: "terminal", status: "failed" };
    const result = { version: 2 as const, engineRevision: request.engineRevision, state: reducePatientEvent(state, event), evidenceRevision: checkpoint?.evidenceRevision ?? 1, research: checkpoint?.research ?? {} };
    await append(event, result); return result;
  }
  const allowScholars = !!process.env.SUPABASE_SECRET_KEY && process.env.SCHOLAR_QUOTES !== "off";
  const freshness = serverJobFreshness();
  const seed = { ...(checkpoint ?? { version: 2 as const, engineRevision: request.engineRevision, state: emptyPatientState(requestJobId(), request.lang), evidenceRevision: 1, research: {} }), frame, attempt };
  const save: typeof append = async (event, progress) => {
    await append(event, { ...progress, frame, attempt });
    recordLocalAskEvent("patient_checkpoint", { sequence: event.sequence, event_type: event.type,
      status: progress.state.status, evidence_revision: progress.evidenceRevision,
      ...("group" in event ? { group: event.group } : event.type === "section" ? { group: event.section.group } : {}),
      ...("reason" in event ? { reason: event.reason } : {}) });
  };
  const deps = {
    engineRevision: request.engineRevision, writer, verifier, append: save, abortSignal: signal, focusedChecks: askFocusedChecks(), distinctSelection: askDistinctSelection(),
    sourceAvailability: { hadith: mode !== "off", scholar: allowScholars },
    search: (queries: string[], limit: number) => searchQuran(queries, limit, signal), getVerse, neighbours,
    ...(mode === "hadeethenc" ? { searchHadith: (queries: Parameters<typeof searchHadithMulti>[0]) => searchHadithMulti(queries, 8) } : {}),
    ...(mode === "library" ? { searchHadith: (queries: Parameters<typeof searchLibraryHadith>[0]) => searchLibraryHadith(queries, { allVariants: true, meaningCandidates: askMeaningRanking(), signal }) } : {}),
    ...(allowScholars ? { searchScholars: (queries: string[]) => searchScholarQuotes(queries, 8, { allVariants: true, meaningCandidates: askMeaningRanking(), signal }) } : {}),
    ...(allowScholars && process.env.SCHOLARS_LIVE !== "off" ? { searchScholarsLive: (queries: string[]) => searchScholarsLive(queries, signal) } : {}),
    ...(askMeaningRanking() ? { meaningRankCandidates: pipelineMeaningRanker(modelMeaningReranker(verifier), audit => {
      recordLocalAskEvent("meaning_ranking", audit);
    }, 30, { retainCandidatesOnInvalidResult: true }) } : {}),
    ...(askResearchRecovery() ? { planEvidenceRecovery: modelRecoveryPlanner(writer) } : {}),
    ...(askCorpusRetrieval() ? { retrieveCorpusCandidates: serverCorpusRetriever([...(mode !== "off" ? ["hadith" as const] : []), ...(allowScholars ? ["scholar" as const] : [])]) } : {}),
    displayTranslationLookup: lookupDisplayTranslations,
    revalidate: async (passages: import("./retrieval").SelectedPassage[]) => {
      const outcomes = await Promise.all(passages.map(p => freshness.evidence({ id: p.id, evidence: toEvidence(p.source, request.lang) }, request.lang, signal)));
      return outcomes.every(outcome => outcome === "valid");
    },
    onDiagnostic: log,
  };
  recordLocalAskEvent("patient_pipeline_started", { source_mode: mode, engine_revision: request.engineRevision });
  return runPatientPipeline({ jobId: checkpoint?.state.jobId ?? requestJobId(), question: request.question, language: request.lang, frame, checkpoint: seed },
    observeSourceFunctions(deps), signal);
};

function requestJobId(): string {
  // The worker creates this trusted async context; visitors cannot choose a different owner job.
  const id = currentAskRequestId();
  if (!id) throw new Error("patient_job_context_required");
  return id;
}
import { currentAskRequestId } from "./trace-context";
