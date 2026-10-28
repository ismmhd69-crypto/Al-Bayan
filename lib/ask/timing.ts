import { localAskUnhurried } from "./settings";
import { recordLocalAskEvent } from "./local-trace";
import { remainingResearchMs, currentResearchSignal } from "./research-runtime";
import { abortable } from "./abort";

/** Owner's unhurried research waits for source headers and bodies without an
 * application deadline. Cancellation still propagates through both. */
export async function runSourceRequest<T>(parent: AbortSignal | undefined, milliseconds: number, stage: string,
  work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  parent ??= currentResearchSignal();
  const remaining = remainingResearchMs();
  if (remaining === Infinity || remaining === undefined && localAskUnhurried()) {
    const signal = parent ?? new AbortController().signal;
    signal.throwIfAborted();
    return abortable(work(signal), signal);
  }
  return scopedTimeout(parent, remaining === undefined || remaining === Infinity ? milliseconds : Math.min(milliseconds, remaining),
    stage, "source_request_timeout_fired", work);
}

/** Only an operation with a known lifetime may report expiry. Bare deadline signals
 * cannot tell whether their owner already completed, so never report failures. */
async function scopedTimeout<T>(parent: AbortSignal | undefined, limit: number, stage: string, event: string,
  work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  parent?.throwIfAborted();
  const deadline = new AbortController();
  const timer = setTimeout(() => {
    if (parent?.aborted) return;
    recordLocalAskEvent(event, { stage, limit_ms: limit, parent_already_aborted: false });
    deadline.abort(new DOMException("Operation timed out", "TimeoutError"));
  }, limit);
  timer.unref?.();
  const signal = parent ? AbortSignal.any([parent, deadline.signal]) : deadline.signal;
  try { return await abortable(work(signal), signal); }
  finally { clearTimeout(timer); }
}

/** Covers response bodies too, including transports that ignore cancellation. */
export async function withAskTimeout<T>(parent: AbortSignal | undefined, milliseconds: number, stage: string,
  work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  parent ??= currentResearchSignal();
  const remaining = remainingResearchMs();
  if (remaining === Infinity || remaining === undefined && localAskUnhurried()) {
    recordLocalAskEvent("timeout_disabled_locally", { stage, usual_limit_ms: milliseconds });
    const signal = parent ?? new AbortController().signal;
    signal.throwIfAborted();
    return abortable(work(signal), signal);
  }
  return scopedTimeout(parent, remaining === undefined ? milliseconds : Math.min(milliseconds, remaining), stage, "timeout_fired", work);
}

/** Source transports follow the same unhurried policy as the enclosing research. */
export function sourceRequestTimeout(parent: AbortSignal | undefined, milliseconds: number, stage: string): AbortSignal {
  parent ??= currentResearchSignal();
  const remaining = remainingResearchMs();
  if (remaining === Infinity || remaining === undefined && localAskUnhurried()) return parent ?? new AbortController().signal;
  const limit = remaining === undefined || remaining === Infinity ? milliseconds : Math.min(milliseconds, remaining);
  const deadline = AbortSignal.timeout(limit);
  return parent ? AbortSignal.any([parent, deadline]) : deadline;
}

/** Local owner debugging waits for completion or cancellation. Production retains its limits. */
export function askTimeout(parent: AbortSignal | undefined, milliseconds: number, stage: string): AbortSignal {
  parent ??= currentResearchSignal();
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
  return parent ? AbortSignal.any([parent, deadline]) : deadline;
}
