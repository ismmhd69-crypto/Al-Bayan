// Private metadata snapshot only. No environment loading, provider construction or network calls.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { extractJsonObject } from "../lib/ai/nvidia";
import { parseClaimAudit, type Claim } from "../lib/ask/checks";

export const REPAIR_TRACE_IDS = [
  "4e5a8450-25cd-46d6-a32c-c369330e8a8c", "917dc7fa-706f-4010-a043-c4f5cf29fa26",
  "585fac8c-9ef6-4e08-81b6-372e3ea395cc", "3ed47b16-0347-4847-ae8a-c0420bdee839",
  "9fd0c6e6-0fba-4c13-b7e0-0583fbb833c4", "d814df06-6f24-4c83-a5f3-2e11e8f98973",
] as const;
type TraceRow = { request_id: string; sequence: number; event: string; elapsed_ms?: number; data: Record<string, unknown> };
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v) ?? "null").digest("hex");
const label = (v: unknown) => typeof v === "string" && /^[A-Za-z0-9_/:.\-|]{1,300}$/.test(v) ? v : "unknown";
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const phases = new Set(["frame", "reranking", "selection", "draft", "screening"]);

/** Replay exact recorded JSON and claim-audit envelopes in memory. Output hashes/counts only.
 * A parsed positive model verdict is recorded, never promoted to source-faithfulness acceptance. */
export function summariseRepairTrace(id: string, rows: TraceRow[]) {
  if (!REPAIR_TRACE_IDS.includes(id as typeof REPAIR_TRACE_IDS[number]) || !rows.length
    || rows.some((r, i) => r.request_id !== id || r.sequence !== i + 1)) throw new Error("invalid_repair_trace_identity");
  const requests = new Map<string, Record<string, unknown>>();
  const replays: object[] = [];
  for (const row of rows) {
    const d = object(row.data);
    if (row.event === "model_request") requests.set(String(d.call_id), d);
    if (row.event === "stage" && d.code === "provider_visible_output") {
      const details = object(d.details), text = details.content;
      if (typeof text === "string") replays.push({ kind: "json_envelope", call: label(details.call_id),
        parsed: extractJsonObject(text) !== null, exactOutputHash: hash(text) });
    }
    if (row.event === "model_response") {
      const request = requests.get(String(d.call_id)), prompt = object(request?.prompt);
      const claims = Array.isArray(prompt.claims) ? prompt.claims : [];
      const typed: Claim[] = claims.map(c => { const x = object(c); return { text: String(x.claim ?? ""), refs: Array.isArray(x.source_ids) ? x.source_ids as string[] : [] }; });
      const audit = d.phase === "screening" && typed.length ? parseClaimAudit(d.value, typed) : null;
      replays.push({ kind: "recorded_model_response", call: label(d.call_id), phase: phases.has(String(d.phase)) ? d.phase : "unknown",
        inputHash: hash(request?.prompt), outputHash: hash(d.value), modelVerdictSupported: audit?.supported ?? null,
        claims: typed.length, semanticAcceptance: "not_established" });
    }
  }
  const terminal = [...rows].reverse().find(r => r.event === "terminal_result");
  return { id, terminal: label(terminal?.data.status), elapsedMs: number(terminal?.elapsed_ms),
    diagnostics: rows.filter(r => r.event === "stage" && ["selection", "selection_retry", "draft", "screening", "answer"].includes(String(r.data.stage)))
      .map(r => ({ stage: label(r.data.stage), code: label(r.data.code), elapsedMs: number(r.elapsed_ms) })),
    sourceCounts: rows.filter(r => r.event === "stage" && r.data.code === "source_groups_ready").map(r => {
      const d = object(r.data.details); return { quran: number(d.quran), hadith: number(d.hadith), scholar: number(d.scholar) };
    }), replays, acceptance: "unreviewed_baseline_only" };
}

function main() {
  const root = resolve(process.cwd()), privateRoot = resolve(root, "work/private-ask-evaluation");
  const out = process.argv.find(a => a.startsWith("--out="))?.slice(6);
  if (!out || !resolve(out).startsWith(privateRoot + sep) || existsSync(out)) throw new Error("use_new_private_baseline_path");
  const files = ["lib/ask/core.ts", "lib/ask/rich-engine.ts", "lib/ask/retrieval.ts", "lib/ask/package.ts", "lib/ask/tiered.ts", "lib/ai/openrouter.ts", "lib/ai/index.ts", "lib/ask/patient-pipeline.ts"];
  const fingerprints = Object.fromEntries(files.map(file => [file, hash(readFileSync(resolve(root, file), "utf8"))]));
  const cases = REPAIR_TRACE_IDS.map(id => {
    const file = resolve(root, "work/local-ask-traces", `${id}.jsonl`);
    if (!existsSync(file)) return { id, status: "trace_missing_no_replay", acceptance: "not_established" };
    const body = readFileSync(file, "utf8");
    if (Buffer.byteLength(body) > 6 * 1024 * 1024) throw new Error("repair_trace_too_large");
    return { ...summariseRepairTrace(id, body.split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l))), traceHash: hash(body) };
  });
  const report = { version: 1, at: new Date().toISOString(), scope: "local_recorded_baseline_no_model_calls", fingerprints,
    spendingLedgerHash: hash(readFileSync(resolve(root, "docs/ask-repair-runs/spend.json"), "utf8")),
    rawTraceRetention: "unchanged; no prompts, source originals or conversation history copied into this report", cases,
    completeReplaySet: cases.every(c => !("status" in c)), sourceFaithfulnessAcceptance: "not_established" };
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(resolve(out), JSON.stringify(report, null, 2), { flag: "wx", mode: 0o600 });
  console.info(JSON.stringify({ report: out, recordedCases: cases.length, completeReplaySet: report.completeReplaySet, paidCalls: 0, acceptance: report.sourceFaithfulnessAcceptance }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
