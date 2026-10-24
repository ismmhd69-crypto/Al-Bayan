import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/source-scope-matched-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-source-scope-spend.json");
const report = JSON.parse(readFileSync(path, "utf8"));
const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (report.independentReview !== "pending" || ledger.calls.length !== 2 || ledger.calls.some(c => c.cost === undefined)
  || report.results.length !== 2 || report.results[1].parsed !== null || report.results[0].parsed.safeIds.join() !== "C1,C2,C3,C4,C5,C7"
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("review_state_changed");
report.status = "invalid_response_stop";
report.independentReview = {
  status: "reviewed_failed_comparison_do_not_activate", sourceArabicReviewed: true, scholarlyCertification: false,
  controls: { faithful: ["C2", "C3", "C5", "C7"], defective: ["C1", "C4", "C6", "C8"], source: "Exact saved Arabic originals, three observed failed wordings, four source-bound positive paraphrases and one explicit unsupported provision guarantee." },
  current: { faithfulAccepted: 4, faithfulTotal: 4, defectiveRejected: 2, defectiveTotal: 4,
    missed: "C1 broadens gratitude into worship and adds a cause; C4 drops belief from reward recipients and adds dwellings/stations. The current checker still approves both. This is a selected regression set, not a general accuracy estimate." },
  candidate: { usableContract: false, religiousAccuracyAccepted: false,
    finding: "Some claim_subject and claim_conditions strings are paraphrases rather than exact substrings. Whole-result parser correctly rejects them, with no salvage. Even before that invalidity, raw C1 and C4 are falsely approved. C4 explicitly extracts belief AND righteous deeds from the original, then marks conditions preserved despite belief absent from the claim. More explicit source-first comparison did not repair the semantic false approval." },
  positives: "C2 retains belief and good deeds for the reward; C3 retains the no-association condition of the stated non-punishment; C5 preserves no requested provision/feeding; C7 limits benefit to gratitude. No claim about their final answer completeness or writer-copy admissibility is inferred.",
  negatives: "C6 invents wisdom/pardon as the reason for non-punishment; C8 invents a guarantee of plentiful provision. Both methods flag them in their raw decisions; C8's claim is unsupported, while the candidate's phrase direct opposite overstates the source comparison.",
  setup: "Undeclared minItems keyword caused a confirmed local nondispatch after the first settled baseline. Offline schema compilation was added; only the never-dispatched candidate was sent. No paid baseline retry, fallback or uncertain call. Runner status bug that used results count despite null parsing was corrected; the actual report is invalid_response_stop.",
  decision: "Do not activate or rerun. Existing website checker, models, safety checks and privacy stay unchanged. Next work should address a demonstrated system defect or a materially different evidence-preserving architecture, not repeat reminder prompts and call them reliable.",
};
ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: "source_scope_comparison_reviewed_failed_do_not_activate", authorization: "No added spending or website activation. Both settled calls reviewed. Preserve raw responses and strict rejection; no repeat queued." }];
persistCampaign(path, report); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ status: report.independentReview.status, cost: report.cost, remaining: report.remainingAllowance, calls: ledger.calls.length }));
