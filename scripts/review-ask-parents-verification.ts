// Owner-only independent review of one completed attempt. No network or model calls.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ArabicCampaignGuard, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const reportPath = resolve("work/private-ask-evaluation/parents-verification-full-retest-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-verification-spend.json");
const r = JSON.parse(readFileSync(reportPath, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (r.requestId !== "92d7c319-26ac-4676-a183-f8116b0ddd8e" || r.status !== "incomplete" || !r.withdrawn || r.independentReview !== "pending"
  || ledger.calls.length !== 16 || ledger.stopped !== "parents_verification_full_retest_20261024_finished_review_required") throw Error("review_state_changed");
const guard = new ArabicCampaignGuard(ledger, () => {}, { cap: ledger.cap, priorExposure: ledger.priorExposure });
if (digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("original_spending_changed");
const traceBytes = readFileSync(`work/local-ask-traces/${r.requestId}.jsonl`, "utf8");
const events = traceBytes.trim().split("\n").map(line => JSON.parse(line));
const response = (id: string) => events.find(e => e.event === "model_response" && e.data.call_id === id)?.data.value;
const request = (id: string) => events.find(e => e.event === "model_request" && e.data.call_id === id)?.data;
const first = r.sections[0];
if (r.sections.length !== 1 || first.group !== "quran" || first.claims.length !== 2
  || first.claims[0].text !== "يُؤمر المسلم بالإحسان إلى والديه وصحبتهما بالمعروف في الحياة الدنيا."
  || first.claims[1].text !== "إذا سعيا في حمله على الإشراك بالله فلا طاعة لهما في ذلك.") throw Error("reviewed_wording_changed");
const attributionEvidence = ["A11", "A14"].map(id => {
  const q = request(id), a = response(id), required = q.prompt.claims.map((c: any) => c.claim_id);
  const returned = a.attribution_checks.map((c: any) => c.claim_id);
  if (required.join() !== "C1,C2,C3,C4,C5" || returned.join() !== "C3,C4,C5"
    || a.earlier_section_safe !== "yes" || a.claim_assessments.some((c: any) => c.direct_support !== "yes")) throw Error("contract_failure_changed");
  return { call: id, required, returned, missing: required.filter((id: string) => !returned.includes(id)),
    earlierSectionSafe: a.earlier_section_safe, contentNegativeVerdicts: false };
});
if (JSON.stringify(response("A8")) !== JSON.stringify(response("A13"))) throw Error("writer_correction_changed_reaudit_required");
const scholarOriginals = request("A15").prompt.claims;
r.independentReview = {
  status: "reviewed_supported_quran_withdrawn_after_missing_attribution_rows", classification: "technical_failure",
  originalArabicReviewed: true, scholarlyCertification: false, usefulCompleteAnswer: false, finalConclusionProduced: false,
  displayedClaimsReviewed: 2, supportedDisplayedClaims: 2, independentlyAcceptedFullAnswers: 0,
  findings: [
    { claim: "quran:1", classification: "supported_meaning", finding: "31:15 explicitly says to accompany the parents in worldly life with kindness; 46:15 explicitly commands kindness to parents and 31:14 mentions gratitude. The sentence does not broaden the exception to all disobedience or impose unconditional obedience." },
    { claim: "quran:2", classification: "supported_meaning", finding: "31:15 and 29:8 explicitly prohibit obeying pressure to associate partners with God. The sentence retains this exception and does not attribute a broader rule to these verses." },
    { claim: "unshown_scholar:1", classification: "supported_core", finding: "The own Ibn Baz originals explicitly call dutifulness a great obligation and restrict obedience to what is right. The draft names Ibn Baz and does not invent general scholarly consensus." },
    { claim: "unshown_scholar:2", classification: "supported_core", finding: "Its own two Ibn Baz excerpts explicitly exclude obedience in disobedience and address parents commanding deviation. These are attributed source explanations, not a ruling applied to this visitor." },
    { claim: "unshown_scholar:3", classification: "qualification_and_force_not_accepted", finding: "The own excerpt recommends continued kind speech, action and ties but expressly limits ties/assistance when the parents expel the child and refuse them. The draft omits this condition and adds positive obligation wording not explicit in that excerpt. Both model checks approved it; no full faithfulness credit. It was never shown." },
  ],
  unshownScholarOriginalHashes: scholarOriginals.map((c: any) => ({ claim: c.claim_id, originals: c.originals.map((o: any) => ({ source: o.source_id, hash: digest(o.arabic) })) })),
  observedContractFailure: { attributionEvidence, correctionUnchanged: true,
    traceCodes: ["rich_attribution_failed", "rich_source_attribution", "rich_correction_started", "rich_sections_withdrawn"],
    mechanism: "The combined source checker omitted attribution rows for the two earlier Quran claims twice while approving their meaning and earlier_section_safe. rich-engine requires one attribution row per item. Missing rows make source attribution fail and exclude those earlier claims from safeClaimIds. It spends the single writer correction even though the missing rows belong to the checker. The writer returns identical scholar prose; the repeated incomplete checker response then triggers the earlier-group not-safe withdrawal branch before synthesis.",
    limit: "This exact trace and code path establish a contract/withdrawal failure, not proof that every incomplete answer has this cause. Do not infer omitted rows mean positive approvals, or weaken semantic checks." },
  retrieval: "Useful Quran and scholar originals found. Quran research reported partial timeout and hadith partial searches failed. Only HE3358 reached selection and was unrelated. No Sunnah section alone is not incompleteness and does not establish no relevant narration exists.",
  timing: { firstCheckedMs: r.firstCheckedMs, totalMs: r.totalMs, previousSameQuestionFirstCheckedMs: 70943,
    sameQuestionFirstSectionImprovementPercent: (70943 - r.firstCheckedMs) / 70943 * 100,
    originalThirtyPercentTargetProved: false, attribution: "Single runs with different retrieval/model outputs, not a controlled causal timing comparison." },
  spending: { actual: guard.actual, calls: ledger.calls.length, inputTokens: ledger.calls.reduce((s,c) => s + (c.promptTokens ?? 0), 0),
    completionTokens: ledger.calls.reduce((s,c) => s + (c.completionTokens ?? 0), 0), combinedExposure: guard.exposure,
    remaining: ledger.cap - guard.exposure, addedAllowance: .25, uncertainCalls: 0,
    truncations: ledger.calls.filter(c => c.finishReason === "length").length,
    configuredBackupCalls: ledger.calls.filter(c => c.model === "mistralai/mistral-small-3.2-24b-instruct").length },
  nextRepairProposal: "Make checker attribution findings structurally complete for every exact claim ID; classify missing/duplicate/unknown findings as invalid checker responses instead of religious failures or writer-edit requests. Preserve independently checked earlier sections on contract failure, withhold unverified siblings and synthesis, and retain withdrawal for actual later evidence against an earlier claim. Verify these distinct paths offline before considering another paid test.",
  readiness: "Two transiently displayed Quran explanations are supported by the cited Arabic. The final result removes them and supplies no conclusion: zero useful complete answers out of this one answerable attempt. Source conditions in withheld scholar prose still need work. One case is not a general accuracy score, browser/persistence acceptance or scholarly certification.",
  stop: "The one authorized attempt is finished. No further paid test, production repair, model/privacy change or deployment is authorized by this review alone.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === r.requestId);
if (!entry || entry.review !== "pending") throw Error("evaluation_entry_changed");
entry.review = "failed";
persistCampaign(reportPath, r); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ classification: r.independentReview.classification, reviewedDisplayedClaims: 2, supportedDisplayedClaims: 2,
  usefulCompleteAnswers: "0/1", actualCost: guard.actual, remaining: ledger.cap - guard.exposure, newModelCalls: 0 }));
