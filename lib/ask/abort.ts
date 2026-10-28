/** Bound even dependencies that ignore AbortSignal. Their result can never start another stage. */
export async function abortable<T>(job: Promise<T>, signal: AbortSignal): Promise<T> {
  // A job abandoned by cancellation may still reject later; that outcome is deliberately unobserved.
  Promise.resolve(job).catch(() => {});
  signal.throwIfAborted();
  let abort!: () => void;
  const stopped = new Promise<never>((_, reject) => { abort = () => reject(signal.reason ?? new Error("aborted")); signal.addEventListener("abort", abort, { once: true }); });
  try { return await Promise.race([job, stopped]); }
  finally { signal.removeEventListener("abort", abort); }
}

/** Node fetch wraps connection deadlines in a TypeError with a timeout cause. */
export function isTimeoutFailure(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth++) {
    const e = current as { name?: unknown; code?: unknown; cause?: unknown };
    if (e.name === "TimeoutError" || ["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "ETIMEDOUT"].includes(String(e.code))) return true;
    current = e.cause;
  }
  return false;
}
