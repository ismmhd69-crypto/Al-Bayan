import { RICH_ORDER, validRichSection, type RichGroup, type RichSection } from "./rich-answer";

export type ResearchStage = "searching_quran" | "streaming_quran" | "searching_sunnah" | "streaming_sunnah" | "searching_scholar" | "streaming_scholar" | "streaming_summary" | "complete";
export type IntegrityNotice = { group: RichGroup; claimIndexes: number[]; sourceIds: string[]; reason: "source_changed" | "unsupported_claim" | "context_changed" };
export type PublicationEvent =
  | { type: "group_status"; group: RichGroup; status: "searching" | "checking" | "empty" | "blocked"; section?: RichSection }
  | { type: "section_committed"; section: RichSection; commit_id: string; evidence_snapshot: string }
  | { type: "integrity_notice"; notice: IntegrityNotice };
export type PublicationSlot = { status: "searching" | "checking" | "ready" | "empty" | "blocked"; section?: RichSection; commitId?: string; snapshot?: string; notices: IntegrityNotice[] };
export type PublicationState = { groups: Record<RichGroup, PublicationSlot> };
export const emptyPublication = (): PublicationState => ({ groups: { quran: { status: "searching", notices: [] }, hadith: { status: "searching", notices: [] }, scholar: { status: "searching", notices: [] }, summary: { status: "searching", notices: [] } } });
export const publicationSections = (state: PublicationState) => RICH_ORDER.flatMap(g => state.groups[g].section ? [state.groups[g].section!] : []);
const hash = (v: unknown) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);

/** Immutable checked publications; unfinished work never overwrites a commit. */
export function reducePublication(state: PublicationState, event: PublicationEvent): PublicationState {
  const group = event.type === "section_committed" ? event.section?.group : event.type === "integrity_notice" ? event.notice?.group : event.group;
  if (!RICH_ORDER.includes(group)) throw Error("invalid_publication_group");
  const old = state.groups[group];
  let slot: PublicationSlot;
  if (event.type === "section_committed") {
    if (!validRichSection(event.section) || event.section.outcome !== "ready" || !hash(event.commit_id) || !hash(event.evidence_snapshot)) throw Error("invalid_publication_commit");
    if (old.commitId) {
      if (old.commitId !== event.commit_id || old.snapshot !== event.evidence_snapshot || JSON.stringify(old.section) !== JSON.stringify(event.section)) throw Error("publication_replacement_forbidden");
      return state;
    }
    if (group === "summary" && RICH_ORDER.slice(0, 3).some(g => !["ready", "empty", "blocked"].includes(state.groups[g].status))) throw Error("summary_before_resolved_sources");
    slot = { ...old, status: "ready", section: structuredClone(event.section), commitId: event.commit_id, snapshot: event.evidence_snapshot };
  } else if (event.type === "group_status") {
    if (!["searching", "checking", "empty", "blocked"].includes(event.status)) throw Error("invalid_publication_status");
    if (old.commitId) return state;
    if (old.status === "checking" && event.status === "searching") return state;
    if (event.section && (!validRichSection(event.section) || event.section.group !== group || event.section.outcome === "ready" || event.section.claims.length || event.section.sources.length)) throw Error("invalid_empty_publication");
    slot = { ...old, status: event.status, ...(event.section ? { section: structuredClone(event.section) } : {}) };
  } else {
    const n = event.notice;
    if (!old.commitId || !old.section || !["source_changed", "unsupported_claim", "context_changed"].includes(n.reason)
      || !Array.isArray(n.claimIndexes) || !Array.isArray(n.sourceIds) || !n.claimIndexes.length && !n.sourceIds.length
      || n.claimIndexes.some(i => !Number.isInteger(i) || i < 0 || i >= old.section!.claims.length)
      || n.sourceIds.some(id => !old.section!.sources.some(s => s.id === id))) throw Error("invalid_publication_integrity_notice");
    if (old.notices.some(prior => JSON.stringify(prior) === JSON.stringify(n))) return state;
    slot = { ...old, status: "blocked", notices: [...old.notices, structuredClone(n)] };
  }
  return { groups: { ...state.groups, [group]: slot } };
}

export function presentationStage(state: PublicationState, revealed: Partial<Record<RichGroup, boolean>>, complete: boolean): ResearchStage {
  for (const group of RICH_ORDER) {
    const slot = state.groups[group];
    if (slot.commitId && !revealed[group]) return group === "hadith" ? "streaming_sunnah" : `streaming_${group}` as ResearchStage;
    if (!slot.commitId && !["empty", "blocked"].includes(slot.status)) return group === "hadith" ? "searching_sunnah" : group === "summary" ? "streaming_summary" : `searching_${group}` as ResearchStage;
  }
  return complete ? "complete" : "streaming_summary";
}
