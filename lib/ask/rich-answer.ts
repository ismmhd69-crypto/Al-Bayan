import type { Locale } from "@/lib/i18n";
import type { Evidence } from "./core";
import type { Claim } from "./checks";
import { inLanguage, sourceKindMismatch, isSingleSentence } from "./checks";
import { isRealVerse } from "@/lib/sources/quran-meta";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { HADITH_LIBRARY_ID } from "./ids";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { validRelatedVideos, type RelatedVideos } from "./related-videos";
import { emptyPublication, reducePublication, publicationSections, type PublicationState, type PublicationEvent, type IntegrityNotice } from "./publication";

export const RICH_ORDER = ["quran", "hadith", "scholar", "summary"] as const;
export type RichGroup = typeof RICH_ORDER[number];
export type GroupOutcome = "ready" | "no_direct_evidence" | "unavailable" | "timeout" | "search_failed" | "failed_check" | "not_checked";
export type DisplayTranslation = { status: "ready"; text: string; language: "en" | "de"; origin: "ai" | "human"; original: string; originalHash: string; reviewer?: string; reviewedAt?: string }
  | { status: "unavailable" | "lookup_failed" | "not_checked" | "rejected" };
export type RichSource = { id: string; evidence: Evidence; role?: "direct" | "background" | "limited_example"; requirementIds?: string[]; explanationRequirementIds?: string[]; displayTranslation?: DisplayTranslation };
export type VerifiedQuranCard = { id: string; group: "quran"; sources: RichSource[]; evidenceSnapshot: string };
/** Shape and approved identity checks only. Server selection establishes context safety. */
export function validVerifiedQuranCard(value: unknown): value is VerifiedQuranCard {
  try {
    const card = value as VerifiedQuranCard;
    if (!card || card.group !== "quran" || !/^[a-f0-9]{64}$/.test(card.id) || !/^[a-f0-9]{64}$/.test(card.evidenceSnapshot)
      || !Array.isArray(card.sources) || !card.sources.length || card.sources.length > 8 || new Set(card.sources.map(s => s.id)).size !== card.sources.length) return false;
    return card.sources.every(({ id, evidence: e, role, requirementIds, explanationRequirementIds }) => {
      if (e?.kind !== "quran" || id !== `Q${e.key}` || !/^\d{1,3}:\d{1,3}$/.test(e.key)
        || !isRealVerse(Number(e.key.split(":")[0]), Number(e.key.split(":")[1])) || e.url !== `https://quran.com/${e.key.replace(":", "/")}`
        || typeof e.arabic !== "string" || !e.arabic.trim() || /[<>]/.test(e.arabic)
        || e.translation !== null && (typeof e.translation !== "string" || /[<>]/.test(e.translation))
        || e.translationName !== null && typeof e.translationName !== "string") return false;
      if (!role || !["direct", "background", "limited_example"].includes(role) || !Array.isArray(requirementIds) || !Array.isArray(explanationRequirementIds)
        || [...requirementIds, ...explanationRequirementIds].some(r => !/^R[1-4]$/.test(r))) return false;
      return role === "direct" ? requirementIds.length > 0 : requirementIds.length === 0 && explanationRequirementIds.length > 0;
    });
  } catch { return false; }
}
export type SourceFailureStage = "source_search" | "verse_lookup" | "context_lookup" | "evidence_selection" | "explanation_check" | "source_revalidation";
export type RichSection = { group: RichGroup; outcome: GroupOutcome; presentation?: "originals"; omitted?: true; claims: Claim[]; sources: RichSource[]; searchOutcome?: "unavailable" | "timeout" | "search_failed"; searchFailureStage?: SourceFailureStage };
export type RichGuidance = { text: string; refs: string[]; kind: "learning" | "sourced_instruction" };
export type RichGuide = "ask_specific_followup" | "clarify_application" | "study_evidence" | "learn_steps" | RichGuidance;
type RichBase = { language: Locale; review: "automatic"; sections: RichSection[]; complete: true };
export type RichAnswer = RichBase & ({ version: 3; guide: Exclude<RichGuide, RichGuidance>; videos?: never } | { version: 4; guide?: RichGuidance; videos?: RelatedVideos });
export type RichProgress = "understanding" | "searching" | "checking_evidence" | "writing_quran" | "checking_quran" | "checking_hadith" | "checking_scholar" | "checking_remaining" | "correcting_summary" | "finding_videos" | "retrying_selection";
export type RichCallbacks = { progressive?: boolean; stable?: boolean; onIntegrity?: (notice: IntegrityNotice) => void; onGroupStatus?: (group: RichGroup, status: "searching" | "checking") => void; onCard?: (card: VerifiedQuranCard) => void; onCardWithdraw?: (id: string) => void; onSection?: (section: RichSection, evidenceSnapshot?: string) => void; onProgress?: (stage: RichProgress) => void; onWithdraw?: (group?: RichGroup) => void };
export type RichFailureKind = "selection_failure" | "source_revalidation_unavailable" | "checker_failure" | "source_support" | "missing_qualification" | "context_needed" | "question_coverage" | "summary_provider_rejection" | "summary_timeout" | "writer_failure" | "checkpoint_incompatible" | "wording_rejected" | "spending_limit" | "billing_uncertain" | "cancelled" | "connection_interrupted" | "transport_failure" | "research_running";
export function richFailureKind(value: unknown): RichFailureKind | null {
  const r = value as { status?: string; failureKind?: RichFailureKind } | null;
  return r?.status === "incomplete" && ["selection_failure", "source_revalidation_unavailable", "checker_failure", "source_support", "missing_qualification", "context_needed", "question_coverage", "summary_provider_rejection", "summary_timeout", "writer_failure", "checkpoint_incompatible", "wording_rejected", "spending_limit", "billing_uncertain", "cancelled", "connection_interrupted", "transport_failure", "research_running"].includes(r.failureKind ?? "") ? r.failureKind! : null;
}
export type RichTerminal = { status: "rich_answer"; answer: RichAnswer } | { status: "incomplete"; language: Locale; withdraw: boolean; sections?: RichSection[]; failureKind?: RichFailureKind };
export type RichEvent = { request_id: string; sequence: number; version?: 2 | 3 } & (
  | { type: "continuation"; continuation: ResearchContinuation }
  | { type: "progress"; stage: RichProgress }
  | { type: "section"; section: RichSection }
  | { type: "section_update"; section: RichSection; revision: number; evidence_snapshot: string }
  | { type: "withdraw_group"; group: RichGroup; revision: number }
  | { type: "source_card"; card: VerifiedQuranCard; revision: number }
  | { type: "withdraw_card"; id: string; revision: number }
  | { type: "withdraw" }
  | { type: "terminal"; result: unknown }
  | PublicationEvent
);

