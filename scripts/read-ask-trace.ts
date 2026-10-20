import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Row = { elapsed_ms?: number; event: string; data?: Record<string, unknown> };
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function explainTrace(rows: Row[]): string[] {
  const inputs = new Map<string, Record<string, unknown>>();
  const lines: string[] = [];
  for (const row of rows) {
    const d = row.data ?? {}, elapsed = `${((row.elapsed_ms ?? 0) / 1000).toFixed(2)}s`;
    if (row.event === "model_request") {
      inputs.set(String(d.call_id), object(d.prompt)); lines.push(`${elapsed} ${d.call_id} ${d.phase}: ${d.model} started`);
    } else if (row.event === "model_response") {
      lines.push(`${elapsed} ${d.call_id} ${d.phase}: response received`);
      const value = object(d.value), input = inputs.get(String(d.call_id)) ?? {};
      if (Array.isArray(value.requested_points)) for (const p of value.requested_points) lines.push(`  Question point: ${object(p).text}`);
      if (Array.isArray(value.claim_assessments)) for (const raw of value.claim_assessments) {
        const c = object(raw);
        if (!Array.isArray(c.reason_codes) || !c.reason_codes.length) continue;
        const claim = Array.isArray(input.claims) ? input.claims.find(p => object(p).claim_id === c.claim_id) : undefined;
        lines.push(`  Rejected ${c.claim_id}: ${object(claim).claim ?? "See model request"}`);
        lines.push(`  Reason: ${c.reason_codes.join(", ")}. ${c.explanation ?? ""}`);
        lines.push(`  Cited sources: ${Array.isArray(c.source_ids) ? c.source_ids.join(", ") : "unknown"}`);
      }
      for (const key of ["complete_coverage", "question_checklist_complete", "useful_explanation", "no_repetition", "guidance_safe", "guidance_relevant", "earlier_section_safe"])
        if (value[key] === "no" || value[key] === "unsure") lines.push(`  Failed check: ${key} = ${value[key]}`);
    } else if (["source_started", "source_finished", "source_failed"].includes(row.event)) lines.push(`${elapsed} ${d.source}: ${row.event}${d.duration_ms !== undefined ? ` (${d.duration_ms} ms)` : ""}${d.error ? ` ${JSON.stringify(d.error)}` : ""}`);
    else if (row.event === "stage") lines.push(`${elapsed} ${d.stage}: ${d.code}`);
    else if (["timeout_fired", "timeout_disabled_locally", "model_failed", "pipeline_failed", "trace_size_limit"].includes(row.event)) lines.push(`${elapsed} ${row.event}: ${JSON.stringify(d)}`);
    else if (row.event === "terminal_result") lines.push(`${elapsed} FINAL: ${d.status}`);
  }
  return lines;
}
function main() {
  const directory = resolve("work", "local-ask-traces");
  if (!existsSync(join(directory, "latest.json"))) throw new Error("No detailed local trace yet. Submit a question on the local development website first.");
  const id = process.argv.slice(2).find(v => !v.startsWith("--")) ?? object(JSON.parse(readFileSync(join(directory, "latest.json"), "utf8"))).request_id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error("Invalid local request id");
  const file = join(directory, `${id}.jsonl`);
  const rows: Row[] = readFileSync(file, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));
  console.log(`Local request ${id}\n${file}\n`);
  console.log(process.argv.includes("--full") ? JSON.stringify(rows, null, 2) : explainTrace(rows).join("\n"));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : "Could not read trace"); process.exitCode = 1; }
}
