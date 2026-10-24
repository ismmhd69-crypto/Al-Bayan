// Explicit 24 October owner approval: one full Arabic parents test, then review.
import { sameAllowanceContinuation, type CampaignLedger } from "./ask-arabic-campaign-guard";

export function parentsVerificationLedger(bytes: string, previousPath: string): CampaignLedger {
  const previous: CampaignLedger = JSON.parse(bytes);
  if (previous.stopped !== "named_scholar_control_finished_review_required") throw Error("preceding_component_not_reviewed");
  const next = sameAllowanceContinuation(bytes, previousPath,
    "Mo explicitly allowed up to $0.25 more on 24 October for ONE full Arabic parents retest, then stop and report. Preserve all earlier spending, the old unresolved reservation, current models, source boundaries, privacy and conservative reservations. No automatic repeat, model comparison or deployment.");
  next.cap += .25;
  return next;
}
