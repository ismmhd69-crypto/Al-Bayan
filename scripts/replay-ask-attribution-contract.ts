// Offline replay of the exact failed source-check exchange. No new approvals,
// retrieval, transport, synthesis, credentials or spending mutations.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { sealedPackageJson } from "../lib/ask/core";
import type { EvidencePackage } from "../lib/ask/retrieval";
import { dependencies } from "../tests/fixtures/rich";
import { archivedReviewSchemaMatches } from "./archived-ask-review-schema";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

async function main() {
  const reportPath = resolve("work/private-ask-evaluation/parents-verification-full-retest-20261024.json"), bytes = readFileSync(reportPath, "utf8"), saved = JSON.parse(bytes);
  const tracePath = resolve(`work/local-ask-traces/${saved.requestId}.jsonl`), traceBytes = readFileSync(tracePath, "utf8");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-verification-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8");
  if (saved.independentReview?.status !== "reviewed_supported_quran_withdrawn_after_missing_attribution_rows" || !saved.withdrawn) throw Error("reviewed_failure_changed");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const request = (id: string) => events.find(e => e.event === "model_request" && e.data.call_id === id)?.data;
  const response = (id: string) => structuredClone(events.find(e => e.event === "model_response" && e.data.call_id === id)?.data.value);
  const serialized = request("A7").prompt.evidence_package;
  const verse = (p: any) => ({ key: p.id.slice(1), arabic: p.arabic, arabicPlain: p.arabic,
    translations: { en: p.translation_en ?? null, de: null }, url: `https://quran.com/${p.id.slice(1).replace(":", "/")}` });
  const pack: EvidencePackage = { question: serialized.question, cards: [], passages: serialized.passages.map((p: any) => {
    if (!["quran", "scholar"].includes(p.type) || p.type === "scholar" && p.scholar !== "Shaykh Abdul-Aziz ibn Baz") throw Error("unexpected_recorded_source");
    return { id: p.id, requirementIds: p.supported_requirement_ids,
      ...(p.explanation_requirement_ids ? { explanationRequirementIds: p.explanation_requirement_ids } : {}),
      context: p.surrounding_context.map(verse), facets: ["ruling"], contribution: p.contribution,
      source: p.type === "quran" ? { kind: "quran", verse: verse(p) } : {
        kind: "scholar", quote: { id: p.id, scholarId: "ibn-baz", scholarName: { en: p.scholar, ar: "ابن باز", de: p.scholar },
          title: p.fatwa_title, reference: "Replay display metadata only", arabic: p.arabic, url: "https://binbaz.org.sa" },
      } };
  }) };
  if (JSON.stringify(sealedPackageJson(pack, "ar", false, true)) !== JSON.stringify(serialized)) throw Error("originals_context_conditions_or_identities_changed");
  const deps = dependencies(), checks: string[] = [], writes: string[] = [], diagnostics: string[] = [];
  let withdrawn = false, networkAttempts = 0;
  deps.meaningReview = true;
  deps.rich = { onWithdraw: () => { withdrawn = true; } };
  deps.onDiagnostic = (_stage, code) => { diagnostics.push(code); };
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.correction || p.sections_to_write.includes("summary")) throw Error("unexpected_correction_or_summary");
    const id = p.sections_to_write.join() === "quran" ? "A7" : p.sections_to_write.join() === "scholar" ? "A8" : "";
    if (!id) throw Error("unexpected_writer_request");
    if (JSON.stringify(p.evidence_package) !== JSON.stringify(serialized)) throw Error("writer_evidence_changed");
    writes.push(id); return response(id);
  };
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt), id = p.stage === "narrow_meaning_review_v1" ? "A10" : p.review_stage === "source_section" ? "A9" : p.review_stage === "source_explanations" ? "A11" : "";
    if (!id || JSON.stringify(p) !== JSON.stringify(request(id).prompt)) throw Error("recorded_checker_claims_originals_or_restrictions_changed");
    if (id !== "A10" && !archivedReviewSchemaMatches(req.schema, request(id).schema, p.claims.map((c: any) => c.claim_id))) throw Error("unexpected_schema_change");
    checks.push(id); return response(id);
  };
  const oldFetch = globalThis.fetch;
  let result;
  try {
    globalThis.fetch = async () => { networkAttempts++; throw Error("offline_replay_network_forbidden"); };
    result = await runRichAnswer(pack, "ar", deps, new AbortController().signal, saved.question, { quran: "timeout" });
  } finally { globalThis.fetch = oldFetch; }
  if (result.status !== "incomplete" || result.withdraw || withdrawn || networkAttempts || writes.join() !== "A7,A8" || checks.join() !== "A9,A10,A11"
    || !diagnostics.includes("rich_attribution_response_invalid")) throw Error("expected_failure_isolation_not_observed");
  const shown = result.sections?.filter(s => s.claims.length) ?? [];
  if (shown.length !== 1 || shown[0].group !== "quran" || JSON.stringify(shown[0].claims) !== JSON.stringify(saved.sections[0].claims)) throw Error("checked_progress_changed_or_unverified_sibling_promoted");
  if (readFileSync(reportPath, "utf8") !== bytes || readFileSync(tracePath, "utf8") !== traceBytes || readFileSync(ledgerPath, "utf8") !== ledgerBytes) throw Error("offline_replay_mutated_history");
  const target = resolve("work/private-ask-evaluation/attribution-contract-replay-20261024.json");
  if (existsSync(target)) throw Error("completed_replay_not_overwritten");
  const report = { status: "offline_exact_exchange_replay_passed", originalRequestId: saved.requestId, traceHash: digest(traceBytes), ledgerHash: digest(ledgerBytes),
    codeHashes: Object.fromEntries(["lib/ask/attribution-review.ts", "lib/ask/rich-engine.ts", "lib/ask/rich-review-request.ts"].map(p => [p, digest(readFileSync(p, "utf8"))])),
    historicalLive: { status: saved.status, withdrewCheckedQuran: true }, currentOffline: { status: result.status, withdrewCheckedQuran: false,
      retainedExactClaims: shown[0].claims.length, promotedUnverifiedSiblings: false, finalSummary: false, writerCorrections: 0,
      savedWriterResponses: writes, savedCheckerResponses: checks, diagnostics },
    exactCheckerPromptsOriginalsConditionsAndClaimsRetained: true, deliberateKeyedAttributionSchemaUpgrade: true,
    networkAttempts, paidModelCalls: 0, actualCost: 0, spendingUnchanged: true,
    limitation: "Recorded responses only; no new live retrieval, model behavior, final synthesis, UI/history or semantic acceptance. Reconstructed scholar display-only URL/reference fields are not evidence and no scholar section is emitted. The unshown source-condition gap remains rejected. This replay proves no complete religious answer." };
  persistCampaign(target, report);
  console.log(JSON.stringify({ status: report.status, retainedCheckedQuranClaims: shown[0].claims.length, writerCorrections: 0, networkAttempts, paidModelCalls: 0 }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "attribution_replay_failed"); process.exitCode = 1; });
