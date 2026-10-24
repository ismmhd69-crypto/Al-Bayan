// Independent review of the single authorized live retest. No model/source calls.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ArabicCampaignGuard, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const reportPath = resolve("work/private-ask-evaluation/parents-attribution-full-retest-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-attribution-spend.json");
const r = JSON.parse(readFileSync(reportPath, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (r.requestId !== "05b3a8ef-9f2f-43bb-9f89-7c5c34705d11" || r.status !== "incomplete" || r.withdrawn || r.independentReview !== "pending"
  || ledger.calls.length !== 19 || ledger.stopped !== "parents_attribution_full_retest_20261024_finished_review_required") throw Error("review_state_changed");
const guard = new ArabicCampaignGuard(ledger, () => {}, { cap: ledger.cap, priorExposure: ledger.priorExposure });
if (digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("original_spending_changed");
let parent = ledger, ancestors = 0; const seen = new Set<string>();
while (parent.priorCampaign) {
  const p = parent.priorCampaign;
  if (seen.has(p.path)) throw Error("spending_cycle"); seen.add(p.path);
  const bytes = readFileSync(p.path, "utf8");
  if (digest(bytes) !== p.hash) throw Error("spending_ancestor_changed");
  const prior: CampaignLedger = JSON.parse(bytes);
  const g = new ArabicCampaignGuard(prior, () => {}, { cap: prior.cap, priorExposure: prior.priorExposure });
  if (Math.abs(g.exposure - p.exposure) > 1e-8) throw Error("ancestor_exposure_changed");
  parent = prior; ancestors++;
}
const traceBytes = readFileSync(`work/local-ask-traces/${r.requestId}.jsonl`, "utf8");
const events = traceBytes.trim().split(/\r?\n/u).map(line => JSON.parse(line));
const response = (id: string) => events.find(e => e.event === "model_response" && e.data.call_id === id)?.data.value;
const request = (id: string) => events.find(e => e.event === "model_request" && e.data.call_id === id)?.data;
const attributionCalls = ["A9", "A11", "A14", "A17"].map(id => {
  const p = request(id).prompt, a = response(id), required = p.claims.map((c: any) => c.claim_id), returned = Object.keys(a.attribution_checks);
  if (JSON.stringify(required) !== JSON.stringify(returned) || returned.some(key => a.attribution_checks[key].claim_id !== key)) throw Error("attribution_shape_changed");
  return { call: id, exactRequiredKeysReturned: true, count: required.length };
});
const q = r.result.sections.find((s: any) => s.group === "quran"), h = r.result.sections.find((s: any) => s.group === "hadith");
if (q.claims.length !== 2 || h.claims.length !== 1 || !q.claims[0].text.endsWith("على الشرك أو ما لا علم له به")) throw Error("reviewed_wording_changed");
const finalNarrow = response("A18");
if (finalNarrow.claims.C4.verdict !== "unsure" || response("A17").complete_coverage !== "yes") throw Error("final_failure_changed");
const originals = request("A11").prompt.claim_evidence.flatMap((c: any) => c.cited_originals);
r.independentReview = {
  status: "reviewed_contract_improvement_but_scope_error_and_incomplete_summary", classification: "containing_unsupported_claim",
  originalArabicReviewed: true, fullOfficialPagesRefetched: false, scholarlyCertification: false,
  displayedOccurrencesReviewed: 3, supportedDisplayedOccurrences: 2, unsupportedDisplayedOccurrences: 1,
  unshownInitialScholarOccurrencesReviewed: 3, unshownCorrectedScholarOccurrencesReviewed: 3, unshownSummaryOccurrencesReviewed: 3,
  usefulCompleteAnswer: false, technicallyComplete: false,
  findings: [
    { claim: "quran:1", classification: "unsupported_scope_extension", ownSources: q.claims[0].refs,
      finding: "The original's ما ليس لك به علم is within the pressure to associate partners. The draft inserts أو and makes ما لا علم له به a separate alternative reason for refusing obedience. Its own verse does not establish a general exception for any matter the child lacks knowledge of. Both primary and narrow model reviews approved this changed grammatical scope, including later rechecks; it remains displayed. Kindness and refusal under pressure to associate partners are supported cores, not approval of the added alternative." },
    { claim: "quran:2", classification: "supported_meaning", ownSources: q.claims[1].refs,
      finding: "31:15 explicitly combines worldly companionship in kindness with refusal of pressure toward association. The sentence preserves that setting and does not impose unconditional obedience." },
    { claim: "hadith:1", classification: "supported_meaning", ownSources: h.claims[0].refs,
      finding: "The own narration ends with the restriction الطاعة في المعروف, after a commander demands entry into fire. The explanation preserves the obedience restriction and prohibition on obeying disobedience; it attributes the teaching to the Prophet rather than deciding a personal case." },
  ],
  unshownScholarReview: [
    { draft: "initial:1", classification: "supported_core", finding: "The cited Ibn Baz excerpt explicitly addresses parents commanding deviation and excludes obedience in that wrongdoing. The draft names Ibn Baz and retains that case." },
    { draft: "initial:2", classification: "supported_but_repetitive", finding: "The cited excerpts state the general obedience restriction and no obedience in disobedience. The sentence substantially repeats the hadith explanation; the primary contribution map flags this despite no_repetition=yes." },
    { draft: "initial:3", classification: "condition_not_preserved", finding: "The own excerpt's recommendation of ties/visits/assistance includes ما لم يطرداه ويأبيا قبول صلته. The draft lists those actions without that explicit qualification. No unconditional-obligation wording is invented this time, but the missing qualification still prevents full faithfulness approval." },
    { draft: "corrected:1", classification: "case_application_not_accepted", finding: "The rewrite changes the attributed case from deviant parents commanding deviation to non-Muslim parents. The own original does not explicitly identify that religious status. It contains a general obedience restriction, but the specific application is not independently accepted merely because it is familiar or plausible." },
    { draft: "corrected:2", classification: "condition_not_preserved", finding: "The same visits/assistance qualification remains absent after correction." },
    { draft: "corrected:3", classification: "supported_core_but_repetitive", finding: "The sources support no obedience in disobedience and the universal creature restriction. It repeats the other limits; the contribution map flags C4/C6 as duplicates. The group is withheld, never displayed." },
  ],
  unshownSummaryReview: [
    { claim: "summary:1", classification: "supported_core_with_applicability_review_open", finding: "Kindness despite pressure toward association is explicit. The draft additionally describes the parents as non-Muslims, which the quoted verses do not label explicitly. The secondary checker rejects this application as unsure. Whether this is an overly literal rejection of a valid narrower application requires qualified source-context review; do not silently override it or call it proven checker error." },
    { claim: "summary:2", classification: "supported_core", finding: "The obedience restriction is supported by the hadith. The draft treats parents as included in that general rule; the Quran citation provides the specific association exception. It is unshown and receives no completion credit." },
    { claim: "summary:3", classification: "supported_but_repetitive", finding: "The own verse explicitly joins companionship in kindness with refusal of association pressure. This largely repeats the first summary point and source explanations; positive model repetition flags do not make it a useful distinct conclusion." },
  ],
  attributionContract: { observed: "Every required attribution identity returned in all four primary reviews. No attribution-format failure or checker-induced withdrawal. The earlier failure did not recur in this attempt.", calls: attributionCalls,
    causalLimit: "Single run with different retrieval, wording and responses, not proof of general success or a controlled estimate of the repair's effect." },
  terminalCause: "The scholar section failed contribution/repetition checks before and after its one writer correction. Quran and hadith survived. Summary primary checking completed and passed; narrow independent review A18 marked summary C4 unsure because the religious status was not explicitly labelled in its own originals. With the one correction already used, Ask withheld the summary and kept the earlier sections. No budget gate, provider rejection or uncertain charge caused this terminal result.",
  retrieval: "Live research found Quran, a directly useful Sahihayn narration HE66184 and named Ibn Baz passages. No source-group quota was filled automatically; this does not prove the earlier catalogue miss fixed or corpus-wide recall. This run recorded no retrieval timeout/failure code.",
  presentation: "Pipeline result preserves Quran/hadith and honest incomplete state. Scholar group is failed_check with no claims; no browser or persisted-history acceptance is established by these frames. The unsupported Quran alternative is not withdrawn because the live checkers miss it.",
  time: { firstCheckedMs: r.firstCheckedMs, totalMs: r.totalMs, previousSameQuestionFirstMs: 60093,
    firstSectionReductionVsPreviousPercent: (60093 - r.firstCheckedMs) / 60093 * 100,
    originalThirtyPercentTargetProved: false, limitation: "Uncontrolled single-run timing and different sources; no repair-specific speed or original-target claim." },
  spending: { cost: guard.actual, calls: ledger.calls.length, inputTokens: ledger.calls.reduce((s,c) => s + (c.promptTokens ?? 0), 0), completionTokens: ledger.calls.reduce((s,c) => s + (c.completionTokens ?? 0), 0),
    cap: ledger.cap, exposure: guard.exposure, remaining: ledger.cap - guard.exposure, uncertainCharges: 0,
    truncatedOutputs: ledger.calls.filter(c => c.finishReason === "length").length,
    configuredBackupCalls: ledger.calls.filter(c => c.model.includes("mistral") || c.model.includes("3.8")).length,
    ancestryHashesVerified: ancestors, addedBudget: 0, originalUnresolvedReservationRetained: .113472 },
  originalHashes: Object.fromEntries(originals.map((o: any) => [o.id, digest(o.arabic)])), traceHash: digest(traceBytes),
  readiness: "Technical attribution handling improved in this test, but one of three displayed source explanations contains an unsupported scope extension and the answer does not complete. Zero useful complete answers out of this one answerable attempt. No general accuracy score or religious/release/Mo acceptance.",
  nextPriority: "Prioritize source scope/grammar and condition preservation, including the false approvals on the displayed Quran clause and missing qualification in unshown scholar prose. Do not paper over semantic failures by forcing summary completion, hardcoding this question, relaxing checks or adding unlimited retries. Treat the final applicability rejection as a review question, not a proven bug.",
  stop: "This single authorized live attempt is finished and reviewed. Serious unsupported displayed scope is recorded; no further paid question or repeat is authorized by the existing remainder alone. No production repair/model/privacy/source change or deployment during evaluation.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === r.requestId);
if (!entry || entry.review !== "pending") throw Error("evaluation_entry_changed");
entry.review = "failed";
persistCampaign(reportPath, r); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ classification: r.independentReview.classification, reviewedDisplayed: 3, supported: 2, unsupported: 1,
  usefulCompleteAnswers: "0/1", cost: guard.actual, remaining: ledger.cap - guard.exposure, ancestryHashesVerified: ancestors, newModelCalls: 0 }));
