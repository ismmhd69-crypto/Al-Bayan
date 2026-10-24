// Offline request comparison. Fake model transport; no network or ledger changes.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { richReviewRequest } from "../lib/ask/rich-review-request";
import { createOpenRouter } from "../lib/ai/openrouter";
import { createRateLimiter } from "../lib/ai/limits";
import { withModelTransport } from "../lib/ai/transport";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
import type { JsonRequest } from "../lib/ai/types";
import { shareReviewOriginals } from "../lib/ask/shared-originals-review";
import { archivedReviewSchemaMatches } from "./archived-ask-review-schema";

export function recordedBlindReview() {
  const tracePath = resolve("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"), bytes = readFileSync(tracePath, "utf8");
  const events = bytes.trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const old = events.find(e => e.event === "model_request" && e.data.call_id === "A15")?.data;
  const draft = events.find(e => e.event === "model_request" && e.data.phase === "draft")?.data.prompt;
  if (!old?.prompt.full_answer || old.prompt.claims.length !== 7 || old.prompt.prior_claim_reviews.length !== 4 || !draft.evidence_package) throw Error("blocked_final_request_changed");
  const p = old.prompt, items = p.claims.map((c: any) => ({ text: c.claim, refs: c.source_ids, requirementId: c.requirement_id }));
  const request = richReviewRequest({ items, language: "ar", full: true, question: p.visitor_question, serialized: draft.evidence_package,
    guidance: p.next_step, translationCandidates: p.display_translation_candidates, summaryCount: p.summary_claim_ids.length, earlierCount: p.earlier_claim_ids.length });
  const expected = structuredClone(p); delete expected.prior_claim_reviews;
  if (JSON.stringify(JSON.parse(request.prompt)) !== JSON.stringify(expected) || !archivedReviewSchemaMatches(request.schema, old.schema, p.claims.map((c: any) => c.claim_id))
    || request.maxOutputTokens !== old.max_output_tokens) throw Error("source_claim_context_or_contract_changed");
  return { request, oldRequest: { system: old.system, prompt: JSON.stringify(old.prompt), schema: old.schema, maxOutputTokens: old.max_output_tokens, thinking: old.thinking, structuredOutput: true } as JsonRequest,
    items, serialized: draft.evidence_package, traceHash: digest(bytes), attributionContractUpgraded: JSON.stringify(request.schema) !== JSON.stringify(old.schema) };
}

async function main() {
  const { request, oldRequest, traceHash, attributionContractUpgraded } = recordedBlindReview();
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8"), ledger: CampaignLedger = JSON.parse(ledgerBytes);
  const model = "google/gemini-3.1-flash-lite", price = ledger.prices[model], bodies: any[] = [];
  process.env.OPENROUTER_PRIVACY = "zdr"; process.env.OPENROUTER_REASONING = "low";
  await withModelTransport(async (_url, init) => { bodies.push(JSON.parse(String(init.body))); return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 }); }, async () => {
    const provider = createOpenRouter("offline-no-credentials", model, createRateLimiter(1000, 100000));
    await provider.generateJson(oldRequest); await provider.generateJson(request);
    await provider.generateJson(shareReviewOriginals(request));
  });
  const size = (body: any) => {
    const messagesBytes = Buffer.byteLength(JSON.stringify(body.messages), "utf8");
    return { messagesBytes, fullReservation: Math.ceil((((messagesBytes + 4096) * price.prompt + body.max_tokens * price.completion) * 2 / 1e6 + price.request) * 1e9) / 1e9 };
  };
  const remaining = ledger.cap - ledger.priorExposure - ledger.calls.reduce((sum, c) => sum + (c.cost ?? c.reserved), 0);
  const report = { status: "offline_only_no_network", traceHash, before: size(bodies[0]), after: size(bodies[1]), remaining,
    sharedOriginalsExperiment: size(bodies[2]),
    sameOriginalsClaimsRestrictions: true, attributionContractUpgraded, outputContractOtherwisePreserved: true,
    removedPriorCheckerVotesAndDuplicateProofs: true, modelCalls: 0, modelCost: 0,
    nextCallFitsUnchangedReservation: size(bodies[1]).fullReservation <= remaining, sharedOriginalsCallFits: size(bodies[2]).fullReservation <= remaining };
  if (readFileSync(ledgerPath, "utf8") !== ledgerBytes) throw Error("offline_measurement_changed_ledger");
  persistCampaign(resolve("work/private-ask-evaluation/shared-originals-request-size-20261024.json"), report);
  console.log(JSON.stringify(report));
}
if (process.argv.includes("--measure")) main().catch(e => { console.error(e instanceof Error ? e.message : "inspection_failed"); process.exitCode = 1; });
