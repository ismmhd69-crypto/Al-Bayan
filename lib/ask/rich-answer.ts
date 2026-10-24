import type { Locale } from "@/lib/i18n";
import type { Evidence } from "./core";
import type { Claim } from "./checks";
import { inLanguage, sourceKindMismatch, isSingleSentence } from "./checks";
import { isRealVerse } from "@/lib/sources/quran-meta";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { validRelatedVideos, type RelatedVideos } from "./related-videos";

export const RICH_ORDER = ["quran", "hadith", "scholar", "summary"] as const;
export type RichGroup = typeof RICH_ORDER[number];
export type GroupOutcome = "ready" | "no_direct_evidence" | "unavailable" | "timeout" | "search_failed" | "failed_check" | "not_checked";
export type DisplayTranslation = { status: "ready"; text: string; language: "en" | "de"; origin: "ai" | "human"; original: string; originalHash: string; reviewer?: string; reviewedAt?: string }
  | { status: "unavailable" | "lookup_failed" | "not_checked" | "rejected" };
export type RichSource = { id: string; evidence: Evidence; role?: "direct" | "background" | "limited_example"; requirementIds?: string[]; explanationRequirementIds?: string[]; displayTranslation?: DisplayTranslation };
export type RichSection = { group: RichGroup; outcome: GroupOutcome; omitted?: true; claims: Claim[]; sources: RichSource[]; searchOutcome?: "unavailable" | "timeout" | "search_failed" };
export type RichGuidance = { text: string; refs: string[]; kind: "learning" | "sourced_instruction" };
export type RichGuide = "ask_specific_followup" | "clarify_application" | "study_evidence" | "learn_steps" | RichGuidance;
type RichBase = { language: Locale; review: "automatic"; sections: RichSection[]; complete: true };
export type RichAnswer = RichBase & ({ version: 3; guide: Exclude<RichGuide, RichGuidance>; videos?: never } | { version: 4; guide?: RichGuidance; videos?: RelatedVideos });
export type RichProgress = "understanding" | "searching" | "checking_evidence" | "writing_quran" | "checking_quran" | "checking_hadith" | "checking_scholar" | "checking_remaining" | "finding_videos";
export type RichCallbacks = { onSection?: (section: RichSection) => void; onProgress?: (stage: RichProgress) => void; onWithdraw?: () => void };
export type RichFailureKind = "checker_failure" | "source_support" | "missing_qualification" | "context_needed" | "question_coverage";
export function richFailureKind(value: unknown): RichFailureKind | null {
  const r = value as { status?: string; failureKind?: RichFailureKind } | null;
  return r?.status === "incomplete" && ["checker_failure", "source_support", "missing_qualification", "context_needed", "question_coverage"].includes(r.failureKind ?? "") ? r.failureKind! : null;
}
export type RichTerminal = { status: "rich_answer"; answer: RichAnswer } | { status: "incomplete"; language: Locale; withdraw: boolean; sections?: RichSection[]; failureKind?: RichFailureKind };
export type RichEvent = { request_id: string; sequence: number } & (
  | { type: "progress"; stage: RichProgress }
  | { type: "section"; section: RichSection }
  | { type: "withdraw" }
  | { type: "terminal"; result: unknown }
);

const outcomes = ["ready", "no_direct_evidence", "unavailable", "timeout", "search_failed", "failed_check", "not_checked"];
const stages = ["understanding", "searching", "checking_evidence", "writing_quran", "checking_quran", "checking_hadith", "checking_scholar", "checking_remaining", "finding_videos"];
export function validRichGuidance(value: unknown, language: Locale, sourceIds: string[]): value is RichGuidance {
  const g = value as RichGuidance | null;
  return !!g && typeof g.text === "string" && g.text.trim().length > 0 && g.text.length <= 420 && inLanguage(g.text, language)
    && ["learning", "sourced_instruction"].includes(g.kind) && Array.isArray(g.refs) && g.refs.length <= 3
    && new Set(g.refs).size === g.refs.length && g.refs.every(id => sourceIds.includes(id))
    && (g.kind === "learning" ? g.refs.length === 0 : g.refs.length > 0);
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
    if (s.outcome !== "ready") return s.claims.length === 0 && s.sources.length === 0 && s.group !== "summary";
    if (!s.claims.length || !s.sources.length || new Set(s.sources.map(x => x.id)).size !== s.sources.length) return false;
    for (const { id, evidence: e, role, requirementIds, explanationRequirementIds, displayTranslation } of s.sources) {
      if (!e || typeof e.arabic !== "string" || !e.arabic.trim() || typeof e.url !== "string" || new URL(e.url).protocol !== "https:") return false;
      if (role !== undefined && !["direct", "background", "limited_example"].includes(role)) return false;
      if (role !== undefined && (!Array.isArray(requirementIds) || !Array.isArray(explanationRequirementIds)
        || [...requirementIds, ...explanationRequirementIds].some(id => !/^R[1-4]$/.test(id))
        || new Set(requirementIds).size !== requirementIds.length || new Set(explanationRequirementIds).size !== explanationRequirementIds.length
        || (role === "direct" ? !requirementIds.length : requirementIds.length > 0 || !explanationRequirementIds.length))) return false;
      if (displayTranslation && (e.kind !== "scholar" || !validDisplayTranslation(displayTranslation, e.arabic, language))) return false;
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
  const explanationRefs = new Set(a.sections.filter(s => s.group !== "summary").flatMap(s => Array.isArray(s.claims) ? s.claims.flatMap(c => c.refs) : []));
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
export type RichStreamState = { requestId: string | null; sequence: number; sections: RichSection[]; progress: RichProgress; withdrawn: boolean; terminal: boolean; result?: unknown };
export const emptyRichState = (): RichStreamState => ({ requestId: null, sequence: 0, sections: [], progress: "understanding", withdrawn: false, terminal: false });
export function reduceRichEvent(state: RichStreamState, event: RichEvent): RichStreamState {
  if (state.terminal || !event || !Number.isInteger(event.sequence) || event.sequence !== state.sequence + 1 || typeof event.request_id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(event.request_id)
    || (state.requestId !== null && event.request_id !== state.requestId)) throw new Error("invalid_stream_sequence");
  const next = { ...state, requestId: event.request_id, sequence: event.sequence };
  if (event.type === "progress") { if (!stages.includes(event.stage)) throw new Error("invalid_progress"); return { ...next, progress: event.stage }; }
  if (event.type === "withdraw") return { ...next, sections: [], withdrawn: true };
  if (event.type === "section") {
    if (state.withdrawn || !validRichSection(event.section) || event.section.group !== RICH_ORDER[state.sections.length]) throw new Error("invalid_section_order");
    return { ...next, sections: [...state.sections, event.section] };
  }
  if (event.type !== "terminal") throw new Error("unknown_stream_event");
  const result = event.result as { status?: string; answer?: unknown; withdraw?: unknown } | null;
  if (!result || typeof result.status !== "string") throw new Error("invalid_terminal");
  if (result.status === "rich_answer" && (state.withdrawn || !validRichAnswer(result.answer) || JSON.stringify(result.answer.sections) !== JSON.stringify(state.sections))) throw new Error("invalid_complete_answer");
  if (result.status === "incomplete" && result.withdraw === true && !state.withdrawn) return { ...next, terminal: true, sections: [], withdrawn: true, result };
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
