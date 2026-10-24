import { isLocale, type Locale } from "@/lib/i18n";
import type { Answer } from "./core";
import { validateAnswerV2 } from "./answer-v2";
import { RICH_ORDER, validRichAnswer, validRichSection, type RichAnswer, type RichGroup, type RichSection } from "./rich-answer";

export type PatientSourceGroup = Exclude<RichGroup, "summary">;
export type PatientSectionState = "searching" | "checking" | "ready" | "empty" | "needs_attention";
export type PatientReason = "source_unavailable" | "source_failed" | "explanation_failed" | "insufficient_evidence" | "billing_uncertain" | "evidence_changed";
export type PatientEventBody =
  | { type: "prepared"; answer: Answer }
  | { type: "research_checkpoint"; revision: number; hash: string }
  | { type: "state"; group: PatientSourceGroup; state: PatientSectionState; reason?: PatientReason }
  | { type: "section"; section: RichSection; revision: number; evidence_revision: number }
  | { type: "withdraw"; group: RichGroup; revision: number; reason: PatientReason }
  | { type: "pause"; reason: PatientReason }
  | { type: "resume" }
  | { type: "terminal"; status: "complete"; answer: RichAnswer }
  | { type: "terminal"; status: "cancelled" | "failed" };
export type PatientEvent = PatientEventBody & { version: 2; job_id: string; sequence: number };
export type PatientSlot = { state: PatientSectionState; revision: number; evidenceRevision: number; section?: RichSection; reason?: PatientReason };
export type PatientState = { version: 2; jobId: string; language: Locale; sequence: number; status: "working" | "paused" | "complete" | "cancelled" | "failed"; groups: Record<RichGroup, PatientSlot>; answer?: RichAnswer; prepared?: Answer;
  researchRevision?: number; researchHash?: string };
const groups = ["quran", "hadith", "scholar"] as const;
const states = ["searching", "checking", "ready", "empty", "needs_attention"];
const reasons: PatientReason[] = ["source_unavailable", "source_failed", "explanation_failed", "insufficient_evidence", "billing_uncertain", "evidence_changed"];
const revision = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
const jobId = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);

export function emptyPatientState(id: string, language: Locale): PatientState {
  if (!jobId(id) || !isLocale(language)) throw new Error("invalid_patient_identity");
  return { version: 2, jobId: id, language, sequence: 0, status: "working", groups: Object.fromEntries(RICH_ORDER.map(group => [group, { state: "searching", revision: 0, evidenceRevision: 0 }])) as PatientState["groups"] };
}

/** Strict v2 reducer. The legacy single-delivery stream is deliberately unchanged. */
export function reducePatientEvent(state: PatientState, event: PatientEvent): PatientState {
  if (event?.version !== 2 || event.job_id !== state.jobId || !Number.isSafeInteger(event.sequence)
    || event.sequence !== state.sequence + 1 || ["complete", "cancelled", "failed"].includes(state.status)) throw new Error("invalid_patient_event_identity");
  const next: PatientState = { ...state, sequence: event.sequence, groups: Object.fromEntries(RICH_ORDER.map(g => [g, { ...state.groups[g] }])) as PatientState["groups"] };
  if (event.type === "resume") {
    if (state.status !== "paused") throw new Error("patient_not_paused");
    next.status = "working"; return next;
  }
  if (event.type === "pause") {
    if (state.status !== "working" || !reasons.includes(event.reason)) throw new Error("invalid_patient_pause");
    next.status = "paused"; return next;
  }
  if (state.status !== "working") throw new Error("patient_requires_resume");
  if (event.type === "research_checkpoint") {
    if (event.revision !== (state.researchRevision ?? 0) + 1 || !/^[a-f0-9]{64}$/.test(event.hash)) throw Error("invalid_patient_research_checkpoint");
    next.researchRevision = event.revision; next.researchHash = event.hash; return next;
  }
  if (event.type === "prepared") {
    const answer = event.answer?.v2;
    if (!answer || answer.origin !== "prepared" || answer.review === "automatic" || answer.language !== state.language
      || RICH_ORDER.some(g => state.groups[g].section) || !validateAnswerV2(answer, { origin: "prepared", review: answer.review }).ok) throw new Error("invalid_patient_prepared_answer");
    next.prepared = event.answer; next.status = "complete"; return next;
  }
  if (event.type === "state") {
    if (!groups.includes(event.group) || !states.includes(event.state) || event.state === "ready"
      || event.reason !== undefined && !reasons.includes(event.reason)) throw new Error("invalid_patient_section_state");
    const slot = next.groups[event.group];
    // Working/attention notices never silently discard independently checked material.
    slot.state = event.state; slot.reason = event.reason;
    if (event.state === "empty" && slot.section) throw new Error("patient_requires_withdrawal");
    return next;
  }
  if (event.type === "section") {
    const section = event.section;
    if (!validRichSection(section) || section.outcome !== "ready" || !revision(event.revision) || !revision(event.evidence_revision)) throw new Error("invalid_patient_section");
    const group = section.group, previous = state.groups[group];
    if (event.revision !== previous.revision + 1 || event.evidence_revision < previous.evidenceRevision) throw new Error("invalid_patient_revision");
    if (RICH_ORDER.slice(0, RICH_ORDER.indexOf(group)).some(g => !["ready", "empty"].includes(state.groups[g].state))) throw new Error("invalid_patient_section_order");
    next.groups[group] = { state: "ready", revision: event.revision, evidenceRevision: event.evidence_revision, section };
    // A changed source explanation invalidates the old final synthesis.
    if (group !== "summary") next.groups.summary = { ...next.groups.summary, state: "checking", section: undefined };
    return next;
  }
  if (event.type === "withdraw") {
    if (!RICH_ORDER.includes(event.group) || !revision(event.revision) || !reasons.includes(event.reason)) throw new Error("invalid_patient_withdrawal");
    const slot = next.groups[event.group];
    if (event.revision !== slot.revision + 1) throw new Error("invalid_patient_revision");
    next.groups[event.group] = { ...slot, revision: event.revision, state: "needs_attention", section: undefined, reason: event.reason };
    next.groups.summary = { ...next.groups.summary, state: "needs_attention", section: undefined, reason: "evidence_changed" };
    return next;
  }
  if (event.type !== "terminal" || !["complete", "cancelled", "failed"].includes(event.status)) throw new Error("invalid_patient_terminal");
  if (event.status === "complete") {
    if (!validRichAnswer(event.answer) || event.answer.language !== state.language
      || RICH_ORDER.some(g => !["ready", "empty"].includes(state.groups[g].state))) throw new Error("invalid_patient_completion");
    for (const section of event.answer.sections) {
      const slot = state.groups[section.group];
      if (slot.state === "ready" && JSON.stringify(slot.section) !== JSON.stringify(section)) throw new Error("patient_completion_changed_section");
      const emptyOutcome = slot.reason === "source_unavailable" ? ["unavailable"] : slot.reason === "source_failed" ? ["search_failed", "timeout"] : ["no_direct_evidence"];
      if (slot.state === "empty" && (section.claims.length || section.sources.length || !emptyOutcome.includes(section.outcome))) throw new Error("invalid_patient_empty_section");
    }
    next.answer = event.answer;
  }
  next.status = event.status; return next;
}
