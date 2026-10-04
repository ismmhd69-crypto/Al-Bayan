import type { JsonSchema } from "@/lib/ai/types";
import { CLAIM_AUDIT_FIELDS, CLAIM_AUDIT_REASONS } from "./checks";

export const CLAIM_AUDIT_RULES = `
CLAIM AUDIT MODE: replace the bare verdicts array with claim_assessments. Assess every claim_id exactly once and repeat its exact source_ids. Judge only its cited passages; other passages and surrounding_context may restrict meaning but cannot support an uncited fact. Context passages are never citations.
For each claim, report yes/no/unsure separately for:
- direct_support: EVERY assertion and joined clause is directly stated by the cited sources, with correct attribution and no extra meaning.
- audience_preserved: preserve the people addressed, grammatical subject and beneficiary. A statement to a named group does not become a statement to everyone. An explicit description of that group is valid; do not require verbatim copying.
- conditions_preserved: preserve applicable exceptions, limits and tentative qualifiers such as perhaps or may. Mention conditions that affect this claim; do not demand unrelated details from the entire source.
- scope_preserved: preserve the source's case, time, quantities and degree of certainty; do not turn one case into a universal rule or a named scholar's view into consensus.
- causal_meaning_preserved: every cause, purpose or conclusion must be explicit, not inferred from adjacent facts. If the claim makes no causal assertion, report yes here.
Check faithful paraphrases by meaning, not identical words. Do not reject a narrower faithful summary merely because it omits unrelated source content; the separate whole-answer checks assess requested completeness. Use unsure whenever the source comparison is uncertain.
For each non-yes field include its matching reason code, respectively: unsupported_meaning, audience_changed, condition_lost, scope_broadened, cause_inferred. Use no other codes. Give a specific explanation of at most 240 characters identifying the lost restriction or unsupported assertion, in the answer language. Feedback must describe a comparison, never supply new religious facts, rulings or instructions. For all-yes claims use empty reason_codes and an empty explanation. Keep all existing whole-answer and requirement checks.`;

export function claimAuditSchema(): JsonSchema {
  const decision: JsonSchema = { type: "string", enum: ["yes", "no", "unsure"] };
  return { type: "array", items: {
    type: "object", properties: {
      claim_id: { type: "string" },
      source_ids: { type: "array", items: { type: "string" } },
      ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((field) => [field, decision])),
      reason_codes: { type: "array", items: { type: "string", enum: [...CLAIM_AUDIT_REASONS] } },
      explanation: { type: "string", maxLength: 240 },
    }, required: ["claim_id", "source_ids", ...CLAIM_AUDIT_FIELDS, "reason_codes", "explanation"],
  } };
}

export function screeningSystem(legacy: string, audit: boolean): string {
  if (!audit) return legacy;
  const adapted = legacy
    .replace('For each claim, answer "supported" only if', 'For each claim, direct_support is "yes" only if')
    .replaceAll('Answer "not_supported" if', 'Return a negative assessment if')
    .replace('the entire claim is not_supported', 'direct_support is "no" for the entire claim')
    .replace('Answer "unsure" if you are not certain.', 'Use "unsure" for the relevant assessment fields if you are not certain.')
    .replace("Return one verdict per claim, in the same order.", "Return one structured assessment per claim.");
  return `${adapted}\n${CLAIM_AUDIT_RULES}`;
}
