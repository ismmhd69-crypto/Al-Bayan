import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/parents-current-full-retest-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-parents-current-spend.json");
const r = JSON.parse(readFileSync(path, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (r.requestId !== "fadc13d1-9af2-402a-b490-4af97684233f" || r.independentReview !== "pending" || r.status !== "incomplete"
  || ledger.calls.length !== 16 || ledger.calls.some(c => c.cost === undefined) || ledger.stopped !== "campaign_budget_cannot_cover_next_call"
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("review_state_changed");
const q = r.sections.find((s: any) => s.group === "quran"), scholars = r.sections.find((s: any) => s.group === "scholar");
if (q.claims.length !== 2 || scholars.claims.length !== 2 || !q.claims[0].text.endsWith("على الشرك بالله أو المعصية.")) throw Error("reviewed_wording_changed");
r.independentReview = {
  status: "reviewed_source_gap_and_budget_stop", classification: "containing_unsupported_claim",
  originalArabicReviewed: true, fullOfficialPageVerification: false, scholarlyCertification: false,
  displayedOccurrencesReviewed: 4, unshownSummaryOccurrencesReviewed: 2, technicallyComplete: false, usefulCompleteAnswer: false,
  findings: [
    { claim: "quran:1", classification: "unsupported_scope_extension", sources: q.claims[0].refs,
      finding: "Kindness and refusal under pressure to associate partners are explicit. أو المعصية widens the Quran attribution to all disobedience; the three own cited verses do not state that broader rule. The scholar sources separately state it but are not this claim's citations. Initial draft lacked that final phrase; the section correction introduced it and later checkers approved it." },
    { claim: "quran:2", classification: "supported_meaning", sources: q.claims[1].refs,
      finding: "31:15 explicitly joins refusal of pressure toward association with worldly companionship in kindness. The religious-difference setting follows the same passage; it does not impose unconditional obedience." },
    { claim: "scholar:1", classification: "supported_core_with_attribution_and_force_caution", sources: scholars.claims[0].refs,
      finding: "The excerpts state obedience only in what is right, no obedience in disobedience, and continued kind speech/actions. The prose says أهل العلم rather than naming Ibn Baz, although both citations are his; this fails the named-attribution product requirement and can suggest broader scholarly agreement. واجبة في المعروف is stronger positive-obligation wording than the quoted restrictive formulation; do not infer that every permissible parental request is automatically obligatory." },
    { claim: "scholar:2", classification: "supported_meaning_with_attribution_caution", sources: scholars.claims[1].refs,
      finding: "The second own excerpt explicitly excludes obedience in disobedience and harm, while the first supplies the right-conduct restriction. The general limits are supported. Again both sources are Ibn Baz, so العلماء is insufficient named attribution, not evidence of multiple independent scholarly views." },
  ],
  hadith: "Only HE3365 reached selection; it describes dutifulness among beloved deeds, not the specific religious-difference/obedience limits. Selection labelled it mention-only and no source prose was written. This does not establish absence of relevant hadith, and an omitted group alone is not incompleteness.",
  correction: "First source review marked overlapping Quran claims; the combined preflight additionally rejected the scholar claim extending sinful/deviant parents to non-Muslim parents. One coordinated writer correction regenerated both whole sections. Quran claim 1 then acquired the unsupported extra phrase. Exact text-only patches already protect copy repairs, but semantic/contribution repair can rewrite other text. Freeze untargeted sentences and identities in the next repair; all replacements still require every check.",
  unshownSummary: "Two summary statements address kindness despite religious difference and limits on obedience, with their own Quran/scholar citations supporting those cores. They were not finally checked or displayed, so no completion/success credit. Its study suggestion is incorrectly labelled sourced_instruction rather than ordinary learning; the cited excerpts do not command this specific study step.",
  failure: "Final A17 primary check was blocked locally by the unchanged spending reservation. It was not a provider transport failure, unknown charge or religious refusal. No final audit, summary emission, browser/HTTP/persistence proof or automatic repeat.",
  timings: { firstCheckedMs: r.firstCheckedMs, totalMs: r.totalMs, comparableBaselineAvailable: false },
  cost: { actual: r.cost, inputTokens: 142411, completionTokens: 15729, calls: 16, remaining: r.remainingAllowance },
  readiness: "The system found directly useful Quran and scholar originals, but the displayed scope extension, named-attribution problem and unfinished final audit prevent accepting this answer as complete or reliable. This separate regression is not a general accuracy percentage or proof that all previous failures remain identical.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === r.requestId);
if (!entry || entry.review !== "pending") throw Error("evaluation_entry_changed");
entry.review = "failed";
persistCampaign(path, r); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ classification: r.independentReview.classification, displayedClaimsReviewed: 4, actualCost: r.cost, remaining: r.remainingAllowance, finalCheckDispatched: false }));
