import { localAskUnhurried } from "./settings";
import { recordLocalAskEvent } from "./local-trace";
import { remainingResearchMs } from "./research-runtime";

/** Local owner debugging waits for completion or cancellation. Production retains its limits. */
export function askTimeout(parent: AbortSignal | undefined, milliseconds: number, stage: string): AbortSignal {
  const workerRemaining = remainingResearchMs();
  if (workerRemaining === undefined && localAskUnhurried()) {
    recordLocalAskEvent("timeout_disabled_locally", { stage, usual_limit_ms: milliseconds });
    return parent ?? new AbortController().signal;
  }
  // Only the overall pipeline budget changes in the separate worker. Transport/stage stall
  // limits remain bounded, including in local development while a worker is running.
  if (workerRemaining !== undefined) milliseconds = stage === "pipeline" ? workerRemaining : Math.min(milliseconds, workerRemaining);
  const deadline = AbortSignal.timeout(milliseconds);
  deadline.addEventListener("abort", () => recordLocalAskEvent("timeout_fired", { stage, limit_ms: milliseconds, parent_already_aborted: parent?.aborted ?? false }), { once: true });
  return parent ? AbortSignal.any([parent, deadline]) : deadline;
}
