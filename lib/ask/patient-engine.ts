import type { Locale } from "@/lib/i18n";
import type { SelectedPassage, QuestionFrame } from "./retrieval";
import { RICH_ORDER, validRichSection, validRichGuidance, type RichGuidance, type RichSection } from "./rich-answer";
import { emptyPatientState, reducePatientEvent, type PatientEvent, type PatientEventBody, type PatientReason, type PatientSourceGroup, type PatientState } from "./patient-protocol";
import { validateResearchProgress, type PatientResearchProgress, type SaveResearchProgress } from "./research-progress";
import type { IntegrityNotice } from "./publication";

const groups: PatientSourceGroup[] = ["quran", "hadith", "scholar"];
export type PatientResearchResult = { status: "ready"; passages: SelectedPassage[]; searchOutcome?: "search_failed" } | { status: "failed"; reason: PatientReason };
export type PatientSnapshot = { revision: number; passages: SelectedPassage[]; unavailable: PatientSourceGroup[];
  outcomes?: Partial<Record<PatientSourceGroup, "unavailable" | "search_failed" | "failed_check">> };
export type PatientCheckpoint = { version: 2; engineRevision: string; state: PatientState; evidenceRevision: number; research: Partial<Record<PatientSourceGroup, PatientResearchResult>>;
  /** Unfinished recovery is separate from the last checked, still-eligible evidence. */
  retryGroups?: PatientSourceGroup[]; retryRequirementIds?: string[]; discovery?: PatientResearchProgress; frame?: QuestionFrame; attempt?: number };
export type PatientFinalReview = { status: "complete"; summary: RichSection; guide?: RichGuidance; sections?: RichSection[]; updatedEvidence?: SelectedPassage[] }
  | { status: "needs_attention"; reason: PatientReason; requiredGroups: PatientSourceGroup[]; requiredRequirementIds?: string[]; withdrawGroups: PatientSourceGroup[]; integrityNotices?: IntegrityNotice[] };
export type PatientEngineDeps = {
  engineRevision: string;
  stableCommits?: boolean;
  research(group: PatientSourceGroup, signal: AbortSignal, requirementIds?: string[], saveResearch?: SaveResearchProgress): Promise<PatientResearchResult>;
  revalidate(passages: SelectedPassage[], signal: AbortSignal): Promise<boolean>;
  checkSection(group: PatientSourceGroup, snapshot: PatientSnapshot, signal: AbortSignal): Promise<RichSection>;
  finalReview(snapshot: PatientSnapshot, sections: RichSection[], signal: AbortSignal, saveResearch?: SaveResearchProgress): Promise<PatientFinalReview>;
  /** Persist checkpoint and event atomically using the existing private owner-bound job store. */
  append(event: PatientEvent, checkpoint: PatientCheckpoint): Promise<void>;
  signal: AbortSignal;
};
const revision = (v: string) => /^[a-f0-9]{64}$/.test(v);
export const validPatientRetryRequirements = (value: unknown, frame?: QuestionFrame): value is string[] => Array.isArray(value) && value.length <= 4
  && new Set(value).size === value.length && value.every(id => typeof id === "string" && /^R[1-4]$/.test(id) && (!frame || frame.requirements.some(r => r.id === id)));
const clone = <T>(v: T): T => structuredClone(v);
function freeze<T>(v: T): T {
  if (v && typeof v === "object") { Object.freeze(v); for (const child of Object.values(v)) freeze(child); }
  return v;
}

/** Patient v2 coordinator. Research runs concurrently; explanations publish in source order.
 * It never treats source arrival as approval, creates a paid retry, or imposes a wall-clock cap. */
