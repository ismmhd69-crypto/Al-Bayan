import { AsyncLocalStorage } from "node:async_hooks";
import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { localAskTraceEnabled, localAskUnhurried } from "./settings";

// Detailed content is PRIVATE local development data, never console/function telemetry.
// Rotate to 25 request files and remove files older than 24 hours on each new request;
// cap each trace at 5 MiB. Production never creates this directory.
const context = new AsyncLocalStorage<{ record: (event: string, data: unknown) => void }>();
const SECRET_KEY = /^(authorization|cookie|set-cookie|api[-_]?key|access[-_]?token|refresh[-_]?token|password|secret|headers|env|environment)$/i;
const scrub = (s: string) => s.replace(/\b(?:sk-or-v1-|sk-proj-|sk-|AIza)[A-Za-z0-9_-]{16,}/g, "[redacted credential]")
  .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, "[redacted token]")
  .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{16,}/gi, "Bearer [redacted]").replace(/([?&](?:api_key|apikey|access_token|key)=)[^&\s]+/gi, "$1[redacted]");
export function privateTraceData(value: unknown, depth = 0): unknown {
  if (depth > 22) return "[depth limit]";
  if (typeof value === "string") return scrub(value).slice(0, 100_000);
  if (typeof value === "number") return Number.isFinite(value) ? value : "unlimited";
  if (value === null || typeof value === "boolean") return value;
  if (value instanceof Error) return { name: value.name, message: scrub(value.message), stack: value.stack ? scrub(value.stack).slice(0, 10000) : undefined, cause: privateTraceData(value.cause, depth + 1) };
  if (value instanceof AbortSignal) return { aborted: value.aborted, reason: value.aborted ? privateTraceData(value.reason, depth + 1) : null };
  if (value instanceof Map) return [...value].map(([k, v]) => [k, privateTraceData(v, depth + 1)]);
  if (Array.isArray(value)) return value.slice(0, 250).map(v => privateTraceData(v, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0, 150)
    .map(([key, v]) => [key, SECRET_KEY.test(key) ? "[redacted]" : privateTraceData(v, depth + 1)]));
  return undefined;
}
export function createPrivateTrace(directory: string, requestId: string, started: number) {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(requestId)) throw new Error("invalid trace id");
  mkdirSync(directory, { recursive: true });
  const files = readdirSync(directory).filter(name => /^[a-zA-Z0-9-]{1,64}\.jsonl$/.test(name))
    .map(name => ({ name, stat: statSync(join(directory, name)) })).filter(f => f.stat.isFile()).sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  for (let i = 0; i < files.length; i++) if (i >= 24 || Date.now() - files[i].stat.mtimeMs > 86_400_000) unlinkSync(join(directory, files[i].name));
  const file = join(directory, `${requestId}.jsonl`);
  let sequence = 0, bytes = 0, capped = false;
  const record = (event: string, data: unknown) => {
    if (capped) return;
    try {
      let line = JSON.stringify({ sequence: ++sequence, request_id: requestId, at: new Date().toISOString(), elapsed_ms: Date.now() - started, event, data: privateTraceData(data) }) + "\n";
      if (bytes + Buffer.byteLength(line) > 5 * 1024 * 1024) {
        capped = true; line = JSON.stringify({ sequence, request_id: requestId, event: "trace_size_limit", data: "Detailed recording stopped at 5 MiB; answer processing continues." }) + "\n";
      }
      appendFileSync(file, line, { encoding: "utf8", mode: 0o600 }); bytes += Buffer.byteLength(line);
    } catch { /* Debugging must not fail an answer. */ }
  };
  writeFileSync(join(directory, "latest.json"), JSON.stringify({ request_id: requestId, file: `${requestId}.jsonl` }), { mode: 0o600 });
  return { record, file };
}
export function withLocalAskTrace<T>(requestId: string, started: number, work: () => T): T {
  if (!localAskTraceEnabled() || context.getStore()) return work();
  let trace: ReturnType<typeof createPrivateTrace>;
  try { trace = createPrivateTrace(join(process.cwd(), "work", "local-ask-traces"), requestId, started); }
  catch { return work(); }
  console.info(`ask local trace: work/local-ask-traces/${requestId}.jsonl`);
  return context.run(trace, () => {
    trace.record("request_started", { local_only: true, unhurried: localAskUnhurried(), retention_hours: 24 });
    return work();
  });
}
export function recordLocalAskEvent(event: string, data: unknown) {
  try { context.getStore()?.record(event, data); } catch { /* Non-interfering. */ }
}
export function observeSourceFunctions<T extends object>(deps: T): T {
  if (!localAskTraceEnabled()) return deps;
  const copy = { ...deps } as Record<string, unknown>;
  for (const name of ["search", "getVerse", "neighbours", "searchHadith", "searchScholars", "searchScholarsLive", "displayTranslationLookup"]) {
    const fn = copy[name];
    if (typeof fn !== "function") continue;
    copy[name] = async (...args: unknown[]) => {
      const started = Date.now(); recordLocalAskEvent("source_started", { source: name, input: args });
      try { const result = await fn.apply(deps, args); recordLocalAskEvent("source_finished", { source: name, duration_ms: Date.now() - started, result }); return result; }
      catch (error) { recordLocalAskEvent("source_failed", { source: name, duration_ms: Date.now() - started, error }); throw error; }
    };
  }
  return copy as T;
}
