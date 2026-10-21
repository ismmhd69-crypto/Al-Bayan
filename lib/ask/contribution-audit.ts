// Validates semantic findings, not the religious accuracy of the model's judgement.
export function contributionAudit(raw: unknown, claimIds: string[], summaryIds: string[]): string[] {
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
    if (row.adds_value !== "yes") reasons.add("contribution_not_useful");
    if (row.kind === "restatement" || row.duplicates.length) reasons.add("semantic_repetition");
    if (summaryIds.includes(row.claim_id) && row.kind !== "synthesis") reasons.add("summary_not_synthesis");
    if (!summaryIds.includes(row.claim_id) && row.kind === "synthesis") reasons.add("contribution_map_invalid");
  }
  if (seen.size !== claimIds.length) reasons.add("contribution_map_invalid");
  return [...reasons];
}
