// Offline format-boundary replay. No provider calls or new semantic decisions.
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { normalizeRichReview } from "../lib/ask/rich-review-request";
import { meaningAnchors } from "../lib/ask/meaning-anchors";
import { PRIMARY_ANCHOR_CONTRACT } from "../lib/ask/primary-review-anchors";

const source = resolve(process.argv[2] ?? "work/local-ask-traces/e44b884e-93d7-41a9-b7e4-86e76ae299bd.jsonl");
const content = readFileSync(source, "utf8"), rows = content.trim().split(/\r?\n/).map(l => JSON.parse(l));
const response = rows.find(r => r.event === "model_response" && r.data.call_id === "A24")?.data.value;
let input = rows.find(r => r.event === "model_request" && r.data.call_id === "A24")?.data.prompt;
if (typeof input === "string") input = JSON.parse(input);
if (!response || !input) throw Error("recorded_review_missing");
const items = input.claims.map((c: any) => ({ text: c.claim, refs: c.source_ids, requirementId: c.requirement_id }));
const serialized = { passages: [...new Map<string, any>([...input.claim_evidence.flatMap((c: any) => c.cited_originals), ...input.restriction_context].map(p => [p.id, p] as [string, any])).values()] };
if (normalizeRichReview(response, items, serialized) !== null) throw Error("old_failure_not_reproduced");
const choices = meaningAnchors(items, serialized).findings;
const anchored = { ...response, audit_contract: PRIMARY_ANCHOR_CONTRACT, claim_assessments: response.claim_assessments.map((row: any) => {
  const f = row.finding, own = choices[row.claim_id].filter(a => a.source_id === f.source_id);
  const matches = own.filter(a => a.original_excerpt.includes(f.source_quote));
  // Manual replay identity mapping is unambiguous only when the exact quote fits
  // one choice, or the cited original has just one choice. Verdicts stay negative.
  const anchor = matches.length === 1 ? matches[0] : own.length === 1 ? own[0] : null;
  if (!anchor) throw Error("offline_finding_identity_ambiguous");
  return { ...row, finding: { category: f.category, claim_quote: f.claim_quote, source_id: f.source_id, source_anchor_id: anchor.anchor_id } };
}) };
const parsed: any = normalizeRichReview(anchored, items, serialized, true);
if (!parsed || parsed.claim_assessments.some((r: any, i: number) => ["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"].some(k => r[k] !== response.claim_assessments[i][k]))) throw Error("negative_decisions_not_preserved");
const directory = resolve("work/private-ask-evaluation/reliability-20261026/frozen-failures");
mkdirSync(directory, { recursive: true });
copyFileSync(source, resolve(directory, "e44b884e-93d7-41a9-b7e4-86e76ae299bd.jsonl"));
console.log(JSON.stringify({ oldFailureReproduced: true, anchoredFeedbackParsed: true, negativeDecisionsPreserved: true, rejectedClaims: parsed.claim_assessments.length, originalTraceSha256: createHash("sha256").update(content).digest("hex"), liveCalls: 0 }));
