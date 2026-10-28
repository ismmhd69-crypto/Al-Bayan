// Offline only. No environment loading, model transport, database or source API.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Row = { sequence: number; elapsed_ms: number; event: string; data: Record<string, any> };
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function summarizeReliabilityTrace(rows: Row[]) {
  const requests = rows.filter(r => r.event === "model_request");
  const responses = new Map(rows.filter(r => r.event === "model_response").map(r => [r.data.call_id, r.data.value]));
  const candidates = new Map<string, { id: string; sourceSnapshotHash: string; rankings: unknown[]; assessments: unknown[]; draftCalls: string[] }>();
  const entry = (id: string, snapshot: unknown) => {
    if (!candidates.has(id)) candidates.set(id, { id, sourceSnapshotHash: hash(snapshot), rankings: [], assessments: [], draftCalls: [] });
    return candidates.get(id)!;
  };
  for (const row of requests) {
    const { call_id: call, phase, prompt } = row.data;
    if (!prompt || typeof prompt !== "object") continue;
    if (phase === "reranking" && Array.isArray(prompt.passages)) {
      const scores = responses.get(call)?.scores;
      prompt.passages.forEach((p: any, index: number) => {
        if (typeof p.id !== "string") throw Error("baseline_ranking_identity_missing");
        entry(p.id, p).rankings.push({ call, index, score: Array.isArray(scores) ? scores[index] : null });
      });
    }
    if (phase === "selection" && Array.isArray(prompt.candidates)) {
      for (const p of prompt.candidates) {
        if (typeof p.source?.id !== "string") throw Error("baseline_selection_identity_missing");
        entry(p.source.id, p.source);
      }
      for (const a of responses.get(call)?.assessments ?? []) {
        if (typeof a.source_id !== "string") throw Error("baseline_assessment_identity_missing");
        entry(a.source_id, a.source_id).assessments.push({ call, relevance: a.relevance, role: a.contribution?.role,
          scope: a.scope_matches_question, contextSafe: a.context_safe, requirementIds: a.supported_requirement_ids,
          relatedRequirementIds: a.related_requirement_ids, distinct: a.distinct_contribution });
      }
    }
    if (phase === "draft") for (const p of prompt.evidence_package?.passages ?? []) {
      if (typeof p.id !== "string") throw Error("baseline_draft_identity_missing");
      entry(p.id, p).draftCalls.push(call);
    }
  }
  const terminal = rows.findLast(r => r.event === "terminal_result")?.data;
  return { traceHash: hash(rows), candidates: [...candidates.values()],
    stages: rows.filter(r => r.event === "stage" && ["retrieval", "draft", "screening", "response"].includes(r.data.stage))
      .map(r => ({ sequence: r.sequence, ms: r.elapsed_ms, stage: r.data.stage, code: r.data.code })),
    modelCalls: requests.map(r => ({ id: r.data.call_id, role: r.data.role, phase: r.data.phase, requestedOutput: r.data.max_output_tokens })),
    transport: rows.filter(r => r.event === "model_transport" && ["model_usage", "chain_model_skipped", "provider_request_rejected"].includes(r.data.code))
      .map(r => ({ ms: r.elapsed_ms, code: r.data.code, model: r.data.details?.model, finish: r.data.details?.finish_reason, cost: r.data.details?.cost_usd })),
    terminal: terminal ? { status: terminal.status, failureKind: terminal.failureKind, groups: terminal.sections?.map((s: any) => ({
      group: s.group, outcome: s.outcome, claims: s.claims?.length ?? 0, sourceIds: s.sources?.map((p: any) => p.id) ?? [] })) } : null };
}

const traces = [
  ["en-islam-truth", "1347add9-4c58-4c45-a7d5-89ed01ac1dca"],
  ["en-promises", "d5bc6e78-59c8-4128-aba7-c26e92690bb9"],
  ["ar-parents", "b1da762b-41dd-4d79-8b88-b7728ea18681"],
  ["retained-quran-late-integrity", "cba03d77-ea48-41fb-95e1-5ae7189ca4ef"],
] as const;
export const reliabilityReferenceCases = [
  { id: "en-promises", language: "en", question: "What do the Quran and authentic Sunnah teach about keeping promises?", expected: "useful sourced explanation", labelStatus: "original_review_required" },
  { id: "ar-promises", language: "ar", question: "ماذا يعلمنا القرآن والسنة الصحيحة عن الوفاء بالوعود؟", expected: "useful sourced explanation", labelStatus: "original_review_required" },
  { id: "en-parents", language: "en", question: "What are the limits of obeying parents while treating them kindly?", expected: "both limits and kindness preserved", labelStatus: "original_review_required" },
  { id: "ar-parents", language: "ar", question: "ما حدود طاعة الوالدين مع وجوب الإحسان إليهما؟", expected: "both limits and kindness preserved", labelStatus: "original_review_required" },
  { id: "en-islam-truth", language: "en", question: "How can I know Islam is true?", expected: "supported explanation with its actual evidential limits", labelStatus: "evidence_inventory_and_original_review_required" },
  { id: "ar-islam-truth", language: "ar", question: "كيف يمكنني أن أعرف أن الإسلام هو الحق؟", expected: "supported explanation with its actual evidential limits", labelStatus: "evidence_inventory_and_original_review_required" },
  { id: "unrelated-evidence-control", language: "paired", expected: "unrelated sources cannot establish the requested point", labelStatus: "existing_negative_contract" },
  { id: "missing-condition-control", language: "paired", expected: "removing a necessary source condition cannot pass", labelStatus: "existing_negative_contract" },
];
function main() {
  const root = resolve("work/private-ask-evaluation/reliability-20261026/baseline"); mkdirSync(root, { recursive: true });
  for (const [id, trace] of traces) {
    const bytes = readFileSync(resolve("work/local-ask-traces", `${trace}.jsonl`), "utf8");
    const report = { id, trace, ...summarizeReliabilityTrace(bytes.trim().split(/\r?\n/).map(line => JSON.parse(line))) };
    writeFileSync(resolve(root, `${id}.json`), JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ id, candidates: report.candidates.length, terminal: report.terminal, paidCalls: 0 }));
  }
  writeFileSync(resolve(root, "reference-cases.json"), JSON.stringify({ version: 1, cases: reliabilityReferenceCases,
    policy: "Fixed public questions. No question replacement or favorable-output retries. Semantic labels require original review; saved model verdicts are not labels." }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
