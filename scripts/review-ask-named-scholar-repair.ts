import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/named-scholar-repair-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-scholar-name-spend.json");
const r = JSON.parse(readFileSync(path, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (r.independentReview !== "pending" || ledger.calls.length !== 1 || ledger.calls[0].cost === undefined || r.reconstructed?.length !== 2
  || r.nameCheck?.blocked.length || r.copyFindings.some((f: unknown) => f !== null)
  || r.reconstructed[0].text !== "بين الشيخ عبد العزيز بن باز وجوب الإحسان إلى الوالدين ومعاملتهما بالكلام والفعل الطيب، مع الالتزام بأن الطاعة تكون في المعروف."
  || r.reconstructed[1].text !== "يوضح الشيخ عبد العزيز بن باز أن طاعة الوالدين ليست مطلقة، فلا تجب طاعتهما في معصية الخالق أو فيما فيه ضرر."
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("review_state_changed");
r.independentReview = {
  status: "reviewed_named_supported_meanings_component_only", classification: "supported_component_meanings",
  originalArabicReviewed: true, fullOfficialPageVerification: false, scholarlyCertification: false,
  claimOccurrencesReviewed: 2, sourceSupportedMeanings: 2, naturalArabic: true, namesPreserved: true,
  findings: [
    { claim: "C1", finding: "Both citations belong to Ibn Baz and the text now names him. The first excerpt directs continued kind speech/actions despite parental wrongdoing; the second directs kind speech and restricts obedience to right conduct. The rewrite retains those supported meanings and does not restate the old stronger obligatory-obedience formulation. It does not claim a distinct non-Muslim-parent ruling or unconditional visitation after refusal." },
    { claim: "C2", finding: "The cited first excerpt explicitly restricts obedience to right conduct and excludes disobedience to the Creator. The second expressly adds ولا فيما يضر. Naming Ibn Baz and reporting these limits follows the own originals without a new category of personal advice or a claim of scholarly consensus." },
  ],
  copying: "Both pass the existing scholar copy rule; this is editorial evidence only.",
  beforeAfter: "The exact saved initial explanations used أهل العلم and العلماء although both excerpts were one author's. Code rejects both under scripted positive upstream audits. One current-writer correction now supplies his localized name and keeps supported cores. This establishes the identity repair in the tested component, not general semantic reliability.",
  limitations: "Actual-engine source correction captured with upstream approvals scripted only to exercise the name guard. One real writer call, normal schema, output, reasoning and six-second timeout. No live primary/secondary checker, new retrieval, full-question completion, final summary, browser or persistence proof. The separate parents Quran scope failure remains open.",
  decision: "Accept the general missing-name guard and localized author handoff for this tested boundary. Keep all normal source/meaning/final checks; no model vote can override the missing identity. Do not claim religious certification, release acceptance or goal completion. No automatic repeat or added budget.",
};
ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: "named_scholar_component_reviewed_supported_meanings", authorization: "Both generated sentences independently compared with own Arabic originals. Accept component identity repair only, no full-answer claim or automatic repeat. Same remaining allowance and all prior exposure retained." }];
persistCampaign(path, r); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ status: r.independentReview.status, supportedMeanings: "2/2", fullQuestionTested: false, cost: r.cost, remaining: r.remainingAllowance }));
