import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistCampaign, digest, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/isolated-copy-repair-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-copy-input-spend.json");
const r = JSON.parse(readFileSync(path, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (r.independentReview !== "pending" || r.reconstructed?.[0]?.text !== "بين النبي صلى الله عليه وسلم أن من أطاع ربه واجتناب الشرك نال عاقبة حسنة تتضمن سلامة العبد من العقوبة."
  || ledger.calls.length !== 1 || ledger.calls[0].cost === undefined || r.copyFinding !== null
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("review_state_changed");
r.independentReview = {
  status: "reviewed_partial_meaning_but_language_and_scope_not_accepted", classification: "not_fully_established",
  originalArabicReviewed: true, scholarlyCertification: false,
  source: "HE65007 explicitly states worship/no association as God's right and non-punishment for the one who associates nothing as the servants' right. The ending warns against reliance.",
  finding: "The rewrite retains avoiding association and non-punishment in meaning, and no longer attributes protection to wisdom/pardon. However, واجتناب is grammatically misjoined to من أطاع, the opening changes worship into general obedience, and عاقبة حسنة تتضمن asserts an additional broad good outcome instead of just the source's specific non-punishment. The complete sentence is not accepted as a natural, precisely source-bound explanation.",
  copying: "No overlap under unchanged copy rules; this editorial pass is not meaning approval.",
  method: "One current-writer request using the actual saved correction schema, own full original/context, normal output and timeout. No fresh retrieval, primary/secondary checker, final summary, full question, UI/history proof or case-reference regression.",
  decision: "Do not activate or rerun. Keep transformation owner-only. Isolation reduces unrelated input but is not demonstrated to repair useful explanation quality; active engine import was removed after review.",
};
ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: "isolated_copy_reviewed_not_accepted", authorization: "No activation or automatic repeat. Keep remaining allowance and all prior exposure unchanged; all settled output independently reviewed." }];
persistCampaign(path, r); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ status: r.independentReview.status, cost: r.cost, remaining: r.remainingAllowance }));