export async function runPatientResearch(input: { jobId: string; language: Locale; checkpoint?: PatientCheckpoint }, deps: PatientEngineDeps): Promise<PatientCheckpoint> {
  if (!revision(deps.engineRevision)) throw new Error("invalid_patient_engine_revision");
  let checkpoint: PatientCheckpoint = input.checkpoint ? clone(input.checkpoint) : {
    version: 2, engineRevision: deps.engineRevision, state: emptyPatientState(input.jobId, input.language), evidenceRevision: 1, research: {},
  };
  if (checkpoint.version !== 2 || checkpoint.engineRevision !== deps.engineRevision || checkpoint.state.jobId !== input.jobId
    || checkpoint.state.language !== input.language || !["paused", "working"].includes(checkpoint.state.status)
    || checkpoint.retryGroups !== undefined && (!Array.isArray(checkpoint.retryGroups) || checkpoint.retryGroups.some(g => !groups.includes(g))
      || new Set(checkpoint.retryGroups).size !== checkpoint.retryGroups.length)
    || checkpoint.retryRequirementIds !== undefined && !validPatientRetryRequirements(checkpoint.retryRequirementIds, checkpoint.frame)) throw new Error("invalid_patient_checkpoint");
  if (checkpoint.discovery) {
    validateResearchProgress(checkpoint.discovery, checkpoint.frame);
    if (checkpoint.discovery.revision !== checkpoint.state.researchRevision || checkpoint.discovery.hash !== checkpoint.state.researchHash) throw Error("patient_research_checkpoint_mismatch");
  } else if (checkpoint.state.researchRevision !== undefined) throw Error("patient_research_checkpoint_missing");
  let writes = Promise.resolve();
  const serialized = (work: () => Promise<void>) => { writes = writes.then(work); return writes; };
  const append = async (body: PatientEventBody) => {
    deps.signal.throwIfAborted();
    const event = { ...body, version: 2, job_id: input.jobId, sequence: checkpoint.state.sequence + 1 } as PatientEvent;
    const next = { ...checkpoint, state: reducePatientEvent(checkpoint.state, event) };
    await deps.append(event, clone(next)); checkpoint.state = next.state;
  };
  const emit = (body: PatientEventBody) => serialized(() => append(body));
  const saveResearch: SaveResearchProgress = progress => serialized(async () => {
    validateResearchProgress(progress, checkpoint.frame);
    if (progress.revision !== (checkpoint.discovery?.revision ?? 0) + 1 || progress.previousHash !== (checkpoint.discovery?.hash ?? null)) throw Error("patient_research_revision_mismatch");
    checkpoint.discovery = clone(progress);
    await append({ type: "research_checkpoint", revision: progress.revision, hash: progress.hash });
  });
  const needsAttention = async (group: PatientSourceGroup, reason: PatientReason) => emit({ type: "state", group, state: "needs_attention", reason });
  if (checkpoint.state.status === "paused") await emit({ type: "resume" });
  const retried = new Set(groups.filter(g => !(deps.stableCommits && checkpoint.state.groups[g].section) && (!checkpoint.research[g] || checkpoint.research[g]?.status === "failed" || checkpoint.retryGroups?.includes(g))));
  const invalidated = new Set<PatientSourceGroup>();
  // Revalidation is required even when no new research will run for a completed group.
  for (const group of groups) {
    const previous = checkpoint.research[group];
    if (previous?.status === "ready" && !await deps.revalidate(previous.passages, deps.signal)) {
      if (deps.stableCommits && checkpoint.state.groups[group].section) {
        await needsAttention(group, "source_unavailable"); await emit({ type: "pause", reason: "source_unavailable" }); return checkpoint;
      }
      if (checkpoint.state.groups[group].section) await emit({ type: "withdraw", group, revision: checkpoint.state.groups[group].revision + 1, reason: "evidence_changed" });
      if (deps.stableCommits && checkpoint.state.groups[group].revision > 0) { await emit({ type: "pause", reason: "evidence_changed" }); return checkpoint; }
      checkpoint.research[group] = { status: "failed", reason: "source_unavailable" }; retried.add(group); invalidated.add(group);
    }
  }
  const pending = new Map<PatientSourceGroup, Promise<PatientResearchResult>>();
  for (const group of retried) {
    const scope = !invalidated.has(group) && checkpoint.retryGroups?.includes(group) && checkpoint.retryRequirementIds?.length ? [...checkpoint.retryRequirementIds] : undefined;
    pending.set(group, Promise.resolve().then(() => deps.research(group, deps.signal, scope, saveResearch)).catch(error => {
      deps.signal.throwIfAborted();
      // Unknown paid billing is handled by the journal and must propagate, never become a retry.
      if (error instanceof Error && ["ModelReconciliationRequired", "ResearchStorageError"].includes(error.name)) throw error;
      return { status: "failed", reason: "source_failed" } as const;
    }));
  }
  // Install rejection observers immediately while groups are consumed in display order.
  for (const work of pending.values()) void work.catch(() => {});
  const snapshot = (): PatientSnapshot => freeze(clone({ revision: checkpoint.evidenceRevision,
    passages: groups.flatMap(g => { const r = checkpoint.research[g]; return r?.status === "ready" ? r.passages : []; }),
    unavailable: groups.filter(g => { const r = checkpoint.research[g]; return r?.status === "failed" || r?.status === "ready" && r.searchOutcome === "search_failed"; }),
    outcomes: Object.fromEntries(groups.flatMap(g => {
      const r = checkpoint.research[g];
      return r?.status === "failed" ? [[g, r.reason === "source_unavailable" ? "unavailable" : r.reason === "source_failed" ? "search_failed" : "failed_check"]]
        : r?.status === "ready" && r.searchOutcome ? [[g, r.searchOutcome]] : [];
    })),
  }));
  for (const group of groups) {
    deps.signal.throwIfAborted();
    const work = pending.get(group);
    let unchangedEvidence = !work;
    if (work) {
      if (!checkpoint.state.groups[group].section) await emit({ type: "state", group, state: "searching" });
      const result = await work;
      if (result.status === "ready" && (result.passages.length > 14 || result.passages.some(p => p.source.kind !== group)
        || new Set(result.passages.map(p => p.id)).size !== result.passages.length)) throw new Error("invalid_patient_research_result");
      const previous = checkpoint.research[group];
      // A failed/empty recovery does not revoke earlier eligible evidence. Keep it
      // available to the independent final check and the next explicit continuation.
      if (previous?.status === "ready" && previous.passages.length && (result.status === "failed" || !result.passages.length)) {
        checkpoint.retryGroups = [...new Set([...(checkpoint.retryGroups ?? []), group])];
        if (result.status === "failed" && ["source_failed", "source_unavailable"].includes(result.reason)) checkpoint.research[group] = { ...previous, searchOutcome: "search_failed" };
        await needsAttention(group, result.status === "failed" ? result.reason : "insufficient_evidence");
        continue;
      }
      unchangedEvidence = result.status === "ready" && previous?.status === "ready"
        && JSON.stringify(result.passages) === JSON.stringify(previous.passages);
      checkpoint.retryGroups = (checkpoint.retryGroups ?? []).filter(g => g !== group);
      checkpoint.research[group] = clone(result); checkpoint.evidenceRevision++;
    }
    const result = checkpoint.research[group];
    if (!result || result.status === "failed") {
      await needsAttention(group, result?.reason ?? "source_failed"); continue;
    }
    if (!await deps.revalidate(result.passages, deps.signal)) {
      if (deps.stableCommits && checkpoint.state.groups[group].section) {
        await needsAttention(group, "source_unavailable"); await emit({ type: "pause", reason: "source_unavailable" }); return checkpoint;
      }
      if (checkpoint.state.groups[group].section) await emit({ type: "withdraw", group, revision: checkpoint.state.groups[group].revision + 1, reason: "evidence_changed" });
      await needsAttention(group, "evidence_changed"); continue;
    }
    if (!result.passages.length) { await emit({ type: "state", group, state: "empty" }); continue; }
    if (checkpoint.state.groups[group].section && unchangedEvidence) {
      // A progress notice can leave an unchanged checked section in attention state.
      // Re-publish its checked revision in order; final combined checking still runs.
      if (checkpoint.state.groups[group].state !== "ready"
        && groups.slice(0, groups.indexOf(group)).every(g => ["ready", "empty"].includes(checkpoint.state.groups[g].state))) {
        await emit({ type: "section", section: checkpoint.state.groups[group].section!, revision: checkpoint.state.groups[group].revision + 1, evidence_revision: checkpoint.evidenceRevision });
      }
      continue;
    }
    // A manual retry may return different evidence. Recheck rather than silently
    // carrying an old explanation forward under a new evidence revision.
    if (checkpoint.state.groups[group].section) await emit({ type: "withdraw", group, revision: checkpoint.state.groups[group].revision + 1, reason: "evidence_changed" });
    // An unresolved earlier group must not be replaced with a terminal empty placeholder.
    if (groups.slice(0, groups.indexOf(group)).some(g => !["ready", "empty"].includes(checkpoint.state.groups[g].state))) continue;
    await emit({ type: "state", group, state: "checking" });
    let section: RichSection;
    try { section = await deps.checkSection(group, snapshot(), deps.signal); }
    catch (error) {
      deps.signal.throwIfAborted();
      if (error instanceof Error && ["ModelReconciliationRequired", "ResearchStorageError"].includes(error.name)) throw error;
      await needsAttention(group, "explanation_failed"); continue;
    }
    if (!validRichSection(section) || section.group !== group || section.outcome !== "ready") {
      await needsAttention(group, "explanation_failed"); continue;
    }
    await emit({ type: "section", section, revision: checkpoint.state.groups[group].revision + 1, evidence_revision: checkpoint.evidenceRevision });
  }
  const shown = groups.flatMap(g => checkpoint.state.groups[g].section ? [checkpoint.state.groups[g].section!] : []);
  // The final checker, not retrieval, decides whether a failed optional group is necessary.
  const review = await deps.finalReview(snapshot(), shown, deps.signal, saveResearch);
  if (review.status === "needs_attention") {
    if (review.requiredRequirementIds !== undefined && !validPatientRetryRequirements(review.requiredRequirementIds, checkpoint.frame)) throw Error("invalid_patient_retry_scope");
    if (review.requiredRequirementIds !== undefined) checkpoint.retryRequirementIds = [...review.requiredRequirementIds];
    for (const group of review.withdrawGroups) if (checkpoint.state.groups[group].section) {
      const notices = review.integrityNotices?.filter(n => n.group === group), integrity = notices?.length ? { group, reason: notices[0].reason,
        claimIndexes: [...new Set(notices.flatMap(n => n.claimIndexes))], sourceIds: [...new Set(notices.flatMap(n => n.sourceIds))] } : undefined;
      await emit({ type: "withdraw", group, revision: checkpoint.state.groups[group].revision + 1, reason: review.reason, ...(integrity ? { integrity } : {}) });
    }
    for (const group of review.requiredGroups) {
      // Continue must retry an actual evidence gap, even if an earlier search
      // finished successfully but found nothing sufficient. Checked display
      // sections stay separate until the new revision is checked.
      if (deps.stableCommits && checkpoint.state.groups[group].section) continue;
      if (review.reason !== "explanation_failed") checkpoint.retryGroups = [...new Set([...(checkpoint.retryGroups ?? []), group])];
      await needsAttention(group, review.reason);
    }
    await emit({ type: "pause", reason: review.reason }); return checkpoint;
  }
  if (review.updatedEvidence) {
    if (review.updatedEvidence.length > 14 || !await deps.revalidate(review.updatedEvidence, deps.signal)) {
      await emit({ type: "pause", reason: "evidence_changed" }); return checkpoint;
    }
    checkpoint.evidenceRevision++;
    for (const group of groups) {
      const previous = checkpoint.research[group];
      checkpoint.research[group] = { status: "ready", passages: clone(review.updatedEvidence.filter(p => p.source.kind === group)),
        ...(previous?.status === "ready" && previous.searchOutcome ? { searchOutcome: previous.searchOutcome } : {}) };
    }
  }
  // The final audit may replace earlier wording after inspecting new context and evidence.
  for (const group of groups) {
    const finalSection = review.sections?.find(s => s.group === group);
    if (!finalSection) continue;
    if (!validRichSection(finalSection, input.language)) throw new Error("invalid_patient_final_section");
    const unchanged = JSON.stringify(finalSection) === JSON.stringify(checkpoint.state.groups[group].section);
    if (deps.stableCommits && checkpoint.state.groups[group].section && !unchanged) { await emit({ type: "pause", reason: "explanation_failed" }); return checkpoint; }
    if (unchanged && checkpoint.state.groups[group].state === "ready") continue;
    if (!unchanged && checkpoint.state.groups[group].section) await emit({ type: "withdraw", group, revision: checkpoint.state.groups[group].revision + 1, reason: "evidence_changed" });
    if (finalSection.outcome === "ready") await emit({ type: "section", section: finalSection, revision: checkpoint.state.groups[group].revision + 1, evidence_revision: checkpoint.evidenceRevision });
    else if (!finalSection.claims.length && !finalSection.sources.length && ["no_direct_evidence", "unavailable", "search_failed", "timeout"].includes(finalSection.outcome)) {
      await emit({ type: "state", group, state: "empty", ...(finalSection.outcome === "unavailable" ? { reason: "source_unavailable" as const } : ["search_failed", "timeout"].includes(finalSection.outcome) ? { reason: "source_failed" as const } : {}) });
    } else { await needsAttention(group, "explanation_failed"); }
  }
  // Never finish merely because the final checker returned yes while a section is unresolved.
  if (groups.some(g => !["ready", "empty"].includes(checkpoint.state.groups[g].state))) {
    await emit({ type: "pause", reason: "insufficient_evidence" }); return checkpoint;
  }
  if (review.guide !== undefined && !validRichGuidance(review.guide, input.language, snapshot().passages.map(p => p.id))) throw new Error("invalid_patient_guidance");
  await emit({ type: "section", section: review.summary, revision: checkpoint.state.groups.summary.revision + 1, evidence_revision: checkpoint.evidenceRevision });
  const sections = RICH_ORDER.map(g => checkpoint.state.groups[g].section ?? review.sections?.find(s => s.group === g) ?? { group: g, outcome: "no_direct_evidence" as const, claims: [], sources: [] });
  checkpoint.retryGroups = [];
  checkpoint.retryRequirementIds = [];
  await emit({ type: "terminal", status: "complete", answer: { version: 4, language: input.language, review: "automatic", complete: true, sections, guide: review.guide } });
  return checkpoint;
}