const outcomes = ["ready", "no_direct_evidence", "unavailable", "timeout", "search_failed", "failed_check", "not_checked"];
const stages = ["understanding", "searching", "checking_evidence", "writing_quran", "checking_quran", "checking_hadith", "checking_scholar", "checking_remaining", "correcting_summary", "finding_videos", "retrying_selection"];
export function validRichGuidance(value: unknown, language: Locale, sourceIds: string[]): value is RichGuidance {
  const g = value as RichGuidance | null;
  return !!g && typeof g.text === "string" && g.text.trim().length > 0 && g.text.length <= 420 && inLanguage(g.text, language)
    && ["learning", "sourced_instruction"].includes(g.kind) && Array.isArray(g.refs) && g.refs.length <= 3
    && new Set(g.refs).size === g.refs.length && g.refs.every(id => sourceIds.includes(id))
    && (g.kind === "learning" ? g.refs.length === 0 : g.refs.length > 0);
}
/** Scholar quotes and stored Sunnah.com hadith carry a checked display translation; Quran and HadeethEnc bring their own. */
export function hasDisplayTranslation(source: Pick<RichSource, "id" | "evidence">): boolean {
  return source.evidence.kind === "scholar" || source.evidence.kind === "hadith" && HADITH_LIBRARY_ID.test(source.id);
}
export function validDisplayTranslation(t: DisplayTranslation, original: string, language?: Locale): boolean {
  if (t.status !== "ready") return ["unavailable", "lookup_failed", "not_checked", "rejected"].includes(t.status);
  return typeof t.text === "string" && t.text.trim().length > 0 && t.text.length <= 16000
    && !/<\/?[a-z][^>]*>|&#?\w+;/i.test(t.text)
    && ["ai", "human"].includes(t.origin) && ["en", "de"].includes(t.language) && (!language || t.language === language)
    && t.original === original && /^[a-f0-9]{64}$/.test(t.originalHash) && inLanguage(t.text, t.language);
}
// Structural/source checks do not replace the server's independent claim audit.
export function validRichSection(value: unknown, language?: Locale): value is RichSection {
  try {
    const s = value as RichSection;
    if (!s || !RICH_ORDER.includes(s.group) || !outcomes.includes(s.outcome) || !Array.isArray(s.claims) || !Array.isArray(s.sources) || s.sources.length > 20 || s.claims.length > (s.group === "summary" ? 4 : 8)) return false;
    if (s.omitted !== undefined && (s.omitted !== true || s.group === "summary" || s.outcome !== "not_checked" || s.claims.length || s.sources.length)) return false;
    if (s.searchOutcome !== undefined && !["unavailable", "timeout", "search_failed"].includes(s.searchOutcome)) return false;
    if (s.searchFailureStage !== undefined && !["source_search", "verse_lookup", "context_lookup", "evidence_selection", "explanation_check", "source_revalidation"].includes(s.searchFailureStage)) return false;
    if (s.outcome !== "ready") return s.claims.length === 0 && s.sources.length === 0 && s.group !== "summary";
    if (s.presentation !== undefined && (s.presentation !== "originals" || s.group === "summary" || s.claims.length > 0)) return false;
    if ((!s.claims.length && s.presentation !== "originals") || !s.sources.length || new Set(s.sources.map(x => x.id)).size !== s.sources.length) return false;
    if (s.presentation === "originals" && s.sources.some(x => x.evidence.kind !== s.group)) return false;
    for (const { id, evidence: e, role, requirementIds, explanationRequirementIds, displayTranslation } of s.sources) {
      if (!e || typeof e.arabic !== "string" || !e.arabic.trim() || typeof e.url !== "string" || new URL(e.url).protocol !== "https:") return false;
      if (role !== undefined && !["direct", "background", "limited_example"].includes(role)) return false;
      if (role !== undefined && (!Array.isArray(requirementIds) || !Array.isArray(explanationRequirementIds)
        || [...requirementIds, ...explanationRequirementIds].some(id => !/^R[1-4]$/.test(id))
        || new Set(requirementIds).size !== requirementIds.length || new Set(explanationRequirementIds).size !== explanationRequirementIds.length
        || (role === "direct" ? !requirementIds.length : requirementIds.length > 0 || !explanationRequirementIds.length))) return false;
      if (displayTranslation && (!hasDisplayTranslation({ id, evidence: e }) || !validDisplayTranslation(displayTranslation, e.arabic, language))) return false;
      if (e.kind === "quran") {
        if (id !== `Q${e.key}` || !/^\d{1,3}:\d{1,3}$/.test(e.key) || !isRealVerse(Number(e.key.split(":")[0]), Number(e.key.split(":")[1])) || e.url !== `https://quran.com/${e.key.replace(":", "/")}` || (e.translation !== null && typeof e.translation !== "string") || (e.translationName !== null && typeof e.translationName !== "string")) return false;
      } else if (e.kind === "hadith") {
        if (id !== e.key || !hadithAllowed({ ...e, id: e.key, translations: { en: null, de: null } }) || (e.translation !== null && typeof e.translation !== "string") || ![null, "en", "de"].includes(e.translationLanguage)) return false;
        if (id.startsWith("HE") && (!/^https:\/\/hadeethenc\.com\/(?:[a-z]{2}\/)?browse\/hadith\/\d+$/.test(e.url) || !e.url.endsWith(`/${id.slice(2)}`))) return false;
      } else if (e.kind === "scholar") {
        if (id !== e.key || typeof e.scholarName !== "string" || !e.scholarName.trim() || typeof e.reference !== "string" || !scholarQuoteAllowed({ ...e, id: e.key, scholarName: { en: e.scholarName, ar: e.scholarName, de: e.scholarName } })) return false;
      } else return false;
    }
    return s.claims.every(c => typeof c.text === "string" && c.text.length > 0 && c.text.length <= 300 && isSingleSentence(c.text)
      && (!language || inLanguage(c.text, language)) && /^R[1-4]$/.test(c.requirementId ?? "")
      && Array.isArray(c.refs) && c.refs.length > 0 && c.refs.length <= 3 && !sourceKindMismatch(c.text, c.refs)
      && c.refs.every(id => s.sources.some(source => source.id === id))
      && (s.group === "summary" || c.refs.some(id => s.sources.some(source => source.id === id && source.evidence.kind === s.group))));
  } catch { return false; }
}

