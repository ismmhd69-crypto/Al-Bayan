// Validates semantic findings, not the religious accuracy of the model's judgement.
export const crossSummaryOverlap = (id: string, duplicates: string[], summaryIds: string[]) => duplicates.length > 0
  && duplicates.every(other => summaryIds.includes(id) !== summaryIds.includes(other));

export function contributionAudit(raw: unknown, claimIds: string[], summaryIds: string[], directSummaryChecked = false): string[] {
  if (!Array.isArray(raw) || raw.length !== claimIds.length) return ["contribution_map_invalid"];
  const seen = new Set<string>();
  const reasons = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object" || !claimIds.includes(row.claim_id) || seen.has(row.claim_id)
      || typeof row.contribution !== "string" || !row.contribution.trim() || row.contribution.length > 180
      || !["explanation", "qualification", "definition", "application", "synthesis", "restatement"].includes(row.kind)
      || !["yes", "no", "unsure"].includes(row.adds_value)
      || !Array.isArray(row.duplicates) || new Set(row.duplicates).size !== row.duplicates.length
      || row.duplicates.some((id: unknown) => typeof id !== "string" || id === row.claim_id || !claimIds.includes(id))) {
      reasons.add("contribution_map_invalid"); continue;
    }
    seen.add(row.claim_id);
    // A directly checked final answer may recap its explanations. It must not
    // invent an additional religious claim just to qualify as new information.
    const recap = directSummaryChecked && crossSummaryOverlap(row.claim_id, row.duplicates, summaryIds)
      && (!summaryIds.includes(row.claim_id) || row.kind === "synthesis");
    if (row.adds_value !== "yes" && !(recap && row.adds_value === "no")) reasons.add("contribution_not_useful");
    if (row.kind === "restatement" || row.duplicates.length && !recap) reasons.add("semantic_repetition");
    if (summaryIds.includes(row.claim_id) && row.kind !== "synthesis") reasons.add("summary_not_synthesis");
    // Source explanations can connect several cited passages too. Their
    // presentation role is supplied by code, not inferred from this label.
  }
  if (seen.size !== claimIds.length) reasons.add("contribution_map_invalid");
  return [...reasons];
}
