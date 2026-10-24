import type { Locale } from "@/lib/i18n";
import type { PipelineDeps } from "./core";
import { EVIDENCE_SYSTEM, selectionSource } from "./core";
import { parseEvidencePackage, requirementMeaning, type EvidencePackage, type PassageForSelection, type QuestionFrame } from "./retrieval";
import { assessmentItem, CONTRIBUTION_RULES } from "./tiered";
import { runRichAnswer, RICH_CAPS } from "./rich-engine";
import type { RichSection } from "./rich-answer";
import { CONTRIBUTION_PLAN_RULES, contributionPlanSchema } from "./contribution-plan";
import { abortable } from "./abort";
import type { JsonRequest } from "@/lib/ai/types";
import { structuredOutputContract } from "@/lib/ai/structured-output";

export type PatientSelectionAssessment = { pack: EvidencePackage | null; preview: EvidencePackage | null; rejection?: string; missingRequirementIds: string[] | null };

/** Selection of contributions is separate from the final full-coverage gate. */
export async function selectPatientEvidence(frame: QuestionFrame, candidates: PassageForSelection[], deps: PipelineDeps, signal: AbortSignal, partial: boolean,
  onFailure?: (code: string) => void): Promise<EvidencePackage | null> {
  return (await assessPatientEvidence(frame, candidates, deps, signal, partial, false, onFailure)).pack;
}

