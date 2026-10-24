import { localAskUnhurried } from "./settings";
import { recordLocalAskEvent } from "./local-trace";
import { remainingResearchMs } from "./research-runtime";
import { abortable } from "./abort";

/** Bound headers AND body consumption even when a cache/transport ignores the
 * fetch signal. Late results cannot become evidence after this request fails. */
export async function runSourceRequest<T>(parent: AbortSignal | undefined, milliseconds: number, stage: string,
  work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const signal = sourceRequestTimeout(parent, milliseconds, stage);
  signal.throwIfAborted();
  return abortable(work(signal), signal);
}

/** Patient research may outlive a browser request. One source connection may
 * not wait forever, including during unhurried local or leased-worker runs.
 * Failure stays with the source caller; this does not set an answer deadline. */
export function sourceRequestTimeout(parent: AbortSignal | undefined, milliseconds: number, stage: string): AbortSignal {
  const remaining = remainingResearchMs();
  const limit = remaining === undefined || remaining === Infinity ? milliseconds : Math.min(milliseconds, remaining);
  const deadline = AbortSignal.timeout(limit);
  deadline.addEventListener("abort", () => recordLocalAskEvent("source_request_timeout_fired", {
    stage, limit_ms: limit, parent_already_aborted: parent?.aborted ?? false,
  }), { once: true });
  return parent ? AbortSignal.any([parent, deadline]) : deadline;
}

/** Local owner debugging waits for completion or cancellation. Production retains its limits. */
export function askTimeout(parent: AbortSignal | undefined, milliseconds: number, stage: string): AbortSignal {
  const workerRemaining = remainingResearchMs();
  if (workerRemaining === Infinity) return parent ?? new AbortController().signal;
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
