import type { Claim } from "./checks";

/** Rejected structured wording is repair data only, never rescued as an answer. */
export function referenceRepairFeedback(raw: unknown, groups: string[], allowed: Record<string, string[]>) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return groups.flatMap(group => {
    const rows = (raw as Record<string, unknown>)[group];
    if (!Array.isArray(rows)) return [];
    const rejected = rows.filter(c => c && typeof c.text === "string" && Array.isArray(c.source_ids)
      && c.source_ids.some((id: unknown) => typeof id === "string" && !allowed[group]?.includes(id)));
    return rejected.length ? [{ group, unknown_source_ids: [...new Set<string>(rejected.flatMap(c => c.source_ids.filter((id: unknown) => typeof id === "string" && !allowed[group]?.includes(id))))],
      allowed_source_ids: allowed[group] ?? [], rejected_claims: rejected.map(c => ({ text: c.text, source_ids: c.source_ids })) }] : [];
  });
}

/** Model findings are untrusted repair hints, never evidence or approval. */
export function correctionFeedback(raw: unknown, items: Claim[], summaryCount = 0) {
  const r = raw as Record<string, unknown> | null;
  const known = (id: unknown) => typeof id === "string" && /^C[1-9]\d*$/.test(id) && Number(id.slice(1)) <= items.length;
  const rows = (value: unknown) => Array.isArray(value) ? value.slice(0, 32) : [];
  return {
    summary_claim_ids: summaryCount ? items.slice(-summaryCount).map((_, i) => `C${items.length - summaryCount + i + 1}`) : [],
    claims: items.map((c, i) => ({ claim_id: `C${i + 1}`, text: c.text, source_ids: c.refs, requirement_id: c.requirementId })),
    support_failures: rows(r?.claim_assessments).filter(a => known(a?.claim_id)
      && [a.direct_support, a.audience_preserved, a.conditions_preserved, a.scope_preserved, a.causal_meaning_preserved].some(v => v !== "yes"))
      .map(a => ({ claim_id: a.claim_id, explanation: typeof a.explanation === "string" ? a.explanation.slice(0, 600) : "" })),
    contribution_failures: rows(r?.contribution_map).filter(a => known(a?.claim_id)
      && (a.adds_value !== "yes" || a.kind === "restatement" || Array.isArray(a.duplicates) && a.duplicates.length))
      .map(a => ({ claim_id: a.claim_id, kind: a.kind, contribution: typeof a.contribution === "string" ? a.contribution.slice(0, 180) : "", adds_value: a.adds_value,
        duplicates: rows(a.duplicates).filter(known), repair: "Merge the overlapping point into one concise sentence. Keep distinct requested concerns and necessary qualifications; do not rewrite both sentences with synonyms." })),
  };
}
