// Offline actual-engine capture. Scripted approvals isolate the identity guard;
// they do not establish religious support. No website, source or model calls.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, strictAudit } from "../tests/fixtures/rich";
import type { EvidencePackage } from "../lib/ask/retrieval";
import type { JsonRequest } from "../lib/ai/types";

export async function prepareNamedScholarRepair() {
  const reportPath = resolve("work/private-ask-evaluation/parents-current-full-retest-20261024.json"), bytes = readFileSync(reportPath, "utf8"), saved = JSON.parse(bytes);
  const tracePath = resolve(`work/local-ask-traces/${saved.requestId}.jsonl`), traceBytes = readFileSync(tracePath, "utf8");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const serialized = events.find(e => e.event === "model_request" && e.data.call_id === "A8")?.data.prompt.evidence_package;
  const section = saved.sections.find((s: any) => s.group === "scholar");
  if (saved.independentReview?.status !== "reviewed_source_gap_and_budget_stop" || section?.claims.length !== 2 || section.sources.length !== 2 || !serialized?.question) throw Error("reviewed_parents_sources_missing");
  const pack: EvidencePackage = { question: serialized.question, cards: [], passages: section.sources.map((s: any) => {
    const p = serialized.passages.find((p: any) => p.id === s.id), e = s.evidence;
    if (!p || p.arabic !== e.arabic || p.type !== "scholar" || p.surrounding_context?.length) throw Error("original_identity_changed_or_context_not_reconstructed");
    return { id: s.id, requirementIds: s.requirementIds, explanationRequirementIds: s.explanationRequirementIds, facets: ["general"], context: [], contribution: p.contribution,
      source: { kind: "scholar", quote: { id: s.id, scholarId: e.scholarId, scholarName: { ar: e.scholarName, en: p.scholar, de: p.scholar },
        title: e.title, reference: e.reference, arabic: e.arabic, url: e.url } } };
  }) };
  const deps = dependencies(); let captured: JsonRequest | undefined;
  deps.writer.generateJson = async request => {
    const p = JSON.parse(request.prompt);
    if (p.correction) { if (captured) throw Error("second_correction_capture"); captured = { ...request, signal: undefined }; return null; }
    return { status: "answer", no_answer_feedback: [], scholar: section.claims.map((c: any) => ({ text: c.text, source_ids: c.refs, requirement_id: c.requirementId })) };
  };
  deps.verifier.generateJson = async request => strictAudit(request.prompt);
  await runRichAnswer(pack, "ar", deps, new AbortController().signal, saved.question, {}, 50_000, { sourceOnly: "scholar" });
  if (!captured || captured.maxOutputTokens !== 2200) throw Error("normal_correction_not_captured");
  const input = JSON.parse(captured.prompt);
  if (!input.correction.reason_codes.includes("scholar_not_named") || input.correction.checker_findings.sentence_patches[0].replace_indices.join() !== "0,1"
    || input.scholar_attribution_names.some((n: any) => n.short_name !== "ابن باز")) throw Error("identity_guard_not_applied");
  return { request: captured, pack, original: section.claims.map((c: any) => ({ text: c.text, source_ids: c.refs, requirement_id: c.requirementId })),
    reportPath, bytes, tracePath, traceBytes };
}
