// Read-only replay of a never-dispatched final request. Fake transport only.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { richReviewRequest } from "../lib/ask/rich-review-request";
import { createOpenRouter } from "../lib/ai/openrouter";
import { createRateLimiter } from "../lib/ai/limits";
import { withModelTransport } from "../lib/ai/transport";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
import { archivedReviewSchemaMatches } from "./archived-ask-review-schema";

export function optionalGuidanceSizeRequests() {
  const tracePath = resolve("work/local-ask-traces/fadc13d1-9af2-402a-b490-4af97684233f.jsonl"), bytes = readFileSync(tracePath, "utf8");
  const events = bytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const old = events.find(e => e.event === "model_request" && e.data.call_id === "A17")?.data;
  const serialized = events.find(e => e.event === "model_request" && e.data.call_id === "A16")?.data.prompt.evidence_package;
  if (!old?.prompt.full_answer || events.some(e => e.event === "model_response" && e.data.call_id === "A17") || !serialized) throw Error("blocked_final_trace_changed");
  const p = old.prompt, common = { items: p.claims.map((c: any) => ({ text: c.claim, refs: c.source_ids, requirementId: c.requirement_id })),
    language: "ar" as const, full: true, question: p.visitor_question, serialized, translationCandidates: p.display_translation_candidates,
    summaryCount: p.summary_claim_ids.length, earlierCount: p.earlier_claim_ids.length };
  const withGuidance = richReviewRequest({ ...common, guidance: p.next_step });
  if (JSON.stringify(JSON.parse(withGuidance.prompt)) !== JSON.stringify(p) || !archivedReviewSchemaMatches(withGuidance.schema, old.schema, p.claims.map((c: any) => c.claim_id))
    || withGuidance.maxOutputTokens !== old.max_output_tokens) throw Error("baseline_claims_or_contract_changed");
  const withoutGuidance = richReviewRequest({ ...common, guidance: null });
  const before = JSON.parse(withGuidance.prompt), after = JSON.parse(withoutGuidance.prompt);
  delete before.next_step;
  if (JSON.stringify(before) !== JSON.stringify(after)) throw Error("body_evidence_or_coverage_changed");
  return { withGuidance, withoutGuidance, traceHash: digest(bytes), tracePath, bytes,
    attributionContractUpgraded: JSON.stringify(withGuidance.schema) !== JSON.stringify(old.schema) };
}

async function main() {
  const c = optionalGuidanceSizeRequests();
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-scholar-name-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8"), ledger: CampaignLedger = JSON.parse(ledgerBytes);
  if (ledger.calls.some(c => c.cost === undefined)) throw Error("uncertain_charge");
  const model = "google/gemini-3.1-flash-lite", price = ledger.prices[model], bodies: any[] = [];
  process.env.OPENROUTER_PRIVACY = "zdr"; process.env.OPENROUTER_REASONING = "low";
  await withModelTransport(async (url, init) => {
    if (url !== "https://openrouter.ai/api/v1/chat/completions") throw Error("unexpected_offline_transport");
    const body = JSON.parse(String(init.body));
    if (body.model !== model || body.provider?.zdr !== true || body.provider?.data_collection !== "deny") throw Error("offline_privacy_or_model_changed");
    bodies.push(body);
    return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 });
  }, async () => {
    const provider = createOpenRouter("offline-no-credentials", model, createRateLimiter(1000, 100000));
    await provider.generateJson(c.withGuidance); await provider.generateJson(c.withoutGuidance);
  });
  const size = (body: any) => {
    const messagesBytes = Buffer.byteLength(JSON.stringify(body.messages), "utf8");
    return { messagesBytes, outputAllowance: body.max_tokens,
      fullReservation: Math.ceil((((messagesBytes + 4096) * price.prompt + body.max_tokens * price.completion) * 2 / 1e6 + price.request) * 1e9) / 1e9 };
  };
  const before = size(bodies[0]), after = size(bodies[1]);
  const remaining = ledger.cap - ledger.priorExposure - ledger.calls.reduce((s, c) => s + c.cost!, 0);
  if (readFileSync(ledgerPath, "utf8") !== ledgerBytes || readFileSync(c.tracePath, "utf8") !== c.bytes
    || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("offline_replay_changed_history");
  const report = { status: "offline_only_no_network", traceHash: c.traceHash, before, after, remaining,
    sameClaimsOriginalsRestrictionsAndCoverage: true, removedOnlyAbsentOptionalGuidanceChecksBetweenCurrentRequests: true,
    attributionContractUpgradedSinceArchive: c.attributionContractUpgraded,
    existingOutputReservationAndHeadroomUnchanged: true, beforeFits: before.fullReservation <= remaining, afterFits: after.fullReservation <= remaining,
    modelCalls: 0, actualCost: 0, limitation: "Exact historical final-primary request only. Known body defects remain; this is not a reviewed answer or prediction of new retrieval, writer, backup or final meaning-check cost." };
  persistCampaign(resolve("work/private-ask-evaluation/optional-guidance-size-20261024.json"), report);
  console.log(JSON.stringify(report));
}
if (process.argv[1]?.includes("inspect-ask-optional-guidance-size")) main().catch(e => { console.error(e instanceof Error ? e.message : "offline_measurement_failed"); process.exitCode = 1; });
