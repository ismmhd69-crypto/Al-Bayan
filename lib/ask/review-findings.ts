import type { JsonSchema } from "@/lib/ai/types";
import type { Claim } from "./checks";

export const findingKinds = ["source_support", "missing_qualification", "context_needed"] as const;
export type MeaningFinding = { category: typeof findingKinds[number]; claim_quote: string; source_id: string; source_quote: string };
export const findingSchema: JsonSchema = { type: "object", properties: {
  category: { type: "string", enum: [...findingKinds] }, claim_quote: { type: "string", maxLength: 600 },
  source_id: { type: "string" }, source_quote: { type: "string", maxLength: 900 },
}, required: ["category", "claim_quote", "source_id", "source_quote"] };
export const MEANING_RULES = `Judge faithful paraphrases by meaning, not identical words. A missing surface keyword, changed word form or shorter wording is not by itself a lost meaning. Distinguish describing a source's original audience from applying an expressly general rule to a subset; neither licenses a new personal ruling. Preserve the recipient, conjunctions, nested conditions, exceptions, causal relationships and strength of the statement. Do not turn an embedded qualifier into a separate alternative, omit a prerequisite of a promised outcome, add a cause, or turn a benefit into a guarantee.
Separate unsupported meaning from a supported core needing an important practical qualification, and from an interpretation needing further approved context. Do not require every unrelated detail of the source in every sentence. A qualification of one act does not cancel other duties. Familiar doctrine is not citation support. Do not state unsupported implications when necessary approved context is unavailable.
When an original expressly states a general principle, judge a faithful paraphrase or narrower instance by that principle's actual scope, not by requiring every word of the visitor's question to appear in the original. Non-exhaustive examples can illustrate that expressly stated principle; examples alone cannot establish a new general rule. A new procedure, legal consequence, specific outcome, cause or personal ruling still needs explicit support. A missing word is not proof that the original excludes its meaning, and source metadata or familiar doctrine cannot supply missing support.`;
export const NEGATIVE_FINDING_RULES = `For a negative finding identify the exact affected claim wording and copy a relevant exact Arabic source passage from that claim's own cited original or supplied restrictive context. Use the actual source ID of the quoted text, including when it is context. Use the shortest useful quotes, preferably under 180 characters of claim wording and 320 characters of original. A genuine quotation grounds the comparison but never proves entailment by itself. Never invent replacement religious content.`;

type Serialized = { passages: { id: string; arabic: string; surrounding_context?: { id: string; arabic: string }[]; approved_context?: { source_id: string; arabic: string }[] }[] };
export function groundedFinding(raw: unknown, claim: Claim, serialized: unknown): MeaningFinding | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const f = raw as MeaningFinding;
  if (!findingKinds.includes(f.category) || ![f.claim_quote, f.source_id, f.source_quote].every(s => typeof s === "string" && s.trim())
    || f.claim_quote.length > 600 || f.source_quote.length > 900 || !claim.text.includes(f.claim_quote)) return null;
  const originals = (serialized as Serialized)?.passages?.filter(p => claim.refs.includes(p.id)) ?? [];
  const available = originals.flatMap(p => [{ source_id: p.id, arabic: p.arabic },
    ...(p.surrounding_context ?? []).map(c => ({ source_id: c.id, arabic: c.arabic })), ...(p.approved_context ?? [])]);
  return available.some(p => p.source_id === f.source_id && typeof p.arabic === "string" && p.arabic.includes(f.source_quote)) ? f : null;
}

/** Resolve a uniquely identified Arabic excerpt back to untouched source bytes.
 * Only Arabic vocalization/recitation/elongation marks and whitespace may differ. Letters,
 * words, punctuation, citation identity and the affected claim remain exact. */
export function canonicalNegativeFinding(raw: unknown, claim: Claim, serialized: unknown): MeaningFinding | null {
  const exact = groundedFinding(raw, claim, serialized);
  if (exact) return exact;
  const f = raw as MeaningFinding | null;
  if (!f || !findingKinds.includes(f.category) || typeof f.claim_quote !== "string" || !f.claim_quote.trim() || !claim.text.includes(f.claim_quote)
    || f.claim_quote.length > 600 || typeof f.source_id !== "string" || typeof f.source_quote !== "string" || !f.source_quote.trim() || f.source_quote.length > 900) return null;
  const strip = (text: string) => {
    let value = ""; const starts: number[] = [], ends: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/u.test(char)) { if (ends.length) ends[ends.length - 1] = i + 1; continue; }
      if (/\s/u.test(char)) { if (!value || value.endsWith(" ")) { if (ends.length) ends[ends.length - 1] = i + 1; continue; } starts.push(i); ends.push(i + 1); value += " "; }
      else { starts.push(i); ends.push(i + 1); value += char; }
    }
    return { value: value.trimEnd(), starts, ends };
  };
  const quote = strip(f.source_quote).value;
  if (!quote) return null;
  const originals = (serialized as Serialized)?.passages?.filter(p => claim.refs.includes(p.id)) ?? [];
  const available = originals.flatMap(p => [{ source_id: p.id, arabic: p.arabic }, ...(p.surrounding_context ?? []).map(c => ({ source_id: c.id, arabic: c.arabic })), ...(p.approved_context ?? [])]);
  const matches = new Set<string>();
  for (const source of available.filter(p => p.source_id === f.source_id && typeof p.arabic === "string")) {
    const indexed = strip(source.arabic), start = indexed.value.indexOf(quote);
    if (start < 0 || indexed.value.indexOf(quote, start + 1) >= 0) continue;
    const resolved = source.arabic.slice(indexed.starts[start], indexed.ends[start + quote.length - 1]);
    if (resolved.length <= 900) matches.add(resolved);
  }
  if (matches.size !== 1) return null;
  return groundedFinding({ ...f, source_quote: [...matches][0] }, claim, serialized);
}

/** A malformed negative is a checker failure, never evidence against displayed text. */
export function validNegativeFindings(rows: unknown, items: Claim[], serialized: unknown): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.every(row => {
    const index = items.findIndex((_, i) => row?.claim_id === `C${i + 1}`);
    return index >= 0 && (["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"]
      .every(k => row[k] === "yes") || !!groundedFinding(row.finding, items[index], serialized));
  });
}

export function reviewFailureCategory(reasons: readonly string[]) {
  if (reasons.some(r => r.includes("invalid") || r === "checker_failed" || r === "check_failed")) return "checker_failure";
  if (reasons.includes("context_needed")) return "context_needed";
  if (reasons.includes("missing_qualification") || reasons.includes("condition_lost")) return "missing_qualification";
  if (reasons.some(r => ["source_support", "unsupported_meaning", "audience_changed", "scope_broadened", "cause_inferred", "source_attribution"].includes(r))) return "source_support";
  if (reasons.some(r => /coverage|checklist|complete|summary/.test(r))) return "question_coverage";
  return "source_support";
}
