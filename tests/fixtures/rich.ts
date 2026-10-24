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
    citation_checks: request.claims.map((c: { claim_id: string; claim: string; source_ids: string[] }) => ({ claim_id: c.claim_id,
      clauses: [{ text: c.claim, supported: "yes", scope_preserved: "yes", qualifiers_preserved: "yes",
        evidence: c.source_ids.map(id => ({ source_id: id, original_excerpt: request.claim_evidence.find((b: { claim_id: string }) => b.claim_id === c.claim_id).cited_originals.find((p: { id: string }) => p.id === id).arabic.slice(0, 600) })) }] })),
    consequence_checks: [],
    contribution_map: request.claims.map((c: { claim_id: string }, i: number) => ({ claim_id: c.claim_id,
      contribution: `Invented distinct test contribution ${i + 1}`, kind: (request.summary_claim_ids ?? []).includes(c.claim_id) ? "synthesis" : "explanation", adds_value: "yes", duplicates: [] })),
    useful_explanation: "yes", question_checklist_complete: "yes", guidance_safe: "yes", guidance_relevant: "yes", personal_application_avoided: "yes",
    translation_checks: (request.display_translation_candidates ?? []).map((t: { source_id: string; original_hash: string }) => ({ source_id: t.source_id, original_hash: t.original_hash, faithful: "yes", complete: "yes", conditions_preserved: "yes" })),
    attribution_checks: request.claims.map((c: { claim_id: string }) => ({ claim_id: c.claim_id, verdict: "yes" })),
    requirement_coverage: request.full_answer ? request.evidence_package.question.requirements.map((r: { id: string }) => {
      const matched = request.claims.filter((c: { claim_id: string; requirement_id: string; source_ids: string[] }) => c.requirement_id === r.id && !request.summary_claim_ids.includes(c.claim_id)
        && c.source_ids.some(id => request.evidence_package.passages.some((p: { id: string; supported_requirement_ids: string[] }) => p.id === id && p.supported_requirement_ids.includes(r.id))));
      return { requirement_id: r.id, claim_ids: matched.map((c: { claim_id: string }) => c.claim_id), source_ids: [...new Set(matched.flatMap((c: { source_ids: string[] }) => c.source_ids))], fully_answered: "yes", conditions_preserved: "yes" };
    }) : [],
    claim_assessments: request.claims.map((c: { claim_id: string; source_ids: string[]; claim: string }) => ({ claim_id: c.claim_id, source_ids: c.source_ids,
      finding: { category: "source_support", claim_quote: c.claim, source_id: c.source_ids[0], source_quote: request.claim_evidence.find((r: any) => r.claim_id === c.claim_id).cited_originals.find((p: any) => p.id === c.source_ids[0]).arabic.slice(0, 900) },
    ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f => [f, "yes"])), reason_codes: [], explanation: "" })),
    all_claims_consistent: "yes", complete_coverage: "yes", listed_items_complete: "yes", direct_summary: "yes", no_repetition: "yes", earlier_section_safe: "yes" };
}
export function dependencies(): PipelineDeps {
  return { writer: { id: "fake/writer", generateJson: async req => {
    const input = JSON.parse(req.prompt);
    return { status: "answer", next_step: { text: "Read the cited explanation of care and ask which condition is unclear.", kind: "learning", refs: [] },
      ...Object.fromEntries(input.sections_to_write.map((g: keyof typeof drafts) => {
        const patch = input.correction?.checker_findings?.sentence_patches?.find((p: { group: string }) => p.group === g);
        return [g, patch ? Object.fromEntries(patch.replace_indices.map((i: number) => [`P${i}`, { text: drafts[g][Math.min(i, drafts[g].length - 1)].text }])) : drafts[g]];
      })) };
  } }, verifier: { id: "fake/checker", generateJson: async req => audit(req.prompt) }, search: async () => [], getVerse: async () => undefined, neighbours: async () => [], rich: {} };
}

/** A complete provider-shaped fixture, not a semantic verdict about real sources. */
export function strictAudit(prompt: string): any {
  const input = JSON.parse(prompt), result: any = audit(prompt);
  result.citation_checks = Object.fromEntries(result.citation_checks.map((row: any) => [row.claim_id, { ...row,
    clauses: row.clauses.map((clause: any) => ({ ...clause, evidence: clause.evidence.map((e: any) => ({ anchor_id:
      input.claim_evidence.find((r: any) => r.claim_id === row.claim_id).excerpt_choices.find((a: any) => a.source_id === e.source_id).anchor_id })) })),
  }]));
  result.contribution_map = Object.fromEntries(result.contribution_map.map((row: any) => [row.claim_id, row]));
  result.attribution_checks = Object.fromEntries(result.attribution_checks.map((row: any) => [row.claim_id, row]));
  if (!input.full_answer) for (const key of ["requirement_coverage", "question_checklist_complete", "guidance_safe", "guidance_relevant", "complete_coverage", "listed_items_complete", "direct_summary"]) delete result[key];
  else {
    result.requirement_coverage = Object.fromEntries(result.requirement_coverage.map(({ source_ids: _ids, ...row }: any) => [row.requirement_id, row]));
    if (!input.next_step) { delete result.guidance_safe; delete result.guidance_relevant; }
  }
  return result;
}
