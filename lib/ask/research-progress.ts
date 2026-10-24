import { createHash } from "node:crypto";
import type { PassageForSelection, QuestionFrame } from "./retrieval";
import type { PatientSourceGroup } from "./patient-protocol";
import { eligibleCorpusCandidates } from "./search-engine/pipeline-corpus";
import { uniqueResearchCandidates } from "./search-engine/candidate-identity";
import { recoveryQueryKey, type RecoveryQuery } from "./search-engine/recovery";

export type ResearchQueryRecord = { query: RecoveryQuery; attempt: number; status: "planned" | "finished" | "failed" | "superseded" };
export type ResearchDiscoveryBatch = { attempt: number; requirementIds: string[]; candidateIds: string[]; searchFailed: boolean };
export type PatientResearchProgress = { version: 1; revision: number; previousHash: string | null; hash: string;
  candidates: PassageForSelection[]; working: PassageForSelection[] | null; queries: ResearchQueryRecord[];
  recoveryRounds: { attempt: number; round: number }[];
  batches: Partial<Record<PatientSourceGroup, ResearchDiscoveryBatch>> };
export type SaveResearchProgress = (progress: PatientResearchProgress) => Promise<void>;
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const families = ["quran", "hadith", "scholar"];

/** Raw research is private discovery data, never a checked answer. Limits bound
 * stored work, not elapsed answer time. A rejected snapshot never replaces the old one. */
export function validateResearchProgress(value: PatientResearchProgress, frame?: Pick<QuestionFrame, "requirements">): PatientResearchProgress {
  if (!value || value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || value.revision > 512
    || !(value.previousHash === null || typeof value.previousHash === "string" && /^[a-f0-9]{64}$/.test(value.previousHash))
    || !Array.isArray(value.candidates) || value.candidates.length > 256 || !(value.working === null || Array.isArray(value.working) && value.working.length <= 120)
    || !Array.isArray(value.queries) || value.queries.length > 256 || !Array.isArray(value.recoveryRounds) || value.recoveryRounds.length > 64
    || !value.batches || typeof value.batches !== "object" || Array.isArray(value.batches)) throw Error("invalid_research_progress");
  const { hash, ...body } = value;
  if (typeof hash !== "string" || sha(body) !== hash || Buffer.byteLength(JSON.stringify(value)) > 1_000_000) throw Error("research_progress_hash_or_budget_invalid");
  const requirement = (id: unknown) => typeof id === "string" && /^R[1-4]$/.test(id) && (!frame || frame.requirements.some(r => r.id === id));
  const pool = (items: PassageForSelection[]) => {
    const eligible = Array.from({ length: Math.ceil(items.length / 60) }, (_, i) => eligibleCorpusCandidates(items.slice(i * 60, i * 60 + 60))).flat();
    if (eligible.length !== items.length || uniqueResearchCandidates(eligible).length !== items.length
      || items.some(p => p.retrievedFor !== undefined && (!Array.isArray(p.retrievedFor) || p.retrievedFor.length > 4 || p.retrievedFor.some(id => !requirement(id))))) throw Error("research_progress_candidates_invalid");
  };
  pool(value.candidates); if (value.working) pool(value.working);
  const identity = (p: PassageForSelection) => sha({ source: p.source, context: p.context, contextAvailability: p.contextAvailability });
  if (value.working?.some(p => !value.candidates.some(c => c.id === p.id && identity(c) === identity(p)))) throw Error("research_progress_working_identity_missing");
  const keys = new Set<string>();
  const attempts = new Set<number>();
  for (const item of value.recoveryRounds) {
    if (!item || !Number.isSafeInteger(item.attempt) || item.attempt < 0 || !Number.isSafeInteger(item.round) || item.round < 1 || item.round > 2 || attempts.has(item.attempt)) throw Error("research_progress_round_invalid");
    attempts.add(item.attempt);
  }
  for (const item of value.queries) {
    const q = item?.query;
    if (!q || !requirement(q.requirementId) || !families.includes(q.family) || !["en", "ar", "de"].includes(q.language)
      || typeof q.text !== "string" || !q.text.trim() || q.text.length > 120 || q.family === "scholar" && q.language !== "ar"
      || q.language === "ar" && !/\p{Script=Arabic}/u.test(q.text) || !Number.isSafeInteger(item.attempt) || item.attempt < 0
      || !["planned", "finished", "failed", "superseded"].includes(item.status)) throw Error("research_progress_query_invalid");
    const key = `${item.attempt}:${recoveryQueryKey(q)}`;
    if (keys.has(key)) throw Error("research_progress_query_duplicate"); keys.add(key);
  }
  for (const [group, batch] of Object.entries(value.batches)) {
    if (!families.includes(group) || !batch || !Number.isSafeInteger(batch.attempt) || batch.attempt < 0 || typeof batch.searchFailed !== "boolean"
      || !Array.isArray(batch.requirementIds) || !batch.requirementIds.length || batch.requirementIds.length > 4 || batch.requirementIds.some(id => !requirement(id))
      || new Set(batch.requirementIds).size !== batch.requirementIds.length || !Array.isArray(batch.candidateIds) || batch.candidateIds.length > 60
      || new Set(batch.candidateIds).size !== batch.candidateIds.length || batch.candidateIds.some(id => !value.candidates.some(p => p.id === id && p.source.kind === group))) throw Error("research_progress_batch_invalid");
  }
  return structuredClone(value);
}

export function nextResearchProgress(previous: PatientResearchProgress | undefined, changes: Partial<Pick<PatientResearchProgress, "candidates" | "working" | "queries" | "batches" | "recoveryRounds">>, frame?: Pick<QuestionFrame, "requirements">) {
  if (previous) validateResearchProgress(previous, frame);
  const body = { version: 1 as const, revision: (previous?.revision ?? 0) + 1, previousHash: previous?.hash ?? null,
    candidates: structuredClone(changes.candidates ?? previous?.candidates ?? []),
    working: structuredClone(changes.working === undefined ? previous?.working ?? null : changes.working),
    queries: structuredClone(changes.queries ?? previous?.queries ?? []), batches: structuredClone(changes.batches ?? previous?.batches ?? {}),
    recoveryRounds: structuredClone(changes.recoveryRounds ?? previous?.recoveryRounds ?? []) };
  return validateResearchProgress({ ...body, hash: sha(body) }, frame);
}
