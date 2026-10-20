// Invented source wording and scripted verdicts. These fixtures establish behaviour, not theology.
import type { EvidencePackage } from "@/lib/ask/retrieval";
import type { RichAnswer, RichSection } from "@/lib/ask/rich-answer";
import { toEvidence, type PipelineDeps } from "@/lib/ask/core";
import { CLAIM_AUDIT_FIELDS } from "@/lib/ask/checks";
export const scholarId = "S22222222-2222-2222-2222-222222222222";
export const pack: EvidencePackage = {
  question: { language: "en", questionType: "general", subjects: ["care"], requirements: [{ id: "R1", text: "Explain care", facet: "general" }], requiredFacets: ["general"], qualifiers: [] },
  passages: [
    { id: "Q2:183", source: { kind: "quran", verse: { key: "2:183", arabic: "نص عربي تجريبي للقراءة فقط", arabicPlain: "نص تجريبي", translations: { en: "Invented source wording solely for tests", de: null }, url: "https://quran.com/2/183" } }, context: [], requirementIds: ["R1"], facets: ["general"] },
    { id: "HE9001", source: { kind: "hadith", hadith: { id: "HE9001", arabic: "نص حديث تجريبي وليس نقلا", translations: { en: "Invented hadith wording solely for tests", de: null }, collection: "agreed", numbers: { bukhari: 1904, muslim: 1151 }, gradeAr: "صحيح", attributionAr: "متفق عليه", url: "https://hadeethenc.com/en/browse/hadith/9001" } }, context: [], requirementIds: ["R1"], facets: ["general"] },
    { id: scholarId, source: { kind: "scholar", quote: { id: scholarId, scholarId: "ibn-baz", scholarName: { en: "Ibn Baz", ar: "ابن باز", de: "Ibn Baz" }, title: "عنوان تجريبي", reference: "مرجع تجريبي", arabic: "نص تجريبي مستقل عن أي فتوى حقيقية", url: "https://binbaz.org.sa/fatwas/9/test" } }, context: [], requirementIds: ["R1"], facets: ["general"] },
  ], cards: [{ id: "quran-2-183", sourceIds: ["Q2:183"], named: false }],
};
export const drafts = {
  quran: [{ text: "The Quran connects care with daily responsibility.", source_ids: ["Q2:183"], requirement_id: "R1" }],
  hadith: [{ text: "The Prophet taught people to take care with their actions.", source_ids: ["HE9001"], requirement_id: "R1" }],
  scholar: [{ text: "Ibn Baz explains this teaching with its relevant conditions.", source_ids: [scholarId], requirement_id: "R1" }],
  summary: [{ text: "Together, these sources describe care as a thoughtful responsibility.", source_ids: ["Q2:183", "HE9001", scholarId], requirement_id: "R1" }],
};
export const sections: RichSection[] = (["quran", "hadith", "scholar", "summary"] as const).map(group => ({
  group, outcome: "ready", claims: drafts[group].map(c => ({ text: c.text, refs: c.source_ids, requirementId: c.requirement_id })),
  sources: pack.passages.filter(p => drafts[group].some(c => c.source_ids.includes(p.id))).map(p => ({ id: p.id, evidence: toEvidence(p.source, "en") })),
}));
export const richAnswer: RichAnswer = { version: 3, language: "en", review: "automatic", sections, complete: true, guide: "ask_specific_followup" };
export function audit(prompt: string) {
  const request = JSON.parse(prompt);
  return {
    useful_explanation: "yes", question_checklist_complete: "yes", guidance_safe: "yes", guidance_relevant: "yes", personal_application_avoided: "yes",
    translation_checks: (request.display_translation_candidates ?? []).map((t: { source_id: string; original_hash: string }) => ({ source_id: t.source_id, original_hash: t.original_hash, faithful: "yes", complete: "yes", conditions_preserved: "yes" })),
    attribution_checks: request.claims.map((c: { claim_id: string }) => ({ claim_id: c.claim_id, verdict: "yes" })),
    requirement_coverage: request.full_answer ? request.evidence_package.question.requirements.map((r: { id: string }) => {
      const matched = request.claims.filter((c: { claim_id: string; requirement_id: string; source_ids: string[] }) => c.requirement_id === r.id && !request.summary_claim_ids.includes(c.claim_id)
        && c.source_ids.some(id => request.evidence_package.passages.some((p: { id: string; supported_requirement_ids: string[] }) => p.id === id && p.supported_requirement_ids.includes(r.id))));
      return { requirement_id: r.id, claim_ids: matched.map((c: { claim_id: string }) => c.claim_id), source_ids: [...new Set(matched.flatMap((c: { source_ids: string[] }) => c.source_ids))], fully_answered: "yes", conditions_preserved: "yes" };
    }) : [],
    claim_assessments: request.claims.map((c: { claim_id: string; source_ids: string[] }) => ({ claim_id: c.claim_id, source_ids: c.source_ids,
    ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f => [f, "yes"])), reason_codes: [], explanation: "" })),
    all_claims_consistent: "yes", complete_coverage: "yes", listed_items_complete: "yes", direct_summary: "yes", no_repetition: "yes", earlier_section_safe: "yes" };
}
export function dependencies(): PipelineDeps {
  return { writer: { id: "fake/writer", generateJson: async req => ({ status: "answer", next_step: { text: "Read the cited explanation of care and ask which condition is unclear.", kind: "learning", refs: [] }, ...Object.fromEntries(JSON.parse(req.prompt).sections_to_write.map((g: keyof typeof drafts) => [g, drafts[g]])) }) },
    verifier: { id: "fake/checker", generateJson: async req => audit(req.prompt) }, search: async () => [], getVerse: async () => undefined, neighbours: async () => [], rich: {} };
}
