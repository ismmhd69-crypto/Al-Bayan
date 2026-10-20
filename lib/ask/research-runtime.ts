import { AsyncLocalStorage } from "node:async_hooks";

const runtime = new AsyncLocalStorage<{ deadlineAt: number }>();

/** Trusted worker context only. No request body/env setting can extend the normal HTTP route. */
export function withResearchRuntime<T>(durationMs: number, work: () => T): T {
  if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > 600_000) throw new Error("invalid_research_duration");
  return runtime.run({ deadlineAt: Date.now() + durationMs }, work);
}

export function remainingResearchMs(): number | undefined {
  const value = runtime.getStore();
  return value ? Math.max(1, value.deadlineAt - Date.now()) : undefined;
}
