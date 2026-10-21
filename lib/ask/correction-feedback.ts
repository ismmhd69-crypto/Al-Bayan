import type { Claim } from "./checks";

/** Model findings are untrusted repair hints, never evidence or approval. */
export function correctionFeedback(raw: unknown, items: Claim[]) {
  const r = raw as Record<string, unknown> | null;
  const known = (id: unknown) => typeof id === "string" && /^C[1-9]\d*$/.test(id) && Number(id.slice(1)) <= items.length;
  const rows = (value: unknown) => Array.isArray(value) ? value.slice(0, 32) : [];
  return {
    claims: items.map((c, i) => ({ claim_id: `C${i + 1}`, text: c.text, source_ids: c.refs })),
    support_failures: rows(r?.claim_assessments).filter(a => known(a?.claim_id)
      && [a.direct_support, a.audience_preserved, a.conditions_preserved, a.scope_preserved, a.causal_meaning_preserved].some(v => v !== "yes"))
      .map(a => ({ claim_id: a.claim_id, explanation: typeof a.explanation === "string" ? a.explanation.slice(0, 600) : "" })),
    contribution_failures: rows(r?.contribution_map).filter(a => known(a?.claim_id)
      && (a.adds_value !== "yes" || a.kind === "restatement" || Array.isArray(a.duplicates) && a.duplicates.length))
      .map(a => ({ claim_id: a.claim_id, kind: a.kind, duplicates: rows(a.duplicates).filter(known) })),
  };
}