export function validRichAnswer(value: unknown): value is RichAnswer {
  try {
  const a = value as RichAnswer;
  if (!a || !Array.isArray(a.sections) || a.sections.some(s => !s || !Array.isArray(s.sources))) return false;
  const explanationRefs = new Set(a.sections.filter(s => s.group !== "summary").flatMap(s => s.presentation === "originals" ? s.sources.map(x => x.id) : Array.isArray(s.claims) ? s.claims.flatMap(c => c.refs) : []));
  return !!a && [3, 4].includes(a.version) && ["en", "ar", "de"].includes(a.language) && a.review === "automatic" && a.complete === true
    && (a.videos === undefined || a.version === 4 && validRelatedVideos(a.videos))
    && (a.version === 3 ? ["ask_specific_followup", "clarify_application", "study_evidence", "learn_steps"].includes(a.guide)
      : a.guide === undefined || validRichGuidance(a.guide, a.language, a.sections?.flatMap(s => s.sources.map(x => x.id)) ?? []))
    && Array.isArray(a.sections) && a.sections.length === 4 && a.sections.every((s, i) => validRichSection(s, a.language) && s.group === RICH_ORDER[i])
    && a.sections[3].outcome === "ready" && (a.version === 4 || a.sections.every(s => s.outcome !== "failed_check" && s.outcome !== "not_checked"))
    && (a.version === 3 || a.sections.every(s => s.sources.every(x => !!x.role && Array.isArray(x.requirementIds) && Array.isArray(x.explanationRequirementIds))))
    && (a.version === 3 || a.sections.filter(s => s.group === "summary").every(s => s.claims.every(c => c.refs.every(ref => explanationRefs.has(ref))))
      && (a.guide === undefined || a.guide.refs.every(ref => explanationRefs.has(ref))))
    && a.sections.reduce((n, s) => n + s.claims.length, 0) <= 32;
  } catch { return false; }
}

