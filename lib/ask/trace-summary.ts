import { createHash } from "node:crypto";
import type { PassageForSelection, QuestionFrame } from "./retrieval";
import type { StructuredDraft } from "./checks";

const record = (raw: unknown): Record<string, unknown> => raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
export function frameSummary(frame: QuestionFrame) {
  return { language: frame.language, kind: frame.kind, question_type: frame.questionType, qualifier_count: frame.qualifiers.length,
    interpretation_count: frame.interpretations?.length ?? 0, requirements: frame.requirements.map((r) => ({ requirement_id: r.id, facet: r.facet })),
    queries: { english_query_count: (frame.searchQueries.en ?? []).length, german_query_count: (frame.searchQueries.de ?? []).length, arabic_query_count: (frame.searchQueries.ar ?? []).length }, has_arabic_queries: !!frame.searchQueries.ar?.length };
}
export function sourceSummary(candidate: PassageForSelection) {
  const source = candidate.source;
  const original = source.kind === "quran" ? source.verse.arabic : source.kind === "hadith" ? source.hadith.arabic : source.quote.arabic;
  const translations = source.kind === "quran" ? source.verse.translations : source.kind === "hadith" ? source.hadith.translations : { en: null, de: null };
  return { source_id: candidate.id, kind: source.kind, original_chars: original?.length ?? 0, english_chars: translations.en?.length ?? 0, german_chars: translations.de?.length ?? 0,
    readable: !!(original?.trim() || translations.en?.trim() || translations.de?.trim()), context_count: candidate.context.length,
    fingerprint: createHash("sha256").update(JSON.stringify([original, translations.en, translations.de])).digest("hex") };
}
export function selectionSummary(raw: unknown, frame: QuestionFrame, candidates: PassageForSelection[]) {
  const r = record(raw), assessments = Array.isArray(r.assessments) ? r.assessments.map(record) : [];
  const ids = assessments.map((a) => a.source_id);
  const direct = assessments.filter((a) => a.relevance === "direct" && a.context_safe === "yes" && Array.isArray(a.supported_requirement_ids) && a.supported_requirement_ids.length);
  return { status: r.status, coverage_decision: r.coverage, conflict: r.conflict_type ?? r.conflict, expected_count: candidates.length, actual_count: assessments.length,
    duplicate_count: ids.length - new Set(ids).size, unassessed_source_ids: candidates.filter((c) => !ids.includes(c.id)).map((c) => c.id),
    direct_count: direct.length, partial_count: assessments.filter((a) => a.relevance === "partial").length,
    unsafe_count: assessments.filter((a) => a.context_safe !== "yes").length,
    unassigned_count: assessments.filter((a) => !Array.isArray(a.supported_requirement_ids) || !a.supported_requirement_ids.length).length,
    assessments: assessments.slice(0, 40).map((a) => ({ source_id: a.source_id, source_known: candidates.some((c) => c.id === a.source_id), relevance: a.relevance, context_safe: a.context_safe, requirement_ids: a.supported_requirement_ids })),
    coverage: frame.requirements.map((point) => ({ requirement_id: point.id, direct_count: direct.filter((a) => (a.supported_requirement_ids as unknown[]).includes(point.id) && candidates.some((c) => c.id === a.source_id)).length })) };
}
export function draftSummary(answer: StructuredDraft) {
  return { simple_count: answer.directAnswer.length, list_count: answer.list.length, explanation_count: answer.explanation.length, note_count: answer.notEstablished.length,
    claims: answer.claims.map((claim, i) => ({ claim_id: `C${i + 1}`, claim_chars: claim.text.length, source_ids: claim.refs, requirement_id: claim.requirementId })),
    unique_sources: new Set(answer.claims.flatMap((claim) => claim.refs)).size };
}
export function screeningSummary(raw: unknown, answer: StructuredDraft) {
  const r = record(raw), verdicts = Array.isArray(r.verdicts) ? r.verdicts : [];
  return { expected_count: answer.claims.length, actual_count: Array.isArray(r.claim_assessments) ? r.claim_assessments.length : verdicts.length,
    claims: Array.isArray(r.claim_assessments) ? [] : answer.claims.map((claim, i) => ({ claim_id: `C${i + 1}`, source_ids: claim.refs, verdict: verdicts[i] })),
    checks: ["answers_question", "covers_facets", "fair_picture", "context_preserved", "direct_answer_complete", "listed_items_complete", "no_repetition", "not_established_ok"].map((check) => ({ check, verdict: r[check] })),
    coverage: (Array.isArray(r.requirement_verdicts) ? r.requirement_verdicts : []).map((value) => { const point = record(value); return { requirement_id: point.requirement_id, verdict: point.verdict }; }),
    assessments: (Array.isArray(r.claim_assessments) ? r.claim_assessments : []).map((value) => { const a = record(value); return { claim_id: a.claim_id, source_ids: a.source_ids,
      checks: ["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"].map((check) => ({ check, verdict: a[check] })) }; }) };
}
