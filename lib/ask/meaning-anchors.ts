import type { JsonRequest, JsonSchema } from "@/lib/ai/types";
import type { Claim } from "./checks";
import { reviewAnchors, type ReviewAnchor } from "./review-excerpts";
import { findingKinds } from "./review-findings";

type Original = { id: string; arabic: string; surrounding_context?: { id: string; arabic: string }[]; approved_context?: { source_id: string; arabic: string }[] };
export function meaningAnchors(items: Claim[], serialized: unknown) {
  const passages = (serialized as { passages?: Original[] } | null)?.passages ?? [];
  const originals = reviewAnchors(items, serialized, 400);
  const findings = Object.fromEntries(items.map((claim, i) => {
    const claimId = `C${i + 1}`, context: ReviewAnchor[] = [];
    for (const p of passages.filter(p => claim.refs.includes(p.id))) {
      const available = [...(p.surrounding_context ?? []).map(c => ({ id: c.id, arabic: c.arabic })),
        ...(p.approved_context ?? []).map(c => ({ id: c.source_id, arabic: c.arabic }))];
      for (const source of available) for (const anchor of reviewAnchors([{ ...claim, refs: [source.id] }], { passages: [source] }, 400).C1) {
        context.push({ ...anchor, anchor_id: `${claimId}R${context.length + 1}` });
      }
    }
    return [claimId, [...originals[claimId], ...context]];
  }));
  return { originals, findings };
}

/** The model selects identity; code owns all Arabic source characters. */
export function anchoredMeaningRequest(request: JsonRequest, items: Claim[], serialized: unknown): JsonRequest {
  if (request.schema.type !== "object" || request.schema.properties.claims.type !== "object") throw Error("meaning_schema_invalid");
  const anchors = meaningAnchors(items, serialized), prompt = JSON.parse(request.prompt);
  request.maxOutputTokens = Math.min(9000, 1800 + items.length * 600);
  request.schema.properties.meaning_contract = { type: "string", enum: ["condition_anchors_v3"] };
  request.schema.required.push("meaning_contract");
  for (const [i, claim] of items.entries()) {
    const id = `C${i + 1}`, own = anchors.originals[id], findings = anchors.findings[id];
    if (claim.refs.some(ref => !own.some(a => a.source_id === ref))) throw Error("meaning_anchor_source_missing");
    prompt.claims[i].condition_excerpt_choices = own;
    prompt.claims[i].negative_excerpt_choices = findings;
    const row = request.schema.properties.claims.properties[id];
    if (row.type !== "object") throw Error("meaning_schema_invalid");
    const join: JsonSchema = { type: "string", enum: ["none", "single", "all", "any", "unclear"] };
    row.properties.condition_comparisons = { type: "array", maxItems: claim.refs.length, items: {
      type: "object", properties: { source_id: { type: "string", enum: claim.refs }, source_anchor_id: { type: "string", enum: own.map(a => a.anchor_id) },
        claim_excerpt: { type: "string", maxLength: 400 }, source_join: join, claim_join: join },
      required: ["source_id", "source_anchor_id", "claim_excerpt", "source_join", "claim_join"],
    } };
    row.required.push("condition_comparisons");
    row.properties.finding = { type: "object", properties: { category: { type: "string", enum: [...findingKinds] },
      claim_quote: { type: "string", maxLength: 600 }, source_id: { type: "string", enum: ["", ...new Set(findings.map(a => a.source_id))] },
      source_anchor_id: { type: "string", enum: ["", ...findings.map(a => a.anchor_id)] } },
      required: ["category", "claim_quote", "source_id", "source_anchor_id"] };
  }
  request.prompt = JSON.stringify(prompt);
  request.system += `\nReturn meaning_contract condition_anchors_v3. Never retype Arabic in source_excerpt or source_quote: those fields do not exist in this contract. For each cited original return exactly one condition_comparisons row, selecting source_anchor_id from this claim's condition_excerpt_choices and copying source_id from that same choice. Copy claim_excerpt exactly from the claim. Read the FULL original and all relevant qualifications before selecting the excerpt containing the relevant qualification. Excerpt selection establishes identity only, never meaning or approval. Compare source_join and claim_join: none for no relevant condition, single for one, all for jointly required conditions, any for alternatives, unclear for uncertainty. Do not count an unrelated list as a condition. Preserve nested conditions, conjunctions, negation, scope and certainty. A missing original qualification cannot receive none for both sides. If equivalence is uncertain return unsure. For a no/unsure finding select source_anchor_id from this claim's negative_excerpt_choices with matching source_id and an exact affected claim_quote. Restrictive context may ground a negative finding only; it cannot supply positive support. For yes use category source_support and empty finding claim_quote, source_id and source_anchor_id. These anchor rules replace only the earlier instructions to copy Arabic quotation text. All source, scope, condition and grounded-finding requirements still apply.`;
  return request;
}

/** Resolve v3 IDs to untouched originals, then run the existing v2 semantic and
 * qualification validators. No repaired wording or extracted partial approvals. */
export function resolveAnchoredMeaning(raw: unknown, items: Claim[], serialized: unknown): unknown | null {
  const value = raw as any;
  if (!value || value.meaning_contract !== "condition_anchors_v3" || !value.claims || typeof value.claims !== "object" || Array.isArray(value.claims)) return null;
  const anchors = meaningAnchors(items, serialized), claims: Record<string, unknown> = {};
  if (Object.keys(value.claims).length !== items.length) return null;
  for (const [i, claim] of items.entries()) {
    const id = `C${i + 1}`, row = value.claims[id];
    if (!row || !Array.isArray(row.condition_comparisons) || row.condition_comparisons.length !== claim.refs.length) return null;
    const comparisons = [];
    for (const c of row.condition_comparisons) {
      const anchor = anchors.originals[id].find(a => a.anchor_id === c?.source_anchor_id && a.source_id === c.source_id);
      if (!anchor || Object.keys(c).some(k => !["source_id", "source_anchor_id", "claim_excerpt", "source_join", "claim_join"].includes(k))) return null;
      comparisons.push({ source_id: c.source_id, source_excerpt: anchor.original_excerpt, claim_excerpt: c.claim_excerpt, source_join: c.source_join, claim_join: c.claim_join });
    }
    const f = row.finding;
    if (!f || Object.keys(f).some(k => !["category", "claim_quote", "source_id", "source_anchor_id"].includes(k))) return null;
    let sourceQuote = "";
    if (row.verdict === "yes") {
      if (f.category !== "source_support" || f.claim_quote !== "" || f.source_id !== "" || f.source_anchor_id !== "") return null;
    } else {
      const anchor = anchors.findings[id].find(a => a.anchor_id === f.source_anchor_id && a.source_id === f.source_id);
      if (!anchor) return null;
      sourceQuote = anchor.original_excerpt;
    }
    claims[id] = { ...row, finding: { category: f.category, claim_quote: f.claim_quote, source_id: f.source_id, source_quote: sourceQuote }, condition_comparisons: comparisons };
  }
  return { meaning_contract: "condition_logic_v2", claims };
}
