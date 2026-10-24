import type { Claim } from "./checks";

// An explicit legal-validity assertion needs its own proof, rather than a generic yes vote.
// This recognises a consequence category across subjects; it contains no topic-specific answer.
export const assertsValidity = (text: string) => /(?:صح[ةه]\s+|لصح[ةه]|بطلان|يُ?بطل|تُ?بطل|يفسد|تفسد|\sباطل[ةه]?(?:\s|[.،]|$)|\b(?:validity|invalid(?:ates?|ation)?|nullif\w*|void|valid)\b|gültig|gueltig|ungültig|ungueltig)/iu.test(text);
export function consequenceClaimIds(items: Claim[]) { return items.flatMap((c, i) => assertsValidity(c.text) ? [`C${i + 1}`] : []); }
const normal = (text: string) => text.normalize("NFKC").replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/gu, "").replace(/\s+/g, " ").trim();
const explicitValidity = /(?:صح[ةه]|صحيح|باطل|بطل|فسد|تقبل|يقبل|لا\s+[^.،؛]{2,65}\s+إلا|\b(?:valid|invalid|validity|nullif\w*|void)\b|gültig|gueltig)/iu;
export function checkConsequences(raw: unknown, items: Claim[], originals: { id: string; arabic: string }[]) {
  const required = consequenceClaimIds(items), rows = (raw as any)?.consequence_checks;
  if (!required.length) return { blocked: [] as string[], reasons: [] as string[] };
  if (!Array.isArray(rows) || rows.length !== required.length || new Set(rows.map(r => r?.claim_id)).size !== required.length
    || rows.some(r => !required.includes(r?.claim_id))) return { blocked: required, reasons: ["consequence_audit_invalid"] };
  const blocked = required.filter(id => {
    const row = rows.find(r => r.claim_id === id), claim = items[Number(id.slice(1)) - 1];
    const source = originals.find(s => s.id === row.source_id && claim.refs.includes(s.id));
    const quote = typeof row.original_excerpt === "string" ? normal(row.original_excerpt) : "";
    // Exact-original anchoring is an additional necessary check, never sufficient approval.
    return row.claim_effect !== "validity" || row.original_effect !== "validity" || row.same_consequence !== "yes"
      || !source || quote.length < 8 || !normal(source.arabic).includes(quote) || !explicitValidity.test(quote);
  });
  return { blocked, reasons: blocked.length ? ["validity_consequence_not_established"] : [] };
}
