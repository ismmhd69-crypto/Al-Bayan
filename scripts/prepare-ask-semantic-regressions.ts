// Owner-only fixed regression preparation and saved-response audit. No network,
// credential loading, paid runner, production imports from this module or deployment.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sourceScopeControls } from "./probe-ask-source-scope";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { ArabicCampaignGuard, digest, persistCampaign } from "./ask-arabic-campaign-guard";
import type { Claim } from "../lib/ask/checks";

export function prepareSemanticRegressions() {
  const previous = sourceScopeControls();
  const oldReviewPath = resolve("work/private-ask-evaluation/source-scope-matched-20261024.json"), oldBytes = readFileSync(oldReviewPath, "utf8"), old = JSON.parse(oldBytes);
  const reportPath = resolve("work/private-ask-evaluation/parents-attribution-full-retest-20261024.json"), reportBytes = readFileSync(reportPath, "utf8"), saved = JSON.parse(reportBytes);
  if (old.independentReview?.status !== "reviewed_failed_comparison_do_not_activate"
    || saved.independentReview?.status !== "reviewed_contract_improvement_but_scope_error_and_incomplete_summary") throw Error("independent_reviews_missing");
  const tracePath = resolve(`work/local-ask-traces/${saved.requestId}.jsonl`), traceBytes = readFileSync(tracePath, "utf8");
  const events = traceBytes.trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const request = (id: string) => events.find(e => e.event === "model_request" && e.data.call_id === id)?.data;
  const response = (id: string) => events.find(e => e.event === "model_response" && e.data.call_id === id)?.data.value;
  const serialized = request("A11").prompt;
  const passages = serialized.claim_evidence.flatMap((c: any) => c.cited_originals).filter((p: any, i: number, ps: any[]) => ps.findIndex(q => q.id === p.id) === i);
  const currentOriginals = { passages };
  const cases = previous.items.map((item, i) => ({ id: `S${String(i + 1).padStart(2, "0")}`,
    family: "previous_scope_controls", expected: previous.supported.includes(`C${i + 1}`) ? "supported" : "not_fully_supported",
    item: item as Claim, serialized: previous.serialized, provenance: "Previously source-reviewed fixed eight-case control; no new verdict inferred from model output." }));
  const badQ = request("A7").prompt.sections_to_write.includes("quran") && response("A7").quran[0];
  const badScholar = response("A8").scholar[2];
  if (!badQ?.text.endsWith("على الشرك أو ما لا علم له به") || !badScholar?.text.includes("تقديم المعونة لهما")) throw Error("reviewed_negatives_changed");
  const add = (id: string, family: string, expected: string, item: Claim, provenance: string) => cases.push({ id, family, expected, item, serialized: currentOriginals as any, provenance });
  add("S09", "new_disjunctive_scope", "not_fully_supported", { text: badQ.text, refs: badQ.source_ids },
    "Exact displayed error: a qualifier inside pressure toward association becomes a separate alternative exception. Reviewed against own 29:8 original.");
  add("S10", "new_disjunctive_scope", "supported", {
    text: "يوصي القرآن بالإحسان إلى الوالدين ويستثني من طاعتهما الضغط على الابن ليشرك بالله.", refs: ["Q29:8"],
  }, "New source-bound positive: kindness and refusal under pressure toward association, without the added separate exception. Source-based review, not scholarly certification.");
  add("S11", "new_ties_condition", "not_fully_supported", { text: badScholar.text, refs: badScholar.source_ids },
    "Exact unshown initial sentence lists visits/assistance but omits the excerpt's explicit rejection/expulsion qualification.");
  add("S12", "new_ties_condition", "supported", {
    text: "يشرح ابن باز الإحسان إلى الوالدين اللذين يأمران بالمعصية، وزيارتهما وإعانتهما، مع تقييد الصلة بألا يطردا الابن ويرفضاها.", refs: badScholar.source_ids,
  }, "New source-bound positive preserves the same practical advice and the explicit qualification. Does not broaden the source to a new religious-status case or invent obligation wording.");
  const prepared = cases.map(c => {
    const { signal: _signal, ...req } = meaningReviewRequest([c.item], c.serialized, new AbortController().signal);
    structuredOutputContract(req.schema);
    const p = JSON.parse(req.prompt);
    if (p.claims.length !== 1 || JSON.stringify(p.claims[0].originals.map((o: any) => o.source_id)) !== JSON.stringify(c.item.refs)
      || ["expected", "provenance", "prior_claim_reviews", "visitor_question"].some(key => key in p)) throw Error("evaluation_label_or_unrelated_claim_leaked");
    return { id: c.id, family: c.family, expected: c.expected, item: c.item, provenance: c.provenance,
      originals: p.claims[0].originals, restrictiveContext: p.claims[0].restrictive_context,
      request: req, requestHash: digest(JSON.stringify(req)), testStatus: "not_tested_as_prepared_single_claim_request" };
  });
  const approvals = ["A9", "A10", "A11", "A12", "A14", "A15", "A17", "A18"].map(id => {
    const q = request(id), a = response(id), p = q.prompt;
    const text = p.stage === "narrow_meaning_review_v1" ? p.claims[0].text : p.claims[0].claim;
    if (text !== badQ.text) throw Error("saved_claim_identity_changed");
    let approved: boolean;
    if (p.stage === "narrow_meaning_review_v1") {
      const items = p.claims.map((c: any) => ({ text: c.text, refs: c.originals.map((o: any) => o.source_id) }));
      const parsed = parseMeaningReview(a, items);
      approved = !!parsed?.safeIds.includes("C1");
    } else {
      const finding = a.claim_assessments.find((c: any) => c.claim_id === "C1");
      approved = ["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"].every(key => finding[key] === "yes");
    }
    const usage = events.find(e => e.event === "model_transport" && e.data.call_id === id && e.data.code === "model_usage")?.data.details;
    if (!approved || usage?.model !== "openrouter/google/gemini-3.1-flash-lite" || usage.finish_reason !== "stop") throw Error("saved_approval_or_actual_model_changed");
    return { call: id, task: p.stage === "narrow_meaning_review_v1" ? "narrow_meaning" : "primary_review", exactClaimApproved: true,
      actualModel: usage.model, finishReason: usage.finish_reason };
  });
  const summary = response("A16").summary[0], final = request("A18").prompt.claims[3];
  if (summary.text !== final.text || response("A18").claims.C4.verdict !== "unsure") throw Error("unscored_application_changed");
  return { cases: prepared, approvals, unscoredApplication: { item: { text: summary.text, refs: summary.source_ids },
    originals: final.originals, status: "qualified_source_context_review_required", excludedFromScoredComparison: true,
    question: "Is this a faithful narrower application of the general source instruction, or does it require explicitly cited religious-status context? Do not assign a binary gold label from either model's verdict." },
    lineage: { previousTraceHash: digest(previous.traceBytes), previousReviewHash: digest(oldBytes), currentTraceHash: digest(traceBytes), currentReviewHash: digest(reportBytes) },
    unchanged: () => readFileSync(reportPath, "utf8") === reportBytes && readFileSync(tracePath, "utf8") === traceBytes && readFileSync(oldReviewPath, "utf8") === oldBytes && readFileSync(previous.tracePath, "utf8") === previous.traceBytes };
}