// This state is deliberately separate from a completed/approved answer. It is never saved.
export type ResearchContinuation = { token: string; remaining: number; expires: number; available: boolean; reason?: "expired" | "busy" | "limit" | "billing_uncertain" | "cancelled";
  /** The owner's session finished with an approved answer: asking the same question again reuses it after rechecking sources. */
  approved?: boolean };
export function validResearchContinuation(value: unknown): value is ResearchContinuation {
  const c = value as ResearchContinuation;
  return !!c && typeof c.token === "string" && /^[a-f0-9]{64}$/.test(c.token) && Number.isSafeInteger(c.remaining) && c.remaining >= 0 && c.remaining <= 3
    && Number.isSafeInteger(c.expires) && c.expires > 0 && typeof c.available === "boolean"
    && (c.reason === undefined || ["expired", "busy", "limit", "billing_uncertain", "cancelled"].includes(c.reason)) && (c.approved === undefined || typeof c.approved === "boolean");
}
export type RichStreamState = { requestId: string | null; sequence: number; sections: RichSection[]; progress: RichProgress; withdrawn: boolean; terminal: boolean; result?: unknown; version?: 2 | 3; publication?: PublicationState; revisions?: Partial<Record<RichGroup, number>>; snapshots?: Partial<Record<RichGroup, string>>; cards?: VerifiedQuranCard[]; cardRevisions?: Record<string, number>; continuation?: ResearchContinuation };
export const emptyRichState = (): RichStreamState => ({ requestId: null, sequence: 0, sections: [], progress: "understanding", withdrawn: false, terminal: false });
/** Display-only merge across a manually resumed stream. Validation still happens
 * on its fresh request state; an invalidation must also remove the old visible text. */
