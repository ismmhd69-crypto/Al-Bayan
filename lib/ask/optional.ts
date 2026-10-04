// Optional related content must never prevent returning a fully checked answer.
export async function optionalWithin<T>(
  work: (signal: AbortSignal) => Promise<T>, timeoutMs: number, parent: AbortSignal, fallback: T,
): Promise<T> {
  if (parent.aborted || timeoutMs <= 0) return fallback;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stop: () => void = () => {};
  const timeout = new Promise<T>((resolve) => {
    stop = () => { controller.abort(); resolve(fallback); };
    timer = setTimeout(stop, timeoutMs);
    parent.addEventListener("abort", stop, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(() => work(controller.signal)).catch(() => fallback), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
    parent.removeEventListener("abort", stop);
    controller.abort();
  }
}