export async function assessPatientEvidence(frame: QuestionFrame, candidates: PassageForSelection[], deps: PipelineDeps, signal: AbortSignal, partial: boolean,
  requireGapMap = false, onFailure?: (code: string) => void): Promise<PatientSelectionAssessment> {
  signal.throwIfAborted();
  if (requireGapMap && partial) throw Error("patient_gap_map_requires_combined_selection");
  if (!candidates.length) { onFailure?.("no_candidates"); return { pack: null, preview: null, rejection: "no_candidates", missingRequirementIds: frame.requirements.map(r => r.id) }; }
  const started = Date.now();
  const items = deps.meaningRankCandidates ? await deps.meaningRankCandidates(frame, candidates, signal) : candidates;
  const request: JsonRequest = {
    system: `${EVIDENCE_SYSTEM}\n${CONTRIBUTION_RULES}\nA candidate marked context_availability stored_excerpt_only supports only statements explicitly established by that excerpt. Do not infer an unrestricted audience, missing conditions or a universal ruling from omitted context.\n${partial ? "Assess useful contributions for an independently checked source explanation. Do not claim the entire question is answered merely because this group contains related teaching." : "Assess the combined evidence for the complete question, including its difficult concern and all necessary qualifications."}${deps.distinctSelection ? `\n${CONTRIBUTION_PLAN_RULES}` : ""}${requireGapMap ? "\nAlso return missing_requirement_ids: every requested concern whose full answer or necessary qualification is still unsupported. A partial direct contribution is not a complete concern. Omit a concern only when the combined cited originals genuinely establish its full answer, including conditions and any required scholarly reasoning. Background alone cannot make a concern complete. For ready/complete this array must be empty; for insufficient/incomplete it must be nonempty. This is a research-planning map, never approval of answer wording." : ""}`,
    prompt: JSON.stringify({ question: { ...frame, requirements: requirementMeaning(frame.requirements) }, candidates: items.map(p => selectionSource(p, new Set())) }),
    signal, thinking: "low", maxOutputTokens: 6000,
    schema: { type: "object", properties: {
      status: { type: "string", enum: ["ready", "insufficient", "ambiguous", "conflicting"] },
      coverage: { type: "string", enum: ["complete", "incomplete"] },
      conflict_type: { type: "string", enum: ["none", "revelation_conflict", "scholar_difference", "uncertain"] },
      assessments: { type: "array", maxItems: 120, items: assessmentItem(frame.requirements.map(r => r.id), true) },
      ...(deps.distinctSelection ? { evidence_plan: contributionPlanSchema(frame.requirements.map(r => r.id)) } : {}),
      ...(requireGapMap ? { missing_requirement_ids: { type: "array" as const, maxItems: frame.requirements.length, items: { type: "string" as const, enum: frame.requirements.map(r => r.id) } } } : {}),
    }, required: ["status", "coverage", "conflict_type", "assessments", ...(deps.distinctSelection ? ["evidence_plan"] : []), ...(requireGapMap ? ["missing_requirement_ids"] : [])] },
  };
  const raw = await abortable(deps.verifier.generateJson(request), signal);
  const reject = (code: string): PatientSelectionAssessment => {
    onFailure?.(code); deps.onDiagnostic?.("retrieval", `patient_selection_${code}`, Date.now() - started);
    return { pack: null, preview: null, rejection: code, missingRequirementIds: null };
  };
  if (requireGapMap && structuredOutputContract(request.schema).parse(JSON.stringify(raw) ?? "null") === null) return reject("combined_selection_format_invalid");
  let rejection: string | undefined;
  const selected = parseEvidencePackage(raw, frame, items, { requireContributions: true, distinctSelection: deps.distinctSelection, partialPreview: partial, caps: RICH_CAPS, tierOrder: true },
    code => { rejection = code; onFailure?.(code); deps.onDiagnostic?.("retrieval", `patient_selection_${code}`, Date.now() - started); });
  deps.onDiagnostic?.("retrieval", partial ? "patient_partial_selection" : "patient_combined_selection", Date.now() - started,
    { candidates: candidates.length, selected: selected?.passages.length ?? 0 });
  if (!requireGapMap) return { pack: selected, preview: partial ? selected : null, rejection, missingRequirementIds: null };
  if (!selected && !patientSelectionNeedsEvidence(rejection)) return { pack: null, preview: null, rejection, missingRequirementIds: null };
  const missing = (raw as { missing_requirement_ids: string[] }).missing_requirement_ids;
  const flags = raw as { status: string; coverage: string };
  if (new Set(missing).size !== missing.length || selected && missing.length || !selected && !missing.length
    || missing.length > 0 && (flags.status === "ready" || flags.coverage === "complete")) return reject("gap_map_inconsistent");
  if (selected) return { pack: selected, preview: null, missingRequirementIds: [] };
  // Same checked envelope, no extra call. This preview is planning data only and
  // cannot become a complete answer or supply final claim/coverage approval.
  let previewFailure: string | undefined;
  const preview = parseEvidencePackage(raw, frame, items, { requireContributions: true, distinctSelection: deps.distinctSelection, partialPreview: true, caps: RICH_CAPS, tierOrder: true }, code => { previewFailure = code; });
  if (!preview && !patientSelectionNeedsEvidence(previewFailure)) return reject("gap_map_preview_invalid");
  const complete = frame.requirements.filter(r => !missing.includes(r.id));
  if (complete.some(r => !preview?.passages.some(p => p.requirementIds.includes(r.id) && p.contribution?.role === "direct")
    || r.facet === "ruling" && r.scope === "case_specific" && !preview?.passages.some(p => p.source.kind === "scholar" && p.requirementIds.includes(r.id))
    || deps.distinctSelection && !preview?.contributionPlan?.some(u => u.necessary && u.purpose === "answer" && u.requirementIds.includes(r.id)))) return reject("gap_map_unsubstantiated");
  return { pack: null, preview, rejection, missingRequirementIds: [...missing] };
}

/** Only actual evidence gaps justify research recovery. A broken model envelope,
 * unknown citation or contradictory assessment is not a failed source search. */
export function patientSelectionNeedsEvidence(code: string | undefined): boolean {
  return code !== undefined && ["no_candidates", "no_direct_evidence_unsafe_context", "no_direct_evidence_with_requirements",
    "direct_requirement_coverage_missing", "sealed_requirement_coverage_missing", "package_caps_prevent_coverage"].includes(code);
}

export async function checkPatientSource(group: "quran" | "hadith" | "scholar", pack: EvidencePackage, question: string, language: Locale, deps: PipelineDeps, signal: AbortSignal): Promise<RichSection> {
  const result = await runRichAnswer(pack, language, { ...deps, rich: {} }, signal, question, {}, Infinity, { sourceOnly: group });
  const section = result.status === "incomplete" ? result.sections?.find(s => s.group === group) : undefined;
  return section ?? { group, outcome: "failed_check", claims: [], sources: [] };
}
