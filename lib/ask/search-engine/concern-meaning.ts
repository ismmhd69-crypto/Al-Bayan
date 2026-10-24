import type { AnswerRequirement, QuestionFrame } from "../retrieval";

/** Question constraints, never answer facts. Keep the difficult condition and interpretation
 * visible to meaning retrieval/ranking rather than searching a stripped topic label. */
export function concernMeaning(frame: QuestionFrame, requirement: AnswerRequirement): string {
  const lines = [requirement.text];
  if (requirement.scope) lines.push(`Scope: ${requirement.scope}`);
  if (requirement.essentialConditions?.length) lines.push(`Conditions: ${requirement.essentialConditions.join("; ")}`);
  if (requirement.interpretationId) {
    const interpretation = frame.interpretations?.find(i => i.id === requirement.interpretationId);
    if (!interpretation) throw new Error("search_interpretation_missing");
    lines.push(`Meaning: ${interpretation.label}`);
  }
  const text = lines.join("\n");
  if (!text.trim() || text.length > 500) throw new Error("search_concern_too_long");
  return text;
}