export function mergeContinuationDisplay(previous: RichStreamState, next: RichStreamState, event: RichEvent): RichStreamState {
  if (next.version === 3) {
    let publication = previous.publication ?? emptyPublication();
    if (["section_committed", "group_status", "integrity_notice"].includes(event.type)) publication = reducePublication(publication, event as PublicationEvent);
    return { ...previous, ...next, publication, sections: publicationSections(publication) };
  }
  if (event.type === "withdraw") return { ...next, sections: [], cards: [] };
  let sections = previous.sections.filter(s => s.group !== "summary"), cards = previous.cards ?? [];
  if (event.type === "withdraw_group") {
    sections = sections.filter(s => s.group !== event.group);
    if (event.group === "quran") cards = [];
  } else if (event.type === "section_update") {
    sections = [...sections.filter(s => s.group !== event.section.group), event.section].sort((a, b) => RICH_ORDER.indexOf(a.group) - RICH_ORDER.indexOf(b.group));
    if (event.section.group === "quran" && event.section.outcome === "ready") cards = [];
  } else if (event.type === "source_card") cards = [...cards.filter(c => c.id !== event.card.id), event.card];
  else if (event.type === "withdraw_card") cards = cards.filter(c => c.id !== event.id);
  return { ...previous, ...next, sections, cards };
}
export function reduceRichEvent(state: RichStreamState, event: RichEvent): RichStreamState {
  if (event?.version === 3 || state.version === 3) return reduceStableEvent(state, event);
  if (state.terminal || !event || !Number.isInteger(event.sequence) || event.sequence !== state.sequence + 1 || typeof event.request_id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(event.request_id)
    || (state.requestId !== null && event.request_id !== state.requestId)) throw new Error("invalid_stream_sequence");
  if (event.version !== undefined && event.version !== 2 || state.version === 2 && event.version !== 2 || state.sequence > 0 && state.version === undefined && event.version === 2) throw new Error("invalid_stream_version");
  const next = { ...state, ...(event.version === 2 ? { version: 2 as const } : {}), requestId: event.request_id, sequence: event.sequence };
  if (event.type === "continuation") {
    if (event.version !== 2 || !validResearchContinuation(event.continuation)) throw new Error("invalid_continuation");
    return { ...next, continuation: event.continuation };
  }
  if (event.type === "progress") { if (!stages.includes(event.stage)) throw new Error("invalid_progress"); return state.sections.some(s => s.outcome === "ready") && event.stage === "understanding" ? next : { ...next, progress: event.stage }; }
  if (event.type === "withdraw") return { ...next, sections: [], cards: [], withdrawn: true };
  if (event.type === "source_card" || event.type === "withdraw_card") {
    if (event.version !== 2 || state.withdrawn) throw new Error("invalid_card_event");
    const id = event.type === "source_card" ? event.card?.id : event.id;
    if (!/^[a-f0-9]{64}$/.test(id) || !Number.isSafeInteger(event.revision) || event.revision !== (state.cardRevisions?.[id] ?? 0) + 1) throw new Error("invalid_card_revision");
    let cards = (state.cards ?? []).filter(c => c.id !== id);
    if (event.type === "source_card") {
      if (!validVerifiedQuranCard(event.card) || state.sections.some(s => s.group === "quran" && s.outcome === "ready")
        || cards.some(c => c.sources.some(s => event.card.sources.some(t => t.id === s.id)))) throw new Error("invalid_source_card");
      cards = [...cards, event.card];
    }
    return { ...next, cards, cardRevisions: { ...state.cardRevisions, [id]: event.revision } };
  }
  if (event.type === "section_update" || event.type === "withdraw_group") {
    if (event.version !== 2 || state.withdrawn) throw new Error("invalid_group_update");
    const group = event.type === "section_update" ? event.section?.group : event.group;
    if (!RICH_ORDER.includes(group) || !Number.isSafeInteger(event.revision) || event.revision !== (state.revisions?.[group] ?? 0) + 1) throw new Error("invalid_group_revision");
    let sections = state.sections.filter(s => s.group !== group && s.group !== "summary");
    const snapshots = { ...state.snapshots };
    delete snapshots.summary;
    if (event.type === "section_update") {
      if (!validRichSection(event.section) || !/^[a-f0-9]{64}$/.test(event.evidence_snapshot)) throw new Error("invalid_group_section");
      if (group === "summary" && RICH_ORDER.slice(0, 3).some(g => !state.sections.some(s => s.group === g))) throw new Error("summary_before_source_groups");
      if (group === "summary" && state.sections.some(s => s.group === "summary")) throw new Error("summary_requires_withdrawal");
      sections.push(event.section); snapshots[group] = event.evidence_snapshot;
    } else delete snapshots[group];
    sections.sort((a, b) => RICH_ORDER.indexOf(a.group) - RICH_ORDER.indexOf(b.group));
    const cards = group === "quran" && (event.type === "withdraw_group" || event.section.outcome === "ready") ? [] : state.cards;
    return { ...next, sections, snapshots, ...(cards ? { cards } : {}), revisions: { ...state.revisions, [group]: event.revision } };
  }
  if (event.type === "section") {
    if (event.version === 2) throw new Error("versioned_stream_requires_updates");
    if (state.withdrawn || !validRichSection(event.section) || event.section.group !== RICH_ORDER[state.sections.length]) throw new Error("invalid_section_order");
    return { ...next, sections: [...state.sections, event.section] };
  }
  if (event.type !== "terminal") throw new Error("unknown_stream_event");
  const result = event.result as { status?: string; answer?: unknown; withdraw?: unknown } | null;
  if (!result || typeof result.status !== "string") throw new Error("invalid_terminal");
  if (result.status === "rich_answer" && (state.withdrawn || !!state.cards?.length || !validRichAnswer(result.answer) || JSON.stringify(result.answer.sections) !== JSON.stringify(state.sections))) throw new Error("invalid_complete_answer");
  if (result.status === "incomplete" && result.withdraw === true && !state.withdrawn) return { ...next, terminal: true, sections: [], cards: [], withdrawn: true, result };
  return { ...next, terminal: true, result: event.result };
}

