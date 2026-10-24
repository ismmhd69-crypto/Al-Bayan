// Review all fixed pairs against their own originals. No new paid calls.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseMeaningReview } from "../lib/ask/meaning-review";
import { ArabicCampaignGuard, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const reportPath = resolve("work/private-ask-evaluation/semantic-checker-comparison-20261024.json"), report = JSON.parse(readFileSync(reportPath, "utf8"));
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-semantic-comparison-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const bankBytes = readFileSync("work/private-ask-evaluation/semantic-failure-regression-bank-v2-20261024.json", "utf8"), bank = JSON.parse(bankBytes);
if (report.status !== "finished_review_required" || report.independentReview !== "pending" || report.results.length !== 24 || ledger.calls.length !== 24
  || report.bankHash !== digest(JSON.stringify(bank)) || report.bankBytesHash !== digest(bankBytes)
  || ledger.stopped !== "semantic_comparison_finished_review_required" || ledger.executionCap !== Math.min(ledger.cap, ledger.priorExposure + .05)) throw Error("comparison_state_changed");
const guard = new ArabicCampaignGuard(ledger, () => {}, { cap: ledger.cap, priorExposure: ledger.priorExposure });
if (guard.actual > .05 || ledger.calls.some(c => c.httpStatus !== 200 || c.finishReason !== "stop")) throw Error("unexpected_receipt_or_spending");
if (digest(readFileSync("docs/ask-repair-runs/spend.json", "utf8")) !== ledger.originalLedgerHash) throw Error("original_ledger_changed");
let parent = ledger, ancestors = 0; const seen = new Set<string>();
while (parent.priorCampaign) {
  const p = parent.priorCampaign; if (seen.has(p.path)) throw Error("spending_cycle"); seen.add(p.path);
  const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) throw Error("spending_ancestor_changed");
  parent = JSON.parse(bytes);
  const g = new ArabicCampaignGuard(parent, () => {}, { cap: parent.cap, priorExposure: parent.priorExposure });
  if (Math.abs(g.exposure - p.exposure) > 1e-8) throw Error("ancestor_exposure_changed"); ancestors++;
}
for (const c of bank.cases) for (const model of report.models) {
  const rows = report.results.filter((r: any) => r.id === c.id && r.model === model);
  if (rows.length !== 1 || rows[0].expected !== c.expected || !parseMeaningReview(rows[0].raw, [c.item])) throw Error("pair_or_expected_label_changed");
}
const metrics = report.models.map((model: string) => {
  const rows = report.results.filter((r: any) => r.model === model);
  const faithful = rows.filter((r: any) => r.expected === "supported"), defective = rows.filter((r: any) => r.expected === "not_fully_supported");
  const yes = (r: any) => r.raw.claims.C1.verdict === "yes";
  const calls = ledger.calls.filter(c => c.model === model);
  return { model, faithfulAccepted: faithful.filter(yes).length, faithfulTotal: faithful.length,
    faithfulUnnecessarilyRejected: faithful.filter((r: any) => !yes(r)).map((r: any) => r.id),
    defectiveBlocked: defective.filter((r: any) => !yes(r)).length, defectiveTotal: defective.length,
    defectiveFalselyApproved: defective.filter(yes).map((r: any) => r.id),
    unsure: rows.filter((r: any) => r.raw.claims.C1.verdict === "unsure").length,
    actualCost: calls.reduce((s,c) => s + c.cost!, 0), promptTokens: calls.reduce((s,c) => s + (c.promptTokens ?? 0), 0),
    completionTokens: calls.reduce((s,c) => s + (c.completionTokens ?? 0), 0) };
});
if (metrics[0].defectiveFalselyApproved.join() !== "S01,S04,S09,S11" || metrics[1].faithfulUnnecessarilyRejected.join() !== "S02,S03,S05,S07") throw Error("reviewed_decisions_changed");
report.independentReview = {
  status: "reviewed_neither_checker_accepted_for_switch", fixedLabelsRetained: true, originalArabicReviewed: true, scholarlyCertification: false,
  metrics, tableMeaning: "Decision agreement with twelve pre-fixed selected source-support labels, not general religious accuracy. Backup blocked six defective controls but several reasons are wrong; blocking is not proof of detecting the actual defect.",
  currentChecker: "Accepts all six faithful controls but falsely approves the gratitude-to-worship/cause expansion, reward claim missing belief/adding dwellings, new Quran disjunction and omitted scholar qualification. Correctly rejects the invented wisdom/pardon cause and guaranteed provision outcome. The two current failure families remain missed even in separate single-claim requests.",
  backupRationaleReview: [
    { id: "S01", finding: "The broader worship/thanks combination is not established, so refusal aligns with the label. The explanation is imprecise: gratitude benefiting the person is explicit; the unsupported worship/cause additions must be distinguished." },
    { id: "S02", finding: "False rejection: the claim explicitly includes belief and righteous deeds. The explanation incorrectly says the claim loses the belief condition." },
    { id: "S03", finding: "False rejection: the claim retains the own hadith's no-association condition. The complaint of an unrestricted rule does not identify a missing restriction in this supplied statement." },
    { id: "S04", finding: "Decision aligns with the defective label but rationale is wrong: the own 30:45 explicitly includes from His bounty. The actual defects include the lost belief condition and added dwellings, not absence of bounty wording." },
    { id: "S05", finding: "False rejection: the source explicitly includes وما أريد أن يطعمون. Saying feeding is absent mistakes a noun/verb paraphrase for missing meaning." },
    { id: "S06", finding: "Refusal and reason align: the cited hadith does not state wisdom/pardon as the cause of the outcome." },
    { id: "S07", finding: "False rejection: the original expressly limits the benefit of gratitude to oneself. The claim says that benefit returns to the grateful person; no extra material outcome is promised." },
    { id: "S08", finding: "Refusal and reason align: no guarantee of plentiful provision is in the cited original." },
    { id: "S09", finding: "Decision blocks the defective statement, but the explanation disputes command/instruction and prohibit/do-not-obey wording in the supported core. It does not identify the actual disjunctive scope error; this is not accepted as successful diagnosis of that error." },
    { id: "S10", finding: "Faithful limited positive accepted; one selected case, not stability or full-answer proof." },
    { id: "S11", finding: "Decision blocks the defective statement, but reason incorrectly says visits are absent although ويزورهما is explicit. It does not identify the missing rejection/expulsion qualification. That feedback could cause an incorrect writer repair." },
    { id: "S12", finding: "Faithful case-and-qualification positive accepted; does not make S11's explanation correct or establish general condition checking." },
  ],
  combinedRule: "Requiring agreement would block all six negative controls but also wrongly withhold S02,S03,S05,S07. It is not an accepted improvement and has not been activated. No repair can treat the backup's untrusted critique as new religious evidence.",
  setup: "All twenty-four requests use the fixed bank, current narrow builder, one claim per request, same own originals/context per pair, low reasoning where supported, ZDR and data-collection-denied settings. Backup retains its existing omission of unsupported reasoning. No expected label or disputed application case was sent.",
  spending: { newActualCost: guard.actual, authorizedMaximum: .05, inheritedExposure: ledger.priorExposure,
    overallCap: ledger.cap, executionCap: ledger.executionCap, combinedExposure: guard.exposure,
    remainingGlobalEvaluationAllowance: ledger.cap - guard.exposure, settledCalls: ledger.calls.length,
    uncertainCalls: 0, ancestorHashesVerified: ancestors, oldUnresolvedReservationRetained: .113472 },
  readiness: "No model switch, new supplementary gate or religious-accuracy improvement is justified by this comparison. The technical transport and attribution repairs remain separate. Full visitor answers, held-out performance, qualified review and Mo acceptance are not established.",
  nextDecision: "Keep the current website unchanged. A materially different verification approach, qualified human source review or a separately approved additional-model comparison would need a new decision and balanced controls. Do not continue full-question repeats under a demonstrated false-approval weakness or add reminder prompts as a claimed solution.",
  paidScopeFinished: true, automaticRepeat: false, websiteChanged: false, fullQuestionTests: 0,
};
ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: "semantic_comparison_reviewed_no_activation",
  authorization: "Independent source review completed for the owner's one five-cent comparison. This is not authorization for further calls or a website model switch." }];
persistCampaign(reportPath, report); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ status: report.independentReview.status, metrics, cost: guard.actual, remaining: ledger.cap - guard.exposure, newCallsDuringReview: 0 }));
