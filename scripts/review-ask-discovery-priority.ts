// Records the source-by-source manual review of this exact finished attempt.
// It does not infer religious accuracy from model approval or test results.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistCampaign, digest, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/discovery-priority-full-retest-20261023.json");
const report = JSON.parse(readFileSync(path, "utf8"));
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json");
const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (report.requestId !== "2c2b118f-d7be-459d-83ae-95a6adad2f98" || report.status !== "incomplete" || report.calls.length !== 14
  || ledger.stopped !== "campaign_budget_cannot_cover_next_call" || ledger.calls.some(c => c.cost === undefined)
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("finished_attempt_or_ledger_changed");
const claims = report.sections.flatMap((s: any) => s.claims.map((c: any) => ({ group: s.group, ...c })));
if (claims.length !== 4 || claims[0].refs.join(",") !== "Q51:56,Q51:57" || claims[3].refs.join(",") !== "HE65936") throw Error("reviewed_claims_changed");
report.independentReview = {
  status: "reviewed_source_improvement_but_incomplete_and_unsupported", originalArabicReviewed: true, scholarlyCertification: false,
  classification: "incomplete_contains_unsupported_claims", terminalCause: "The final audit was not dispatched because its full reservation could not fit the remaining allowance. Fourteen prior provider generations settled; no new uncertain charge.",
  shownClaimsReviewed: 4, shownClaimsFullySupported: 2,
  findings: [
    { group: "quran", index: 0, classification: "partly_supported", sources: ["Q51:56", "Q51:57"], finding: "Creation for worship and no requested provision/feeding now have their own cited originals. The added absolute self-sufficiency rationale is broader than those exact excerpts; exclusive wording also needs careful scope review. Do not label the whole sentence fully established merely because the missing neighbouring citation was fixed." },
    { group: "quran", index: 1, classification: "supported", sources: ["Q41:46", "Q45:15"], finding: "Righteous action is for the actor and wrongdoing against the actor; the benefit/harm paraphrase preserves the stated subject and does not promise a specified worldly outcome." },
    { group: "hadith", index: 0, classification: "supported_with_completeness_caution", sources: ["HE65007"], finding: "The reported rights, worship and non-association condition follow the narration. Its closing warning against relying on the announcement is present in the original card but not explained. This is not a licence to abandon duties or proof of an unconditional guarantee across all cases." },
    { group: "hadith", index: 1, classification: "unsupported_scope_broadened", sources: ["HE65936"], finding: "The original concerns this elderly man, his walking vow and being told to ride. The explanation broadens that into human self-punishment and hardship in worship generally, omitting the case boundary." },
  ],
  unshownSummary: { reviewed: 3, fullySupported: 0, findings: [
    "S1 adds independence from obedience and a uniquely self-sufficient benefactor rationale beyond its own cited originals.",
    "S2 repeats the widened general-worship reading of the particular walking-vow case.",
    "S3 adds an explicit both-worldly-and-hereafter scope to the benefit statement, without those exact cited excerpts specifying both.",
  ], displayed: false, finallyChecked: false },
  unshownGuidance: { displayed: false, finallyChecked: false, finding: "A study suggestion was labelled sourced_instruction rather than learning and contains the typo al-abayat instead of al-ibadat. No acceptance based on this draft." },
  attributionLimit: "Fresh search/planning outputs differed from the earlier run. In this new run Q51:56 was already the first raw Quran seed; it could have received a neighbour slot under the old ordering too. The recorded-case replay isolates the priority defect; this new full attempt does not prove that the repair alone caused the better citation set.",
  timings: { firstCheckedMs: 51373, previousFirstCheckedMs: 60145, earlierPercent: (60145 - 51373) / 60145 * 100, targetPercent: 30, targetMet: false, totalMs: 60158, fullCompletionComparable: false },
  readiness: "Not reliable or release accepted. Demonstrated discovery-priority repair; source-faithfulness and complete-answer acceptance still fail. One repeated question is not held-out accuracy.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === report.requestId);
if (!entry || entry.review !== "pending") throw Error("evaluation_review_entry_missing_or_already_reviewed");
entry.review = "failed";
persistCampaign(path, report); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ status: report.independentReview.status, shownFullySupported: "2/4", unshownSummaryFullySupported: "0/3", remainingAllowance: report.remainingAllowance, newUncertainCharges: 0 }));
