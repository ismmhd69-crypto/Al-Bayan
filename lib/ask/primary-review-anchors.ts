import type { JsonRequest } from "@/lib/ai/types";
import type { Claim } from "./checks";
import { CLAIM_AUDIT_FIELDS } from "./checks";
import { meaningAnchors } from "./meaning-anchors";
import { findingKinds } from "./review-findings";

export const PRIMARY_ANCHOR_CONTRACT = "field_verdicts_anchors_v3";

/** Negative findings select original identity; generated Arabic is never proof. */
export function primaryReviewAnchors(request: JsonRequest, items: Claim[], serialized: unknown): JsonRequest {
  const schema = structuredClone(request.schema);
  if (schema.type !== "object" || schema.properties.claim_assessments?.type !== "array"
    || schema.properties.claim_assessments.items.type !== "object") throw Error("primary_anchor_schema_invalid");
  const choices = meaningAnchors(items, serialized).findings;
  const anchors = Object.values(choices).flat();
  schema.properties.audit_contract = { type: "string", enum: [PRIMARY_ANCHOR_CONTRACT] };
  schema.properties.claim_assessments.items.properties.finding = { type: "object", properties: {
    category: { type: "string", enum: [...findingKinds] }, claim_quote: { type: "string", maxLength: 600 },
    source_id: { type: "string", enum: ["", ...new Set(anchors.map(a => a.source_id))] },
    source_anchor_id: { type: "string", enum: ["", ...anchors.map(a => a.anchor_id)] },
  }, required: ["category", "claim_quote", "source_id", "source_anchor_id"] };
  const input = JSON.parse(request.prompt);
  input.review_contract = PRIMARY_ANCHOR_CONTRACT;
  input.claim_evidence = input.claim_evidence.map((row: { claim_id: string }) => ({ ...row, negative_excerpt_choices: choices[row.claim_id] }));
  return { ...request, schema, prompt: JSON.stringify(input), system: request.system
    .replaceAll("field_verdicts_v2", PRIMARY_ANCHOR_CONTRACT)
    + "\nFor claim_assessments.finding do not retype Arabic: source_quote is absent. For a no/unsure assessment select source_anchor_id from THAT claim's negative_excerpt_choices, with its matching source_id and an exact affected claim_quote. Read the full original and all restrictions; the excerpt binds identity only, never proves meaning. Context may ground a restriction but cannot support an uncited assertion. For all-yes assessments use category source_support and empty claim_quote, source_id and source_anchor_id. These rules replace only instructions to copy Arabic into a claim finding; every semantic, condition, coverage and citation check remains required." };
}

export function resolvePrimaryReviewAnchors(raw: unknown, items: Claim[], serialized: unknown): unknown {
  const r = raw as { audit_contract?: unknown; claim_assessments?: unknown } | null;
  if (r?.audit_contract !== PRIMARY_ANCHOR_CONTRACT || !Array.isArray(r.claim_assessments)) return null;
  const choices = meaningAnchors(items, serialized).findings;
  const seen = new Set<string>(), rows = [];
  for (const row of r.claim_assessments) {
    const f = row?.finding;
    if (!choices[row?.claim_id] || seen.has(row.claim_id) || !f || Object.hasOwn(f, "source_quote")
      || !findingKinds.includes(f.category) || typeof f.claim_quote !== "string" || typeof f.source_id !== "string" || typeof f.source_anchor_id !== "string") return null;
    seen.add(row.claim_id);
    const yes = CLAIM_AUDIT_FIELDS.every(field => row[field] === "yes");
    // A negative verdict can never approve anything. If its excerpt label (unique per claim) and
    // source disagree, the label identifies the excerpt shown in correction feedback; the verdict stays negative.
    // This contract is used only in originals-only mode, where published cards carry no generated
    // sentences, so such a finding cannot raise an integrity notice on a published card.
    // Seen live 28 October: one mislabelled "no" ended a whole answer as checker_failure.
    const anchor = choices[row.claim_id].find(a => a.anchor_id === f.source_anchor_id && a.source_id === f.source_id)
      ?? (!yes ? choices[row.claim_id].find(a => a.anchor_id === f.source_anchor_id) : undefined);
    if (yes ? f.category !== "source_support" || f.claim_quote !== "" || f.source_id !== "" || f.source_anchor_id !== "" : !anchor) return null;
    rows.push({ ...row, finding: { category: f.category, claim_quote: f.claim_quote, source_id: yes ? f.source_id : anchor!.source_id, source_quote: yes ? "" : anchor!.original_excerpt } });
  }
  return seen.size === items.length ? { ...r, audit_contract: "field_verdicts_v2", claim_assessments: rows } : null;
}
