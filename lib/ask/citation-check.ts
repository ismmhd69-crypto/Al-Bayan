import type { Claim } from "./checks";

// Exact excerpts bind evidence identity; they do not independently prove meaning.
const normal = (s: string) => s.normalize("NFKC").replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/gu, "").replace(/\s+/gu, " ").trim();
// Ignore sentence punctuation only. Preserve numeric punctuation, signs, words and negations.
export function checkedWording(s: string) {
  const chars = Array.from(normal(s));
  return normal(chars.filter((c, i) => !/[.,،؛;:!?؟]/u.test(c)
    || /\p{N}/u.test(chars[i - 1] ?? "") || /\p{N}/u.test(chars[i + 1] ?? "")).join(""));
}
export type CitationFailure = { claim_id: string; code: string; rejected_text: string; allowed_source_ids: string[]; clause?: string; source_id?: string; checked_wording?: string };
export function checkCitationBindings(raw: unknown, items: Claim[], originals: { id: string; arabic: string }[]) {
  const ids = items.map((_, i) => `C${i + 1}`), rows = (raw as any)?.citation_checks;
  const failures: CitationFailure[] = [];
  const fail = (i: number, code: string, details: Partial<CitationFailure> = {}) => failures.push({ claim_id: ids[i], code,
    rejected_text: items[i].text, allowed_source_ids: [...items[i].refs], ...details });
  if (!Array.isArray(rows) || rows.length !== ids.length || new Set(rows.map(r => r?.claim_id)).size !== ids.length
    || rows.some(r => !ids.includes(r?.claim_id))) {
    items.forEach((_, i) => fail(i, "citation_audit_invalid"));
    return { blocked: ids, reasons: ["citation_audit_invalid"], failures };
  }
  items.forEach((item, i) => {
    const row = rows.find(r => r.claim_id === ids[i]), clauses = row.clauses;
    if (!Array.isArray(clauses) || !clauses.length || clauses.length > 6
      || clauses.some(c => typeof c?.text !== "string" || !c.text.trim() || Array.from(c.text).length > 300)) { fail(i, "citation_clauses_invalid"); return; }
    const joined = clauses.map(c => c.text).join(" ");
    if (checkedWording(joined) !== checkedWording(item.text)) fail(i, "unchecked_or_changed_wording", { checked_wording: joined });
    const used = new Set<string>();
    for (const clause of clauses) {
      if (clause.supported !== "yes") fail(i, "clause_not_supported", { clause: clause.text });
      if (clause.scope_preserved !== "yes") fail(i, "clause_scope_not_preserved", { clause: clause.text });
      if (clause.qualifiers_preserved !== "yes") fail(i, "clause_qualification_not_preserved", { clause: clause.text });
      if (!Array.isArray(clause.evidence) || !clause.evidence.length || clause.evidence.length > 3) { fail(i, "clause_evidence_invalid", { clause: clause.text }); continue; }
      for (const proof of clause.evidence) {
        const details = { clause: clause.text, ...(typeof proof?.source_id === "string" ? { source_id: proof.source_id } : {}) };
        if (!item.refs.includes(proof?.source_id)) { fail(i, "proof_source_not_cited", details); continue; }
        const source = originals.find(s => s.id === proof.source_id);
        const quote = typeof proof?.original_excerpt === "string" ? normal(proof.original_excerpt) : "";
        if (!source || typeof proof.original_excerpt !== "string" || Array.from(proof.original_excerpt).length > 600 || quote.length < 8 || !normal(source.arabic).includes(quote)) { fail(i, "proof_excerpt_not_in_original", details); continue; }
        used.add(source.id);
      }
    }
    item.refs.filter(id => !used.has(id)).forEach(source_id => fail(i, "attached_citation_unexplained", { source_id }));
  });
  return { blocked: [...new Set(failures.map(f => f.claim_id))], reasons: failures.length ? ["cited_clause_not_established"] : [], failures };
}