async function main() {
  const target = resolve("work/private-ask-evaluation/semantic-failure-regression-bank-v2-20261024.json");
  if (existsSync(target)) throw Error("fixed_bank_not_overwritten");
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-attribution-spend.json"), ledgerBytes = readFileSync(ledgerPath, "utf8"), ledger = JSON.parse(ledgerBytes);
  const guard = new ArabicCampaignGuard(ledger, () => { throw Error("audit_cannot_change_spending"); }, { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const oldFetch = globalThis.fetch; let networkAttempts = 0;
  let prepared;
  try { globalThis.fetch = async () => { networkAttempts++; throw Error("offline_network_forbidden"); }; prepared = prepareSemanticRegressions(); }
  finally { globalThis.fetch = oldFetch; }
  if (!prepared.unchanged() || readFileSync(ledgerPath, "utf8") !== ledgerBytes || networkAttempts) throw Error("offline_preparation_changed_history");
  const previousDraft = resolve("work/private-ask-evaluation/semantic-failure-regression-bank-20261024.json");
  const bank = { status: "fixed_owner_only_not_live_tested", version: 2,
    previousUnrunDraft: { hash: digest(readFileSync(previousDraft, "utf8")), reason: "Before any paid comparison, S12's faithful control was narrowed to retain the original parents-commanding-disobedience case as well as the ties qualification. Earlier draft retained; neither version has model results." },
    cases: prepared.cases, unscoredApplication: prepared.unscoredApplication,
    lineage: prepared.lineage, savedFailureAudit: { repeatedApprovalsOfOneClaim: prepared.approvals,
      uniqueBadClaimsInThisAudit: 1, independentModelFamilies: 1,
      finding: "The writer introduced the disjunction in its initial draft. Four primary and four narrow checks accepted the same exact false-scope sentence on the same current checker, with valid complete output. Correct citation identity and genuine excerpts did not establish semantic faithfulness. These are repeated judgments of one claim, not eight independent cases or proof every task fails." },
    protections: { expectedLabelsLocalOnly: true, oneClaimPerRequest: true, ownOriginalsAndRestrictiveContextOnly: true, noNewModelOrProvider: true },
    spending: { addedBudget: 0, paidModelCalls: 0, sourceCalls: 0, actualCost: 0, remaining: ledger.cap - guard.exposure, ledgerHash: digest(ledgerBytes) },
    activation: false, scope: "Twelve selected regression statements, six supported and six defective, plus one unscored applicability question. Not visitor questions, held-out evidence, final-answer acceptance or scholarly certification. Expected labels stay fixed before any future paid dispatch; a separate owner decision is required for comparison." };
  persistCampaign(target, bank);
  console.log(JSON.stringify({ status: bank.status, scoredCases: bank.cases.length, supported: bank.cases.filter(c => c.expected === "supported").length,
    defective: bank.cases.filter(c => c.expected === "not_fully_supported").length, unscored: 1, savedRepeatedApprovals: prepared.approvals.length,
    networkAttempts, paidModelCalls: 0, remaining: bank.spending.remaining, bankHash: digest(JSON.stringify(bank)) }));
}
if (process.argv[1]?.includes("prepare-ask-semantic-regressions")) main().catch(e => { console.error(e instanceof Error ? e.message : "semantic_bank_failed"); process.exitCode = 1; });
