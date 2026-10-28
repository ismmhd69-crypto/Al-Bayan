// Saved receipts only. No model requests, source requests or visitor text in this report.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ids = ["1347add9-4c58-4c45-a7d5-89ed01ac1dca", "d5bc6e78-59c8-4128-aba7-c26e92690bb9", "b1da762b-41dd-4d79-8b88-b7728ea18681"];
const samples: object[] = [];
for (const id of ids) {
  const rows = readFileSync(resolve("work/local-ask-traces", `${id}.jsonl`), "utf8").trim().split("\n").map(line => JSON.parse(line));
  const requests = new Map(rows.filter(r => r.event === "model_request").map(r => [r.data.call_id, r.data]));
  for (const row of rows.filter(r => r.event === "model_transport" && r.data.code === "model_usage")) {
    const usage = row.data.details, request = requests.get(row.data.call_id);
    samples.push({ requestId: id, callId: row.data.call_id, phase: row.data.phase, role: row.data.role, actualModel: usage.model,
      sections: request?.prompt?.sections_to_write ?? [], correction: !!request?.prompt?.correction,
      requestedTokens: request?.max_output_tokens ?? null, completionTokens: usage.completion_tokens ?? null,
      reasoningTokens: usage.reasoning_tokens ?? null, finishReason: usage.finish_reason ?? null, costUsd: usage.cost_usd ?? null });
  }
}
const root = resolve("work/private-ask-evaluation/reliability-20261026"); mkdirSync(root, { recursive: true });
writeFileSync(resolve(root, "output-allowances.json"), JSON.stringify({ modelCalls: 0, samples }, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ sourceWriting: samples.filter((s: any) => s.phase === "draft"),
  otherCutoffs: samples.filter((s: any) => s.finishReason === "length" && s.phase !== "draft") }, null, 2));
