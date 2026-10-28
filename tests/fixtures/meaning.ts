// Scripted identity fixture only, not an independent semantic judgment.
export function positiveMeaningFixture(input: any) {
  const anchored = input.claims.every((c: any) => Array.isArray(c.condition_excerpt_choices));
  return { ...(anchored ? { meaning_contract: "condition_anchors_v3" } : {}), claims: Object.fromEntries(input.claims.map((c: any) => [c.claim_id, {
    verdict: "yes", explanation: "", finding: { category: "source_support", claim_quote: "", source_id: "", ...(anchored ? { source_anchor_id: "" } : { source_quote: "" }) },
    ...(anchored ? { condition_comparisons: c.originals.map((o: any) => ({ source_id: o.source_id,
      source_anchor_id: c.condition_excerpt_choices.find((a: any) => a.source_id === o.source_id).anchor_id,
      claim_excerpt: c.text, source_join: "none", claim_join: "none" })) } : {}),
  }])) };
}