function reduceStableEvent(state: RichStreamState, event: RichEvent): RichStreamState {
  if (state.version === 3 && event.version === 3 && event.type === "section_committed" && event.request_id === state.requestId
    && Number.isSafeInteger(event.sequence) && event.sequence > 0 && event.sequence <= state.sequence
    && state.publication && reducePublication(state.publication, event) === state.publication) return state;
  if (state.terminal || event.version !== 3 || state.sequence > 0 && state.version !== 3 || !Number.isSafeInteger(event.sequence)
    || typeof event.request_id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(event.request_id)
    || state.requestId !== null && event.request_id !== state.requestId || event.sequence !== state.sequence + 1) throw Error("invalid_stable_stream_identity");
  let next: RichStreamState = { ...state, version: 3, requestId: event.request_id, sequence: event.sequence, publication: state.publication ?? emptyPublication() };
  if (["section_committed", "group_status", "integrity_notice"].includes(event.type)) {
    const publication = reducePublication(next.publication!, event as PublicationEvent);
    return { ...next, publication, sections: publicationSections(publication) };
  }
  if (event.type === "continuation") {
    if (!validResearchContinuation(event.continuation)) throw Error("invalid_continuation");
    return { ...next, continuation: event.continuation };
  }
  if (event.type === "progress") {
    if (!stages.includes(event.stage)) throw Error("invalid_progress");
    return state.sections.some(s => s.outcome === "ready") ? next : { ...next, progress: event.stage };
  }
  if (event.type !== "terminal") throw Error("unstable_event_in_stable_stream");
  const result = event.result as { status?: string; answer?: RichAnswer } | null;
  if (!result || !["rich_answer", "incomplete", "cancelled", "failed", "busy", "error", "answer", "clarify", "no_summary", "no_source", "ask_scholar", "out_of_scope"].includes(result.status ?? "")) throw Error("invalid_stable_terminal");
  if (result.status === "rich_answer" && (!validRichAnswer(result.answer) || JSON.stringify(result.answer!.sections) !== JSON.stringify(next.sections)
    || RICH_ORDER.some(g => next.publication!.groups[g].notices.length))) throw Error("invalid_stable_completion");
  return { ...next, terminal: true, result: event.result };
}

/** Incremental UTF-8/SSE decoder. Chunk boundaries can split Arabic, JSON and delimiters. */
export async function consumeRichStream(body: ReadableStream<Uint8Array>, receive: (event: RichEvent) => void) {
  const reader = body.getReader(), decoder = new TextDecoder(); let buffer = "";
  const drain = () => { let end: number; while ((end = buffer.indexOf("\n\n")) >= 0) {
    if (end > 1_000_000) throw new Error("stream_frame_too_large");
    const block = buffer.slice(0, end); buffer = buffer.slice(end + 2);
    const data = block.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trimStart()).join("\n");
    if (data) receive(JSON.parse(data));
  } if (buffer.length > 1_000_000) throw new Error("stream_frame_too_large"); };
  try { while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); drain(); }
    buffer += decoder.decode(); drain(); if (buffer.trim()) throw new Error("truncated_stream_frame");
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
