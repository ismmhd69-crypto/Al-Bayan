import { AsyncLocalStorage } from "node:async_hooks";

const runtime = new AsyncLocalStorage<{ deadlineAt: number }>();
const cancellation = new AsyncLocalStorage<AbortSignal>();

/** Source readers without an explicit signal still belong to this answer. */
export const withResearchCancellation = <T>(signal: AbortSignal, work: () => T): T => cancellation.run(signal, work);
export const currentResearchSignal = () => cancellation.getStore();

/** Trusted execution policy for workers and the stable stream. Hosting limits are external. */
export function withResearchRuntime<T>(durationMs: number, work: () => T): T {
  if (durationMs !== Infinity && (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > 600_000)) throw new Error("invalid_research_duration");
  return runtime.run({ deadlineAt: Date.now() + durationMs }, work);
}

export function remainingResearchMs(): number | undefined {
  const value = runtime.getStore();
  return value ? Math.max(1, value.deadlineAt - Date.now()) : undefined;
}
