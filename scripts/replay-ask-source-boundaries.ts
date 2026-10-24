// Owner-only offline replay. No credentials, transport, model calls or changes
// to the saved attempt, review, bank or spending records.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkSourceBoundaries } from "../lib/ask/source-boundary-guards";
import { sourceWritingBoundary } from "../lib/ask/source-writing-boundary";
import type { JsonRequest } from "../lib/ai/types";

export function replaySourceBoundaries() {
  const report = JSON.parse(readFileSync("work/private-ask-evaluation/meaning-quality-live-R03-20261024.json", "utf8"));
  if (report.independentReview?.status !== "reviewed_failed_source_faithfulness_stop_sample") throw Error("reviewed_attempt_required");
  const originals: { id: string; arabic: string }[] = [];
  for (const s of report.sections) for (const p of s.sources) if (!originals.some(o => o.id === p.id)) originals.push({ id: p.id, arabic: p.evidence.arabic });
  const items = report.sections.flatMap((s: any) => s.claims);
  const positions = report.sections.flatMap((s: any) => s.claims.map((_: unknown, index: number) => ({ group: s.group, index })));
  const review = checkSourceBoundaries(items, originals);
  const findings = review.failures.map(f => ({ ...positions[Number(f.claim_id.slice(1)) - 1], code: f.code }));
  const expected = ["quran:2:uncited_alternative", "scholar:1:explicit_condition_unaccounted", "summary:1:explicit_condition_unaccounted"];
  if (JSON.stringify(findings.map(f => `${f.group}:${f.index}:${f.code}`)) !== JSON.stringify(expected)) throw Error("recorded_failure_replay_mismatch");
  const trace = readFileSync(`work/local-ask-traces/${report.requestId}.jsonl`, "utf8").trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const originalRequest = trace.find(e => e.event === "model_request" && e.data.prompt.sections_to_write?.length === 1 && e.data.prompt.sections_to_write[0] === "quran")?.data;
  if (!originalRequest) throw Error("recorded_source_writer_missing");
  const before = originalRequest.prompt;
  const request: JsonRequest = { system: originalRequest.system, prompt: JSON.stringify(before), schema: originalRequest.schema, maxOutputTokens: originalRequest.max_output_tokens };
  const after = JSON.parse(sourceWritingBoundary(request).prompt);
  if (after.evidence_package.passages.some((p: any) => !before.citable_source_ids_by_section.quran.includes(p.id))) throw Error("uncitable_positive_source_retained");
  for (const p of after.evidence_package.passages) if (JSON.stringify(p) !== JSON.stringify(before.evidence_package.passages.find((q: any) => q.id === p.id))) throw Error("own_original_or_context_changed");
  const bank = JSON.parse(readFileSync("work/private-ask-evaluation/meaning-quality-bank-v3-20261024.json", "utf8"));
  const faithful = bank.cases.filter((c: any) => c.expected === "faithful_paraphrase");
  const unexpected = faithful.filter((c: any) => checkSourceBoundaries([c.item], c.serialized.passages).blocked.length).map((c: any) => c.id);
  if (unexpected.length) throw Error(`faithful_bank_rejected:${unexpected.join(",")}`);
  return { status: "offline_replay_only", reviewedClaims: items.length, findings, faithfulBankCasesNotFlagged: faithful.length,
    quranWriterOriginalsBefore: before.evidence_package.passages.length, quranWriterOriginalsAfter: after.evidence_package.passages.length,
    quranWriterPromptCharactersBefore: JSON.stringify(before).length, quranWriterPromptCharactersAfter: JSON.stringify(after).length,
    paidCalls: 0, modelAccuracyProved: false, savedAttemptChanged: false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(replaySourceBoundaries()));
