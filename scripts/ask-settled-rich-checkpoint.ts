// Owner-only evaluation continuation. Not imported by website routes or workers.
import { createHash } from "node:crypto";
import type { AIProvider, JsonRequest } from "../lib/ai/types";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { parseQuestionFrame, parseEvidencePackage, type PassageForSelection, type Source } from "../lib/ask/retrieval";
import { flattenTieredSelection } from "../lib/ask/tiered";
import { selectionSource, sealedPackageJson } from "../lib/ask/core";
import { RICH_CAPS } from "../lib/ask/rich-engine";
import { hadithAllowed } from "../lib/sources/hadith-rules";
import { scholarQuoteAllowed, type ScholarQuote } from "../lib/sources/scholar-rules";
import type { Verse } from "../lib/sources/quran-meta";
import type { CampaignCall } from "./ask-arabic-campaign-guard";

export const checkpointCanonical = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(checkpointCanonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => `${JSON.stringify(k)}:${checkpointCanonical(x)}`).join(",")}}`;
  return JSON.stringify(v);
};
export const draftRequestKey = (model: string, request: JsonRequest) => createHash("sha256").update(checkpointCanonical({ model,
  system: request.system, prompt: JSON.parse(request.prompt), schema: request.schema, maxOutputTokens: request.maxOutputTokens ?? 2048, thinking: request.thinking, structuredOutput: request.structuredOutput })).digest("hex");
export type SettledDraft = { model: string; request: JsonRequest; value: unknown; generationId: string; paidFingerprint: string };

export function checkpointWriter(provider: AIProvider, drafts: SettledDraft[], allowCorrection: boolean, reused: (draft: SettledDraft) => void): AIProvider {
  const cache = new Map<string, SettledDraft>(), consumed = new Set<string>(); let correctionStarted = false;
  for (const draft of drafts) {
    if (draft.model !== provider.id || !draft.generationId || draft.request.structuredOutput !== true
      || !structuredOutputContract(draft.request.schema).parse(JSON.stringify(draft.value))) throw Error("settled_draft_invalid");
    const key = draftRequestKey(provider.id, draft.request);
    if (cache.has(key)) throw Error("settled_draft_ambiguous");
    cache.set(key, draft);
  }
  return { id: provider.id, async generateJson(request) {
    const key = draftRequestKey(provider.id, request), saved = cache.get(key);
    if (saved) {
      if (consumed.has(key)) throw Error("settled_draft_already_consumed_no_paid_repeat");
      consumed.add(key); reused(saved); return structuredClone(saved.value);
    }
    const input = JSON.parse(request.prompt);
    if (!allowCorrection || correctionStarted || !Array.isArray(input.correction?.reason_codes)) throw Error("checkpoint_request_changed_or_new_write_not_authorized");
    correctionStarted = true;
    return provider.generateJson(request);
  } };
}

/** Re-run the actual selector parser over complete recorded records, then bind
 * the resulting package to the exact sealed package supplied to the paid writer.
 * This restores a selection decision; it never approves religious meaning. */
export function restoreRichCheckpoint(events: any[], receipts: CampaignCall[], question: string) {
  if (!receipts.length || receipts.some(c => c.cost === undefined)) throw Error("checkpoint_receipt_uncertain");
  const request = (phase: string) => events.find(e => e.event === "model_request" && e.data.phase === phase)?.data;
  const response = (id: string) => events.find(e => e.event === "model_response" && e.data.call_id === id)?.data.value;
  const frameRequest = request("frame"), selectRequest = request("selection"), firstDraft = request("draft");
  if (!frameRequest || !selectRequest || !firstDraft) throw Error("checkpoint_incomplete");
  const input = events.find(e => e.event === "pipeline_input")?.data;
  if (input?.question !== question || input.language !== "ar" || input.rich !== true) throw Error("checkpoint_question_changed");
  const frame = parseQuestionFrame(response(frameRequest.call_id));
  if (!frame || frame.language !== "ar" || frame.kind !== "question" || frame.checklistStatus !== "complete" || frame.clarificationNeeded) throw Error("checkpoint_frame_invalid");
  const sources = new Map<string, Source>(), verses = new Map<string, Verse>();
  for (const event of events) {
    if (event.event !== "source_finished") continue;
    const d = event.data;
    if (!["getVerse", "neighbours", "searchHadith", "searchScholars", "searchScholarsLive"].includes(d.source)) continue;
    for (const value of Array.isArray(d.result) ? d.result : [d.result]) {
      if (!value) continue;
      let source: Source | undefined, id: string | undefined;
      if (["getVerse", "neighbours"].includes(d.source) && value.key && value.arabic) {
        id = `Q${value.key}`; source = { kind: "quran", verse: value }; verses.set(value.key, value);
      } else if (d.source === "searchHadith" && hadithAllowed(value)) { id = value.id; source = { kind: "hadith", hadith: value }; }
      else if (["searchScholars", "searchScholarsLive"].includes(d.source) && scholarQuoteAllowed(value)) { id = value.id; source = { kind: "scholar", quote: value }; }
      if (!source || !id) continue;
      const previous = sources.get(id);
      if (previous && checkpointCanonical(previous) !== checkpointCanonical(source)) throw Error("checkpoint_source_revision_ambiguous");
      sources.set(id, source);
    }
  }
  const selectionInput = typeof selectRequest.prompt === "string" ? JSON.parse(selectRequest.prompt) : selectRequest.prompt;
  const offered = ["quran", "hadith", "scholar"].flatMap(g => selectionInput[`${g}_candidates`] ?? []);
  const byId = new Map<string, PassageForSelection>();
  for (const row of offered) {
    const source = sources.get(row.source?.id);
    if (!source) throw Error("checkpoint_candidate_original_missing");
    const context = (row.surrounding_context ?? []).map((c: { arabic: string }) => {
      const matches = [...verses.values()].filter(v => v.arabic === c.arabic && (source.kind !== "quran"
        || v.key.split(":")[0] === source.verse.key.split(":")[0] && Math.abs(Number(v.key.split(":")[1]) - Number(source.verse.key.split(":")[1])) === 1));
      if (matches.length !== 1) throw Error("checkpoint_context_ambiguous");
      return matches[0];
    });
    const candidate: PassageForSelection = { id: row.source.id, source, context, ...(row.context_availability ? { contextAvailability: row.context_availability } : {}) };
    if (checkpointCanonical(selectionSource(candidate, new Set())) !== checkpointCanonical(row)) throw Error("checkpoint_candidate_changed");
    byId.set(candidate.id, candidate);
  }
  const order = events.find(e => e.event === "stage" && e.data.code === "ranked_sources")?.data.details.sources.map((s: { source_id: string }) => s.source_id);
  if (!Array.isArray(order) || order.length !== byId.size || new Set(order).size !== order.length || order.some(id => !byId.has(id))) throw Error("checkpoint_ranking_missing");
  const candidates = order.map(id => byId.get(id)!);
  const selected = flattenTieredSelection(response(selectRequest.call_id), candidates);
  const pack = parseEvidencePackage(selected, frame, candidates, { requireContributions: true, caps: RICH_CAPS, tierOrder: true, preferredIds: new Set(), namedPassages: [] });
  const originalPackage = (typeof firstDraft.prompt === "string" ? JSON.parse(firstDraft.prompt) : firstDraft.prompt).evidence_package;
  if (!pack || pack.partial || pack.scholarDifference || checkpointCanonical(sealedPackageJson(pack, "ar", false, true)) !== checkpointCanonical(originalPackage)) throw Error("checkpoint_sealed_package_changed");
  const drafts: SettledDraft[] = events.filter(e => e.event === "model_request" && e.data.phase === "draft").filter(e => response(e.data.call_id) !== undefined).map(e => {
    const d = e.data, usage = events.find(u => u.event === "model_transport" && u.data.call_id === d.call_id && u.data.code === "model_usage")?.data.details;
    const matches = receipts.filter(c => c.model === usage?.model?.replace(/^openrouter\//, "") && c.cost === usage?.cost_usd && c.promptTokens === usage?.prompt_tokens && c.completionTokens === usage?.completion_tokens && c.finishReason === "stop");
    if (matches.length !== 1 || !matches[0].generationId) throw Error("checkpoint_draft_receipt_missing_or_ambiguous");
    return { model: d.model, request: { system: d.system, prompt: typeof d.prompt === "string" ? d.prompt : JSON.stringify(d.prompt), schema: d.schema, maxOutputTokens: d.max_output_tokens, thinking: d.thinking, structuredOutput: true },
      value: response(d.call_id), generationId: matches[0].generationId!, paidFingerprint: matches[0].fingerprint };
  });
  if (drafts.length !== 2) throw Error("checkpoint_expected_two_settled_drafts");
  return { pack, drafts };
}

/** The caller must use the existing rights-filtered library reader, not arbitrary
 * table rows or recorded snapshots. An absent/changed identity never falls back. */
export function sameApprovedScholar(original: ScholarQuote, fresh: ScholarQuote[]): "valid" | "changed" | "unavailable" {
  const matches = fresh.filter(q => q.id === original.id);
  if (!matches.length) return "unavailable";
  if (matches.length !== 1 || !scholarQuoteAllowed(original) || !scholarQuoteAllowed(matches[0])) return "changed";
  return checkpointCanonical(original) === checkpointCanonical(matches[0]) ? "valid" : "changed";
}
