// Explicit owner approval only; preserve the complete preceding spending ancestry.
import { existsSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { ArabicCampaignGuard, digest, type CampaignLedger } from "./ask-arabic-campaign-guard";

export function worshipRetestLedger(previous: CampaignLedger, bytes: string, previousPath: string): CampaignLedger {
  if (previous.stopped !== "diverse_package_writer_finished_review_required" || previous.calls.some(c => c.cost === undefined)
    || previous.evaluationCases?.some(c => c.review === "pending")) throw Error("preceding_spending_not_settled_and_reviewed");
  new ArabicCampaignGuard(previous, () => {}, { cap: previous.cap, priorExposure: previous.priorExposure });
  const exposure = previous.priorExposure + previous.calls.reduce((sum, c) => sum + c.cost!, 0);
  if (!Number.isFinite(exposure) || exposure > previous.cap) throw Error("preceding_exposure_invalid");
  return { version: 1, cap: previous.cap + .25, priorExposure: exposure, originalLedgerHash: previous.originalLedgerHash,
    prices: structuredClone(previous.prices), calls: [], stopped: "owner_approved_one_worship_retest_20261024",
    priorCampaign: { path: previousPath, hash: digest(bytes), exposure,
      authorization: "Mo explicitly allowed up to $0.25 more for ONE fresh full Arabic worship retest on 24 October. Preserve the old remainder, all earlier charges and unresolved exposure, current models/privacy and full conservative reservations. No model comparison, automatic repeat or deployment." } };
}
if (process.argv.includes("--owner-approved-extra-025")) {
  const previousPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), bytes = readFileSync(previousPath, "utf8");
  const previous: CampaignLedger = JSON.parse(bytes);
  const review = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/diverse-package-writer-control-20261024.json"), "utf8"));
  if (review.independentReview?.status !== "reviewed_evidence_restored_but_no_full_claim_quality_pass"
    || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== previous.originalLedgerHash) throw Error("prior_review_or_original_changed");
  const ledger = worshipRetestLedger(previous, bytes, previousPath);
  const target = resolve("docs/ask-repair-runs/arabic-quality-20261024-worship-retest-spend.json");
  if (existsSync(target)) throw Error("authorization_already_recorded_no_allowance_reset");
  const fd = openSync(target, "wx", 0o600);
  try { writeFileSync(fd, JSON.stringify(ledger, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
  console.log(JSON.stringify({ status: "authorized_no_model_calls", addedAllowance: .25, remaining: ledger.cap - ledger.priorExposure, priorExposure: ledger.priorExposure }));
}
