export const DIAGNOSTIC_STAGES = ["request", "prepared", "frame", "retrieval", "candidates", "selection", "selection_retry", "package", "draft", "screening", "screening_retry", "videos", "answer", "response", "ai", "display"] as const;
export type DiagnosticStage = typeof DIAGNOSTIC_STAGES[number];
export type Diagnostic = (stage: DiagnosticStage, code: string, elapsedMs: number, details?: unknown) => void;
export type DiagnosticContext = {
  requestId: string;
  revision?: string;
  writerChain: string;
  verifierChain: string;
  claimAudit: boolean;
  tiered: boolean;
  lean: boolean;
  libraryFlow?: boolean;
};

// Fixed fields only. Neither raw AI output nor visitor content belongs in function logs.
export function diagnosticLogger(enabled: boolean, context: DiagnosticContext, sink: (line: string) => void) {
  const model = (value: string) => /^[a-zA-Z0-9._:/|+-]{1,320}$/.test(value) ? value : "unknown";
  const safe = {
    request_id: /^[a-zA-Z0-9-]{1,64}$/.test(context.requestId) ? context.requestId : "unknown",
    revision: /^[a-fA-F0-9]{7,64}$/.test(context.revision ?? "") ? context.revision : "unknown",
    writer_chain: model(context.writerChain), verifier_chain: model(context.verifierChain),
    claim_audit: context.claimAudit, tiered: context.tiered, lean: context.lean,
    ...(context.libraryFlow !== undefined ? { library_flow: context.libraryFlow } : {}),
  };
  return (stage: DiagnosticStage, code: string, elapsedMs: number, details?: unknown) => {
    if (!enabled || !(DIAGNOSTIC_STAGES as readonly string[]).includes(stage)
      || !/^[a-z][a-z0-9_]{1,80}$/.test(code) || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;
    try {
      const data = safeDetails(details);
      const line = JSON.stringify({ ...safe, stage, code, elapsed_ms: Math.round(elapsedMs), ...(data ? { details: data } : {}) });
      sink(`ask diagnostic: ${line.length <= 16000 ? line : JSON.stringify({ ...safe, stage, code, elapsed_ms: Math.round(elapsedMs), details: { logging_truncated: true } })}`);
    } catch { /* Logging must never change a visitor's result. */ }
  };
}

const containers = new Set(["requirements", "sources", "assessments", "claims", "checks", "coverage", "queries", "filters"]);
const numbers = new Set("english_query_count german_query_count arabic_query_count count question_chars history_count qualifier_count interpretation_count duration_ms deadline_ms remaining_ms quran hadith scholar videos before after dropped original_chars english_chars german_chars context_count prompt_chars schema_chars max_output_tokens attempt http_status prompt_tokens completion_tokens reasoning_tokens cost_usd simple_count list_count explanation_count note_count claim_chars unique_sources expected_count actual_count direct_count partial_count unsafe_count unassigned_count duplicate_count missing_count query_count hits ceiling_hits wrong_kind_or_unavailable missing_text length continuation title_or_topic authenticity eligible returned direct yes no unsure invalid missing covered".split(" "));
const booleans = new Set("scholar_enabled live_scholar_enabled videos_enabled prepared_enabled approved_topics_enabled logging_truncated manual_reviewed enabled skipped source_known readable english_present german_present original_present valid supported whole_answer_ok complete expected allowed configuration_missing body_valid fallback json_mode correction has_arabic_queries".split(" "));
const ids = new Set(["id", "source_id", "claim_id", "requirement_id", "call_id"]);
const lists = new Set(["source_ids", "requirement_ids", "missing_requirement_ids", "unassessed_source_ids", "dropped_source_ids"]);
const enums: Record<string, string[]> = {
  language: ["en", "de", "ar"], kind: ["quran", "hadith", "scholar", "question", "personal", "greeting", "off_topic", "harmful"],
  role: ["writer", "checker"], phase: ["frame", "selection", "draft", "screening", "videos", "prepared", "other"],
  status: ["ready", "insufficient", "ambiguous", "conflicting", "answer", "no_answer", "no_source", "no_summary", "ask_scholar", "out_of_scope", "clarify", "busy", "error", "not_ready", "rate_limited", "forbidden", "bad_request", "too_long"],
  outcome: ["started", "finished", "failed", "timeout", "busy", "aborted", "other", "matched", "miss", "disabled", "skipped"],
  coverage_decision: ["complete", "incomplete", "uncertain"], conflict: ["none", "revelation_conflict", "scholar_difference", "uncertain"],
  relevance: ["direct", "partial", "context", "mention_only", "unrelated"], context_safe: ["yes", "no", "unsure"],
  verdict: ["yes", "no", "unsure", "supported", "not_supported"], finish_reason: ["stop", "length", "content_filter", "tool_calls", "error"],
  facet: ["identity", "definition", "attributes", "ruling", "evidence", "reason", "steps", "conditions", "exceptions", "history", "comparison", "response", "meaning", "quantity", "time", "place", "general"],
  question_type: ["identity", "definition", "ruling", "evidence", "reason", "practice", "history", "comparison", "objection", "reference", "general"],
  check: ["answers_question", "covers_facets", "fair_picture", "context_preserved", "direct_answer_complete", "listed_items_complete", "no_repetition", "not_established_ok", "direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"],
};
const safeId = (value: unknown) => typeof value === "string" && /^(?:Q\d{1,3}:\d{1,3}|HE\d{1,10}|S(?:H)?[a-f0-9-]{36}|[RCAVW]\d{1,4})$/i.test(value) ? value : "invalid";
/** Explicit field/type allowlist. Unknown keys and free text never reach logs, even from models. */
export function safeDetails(raw: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || depth > 5) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw).slice(0, 80)) {
    if (numbers.has(key)) { if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e9) out[key] = value; }
    else if (booleans.has(key)) { if (typeof value === "boolean") out[key] = value; }
    else if (ids.has(key)) out[key] = safeId(value);
    else if (lists.has(key) && Array.isArray(value)) out[key] = value.slice(0, 40).map(safeId);
    else if (key === "fingerprint" && typeof value === "string" && /^[a-f0-9]{64}$/.test(value)) out[key] = value;
    else if (key === "model" && typeof value === "string" && /^(openrouter|gemini|nvidia|vertex)\/[a-zA-Z0-9._:/|+-]{1,300}$/.test(value)) out[key] = value;
    else if (enums[key]) out[key] = typeof value === "string" && enums[key].includes(value) ? value : value === undefined ? "missing" : "invalid";
    else if (containers.has(key)) {
      out[key] = Array.isArray(value) ? value.slice(0, 40).map((item) => safeDetails(item, depth + 1)).filter(Boolean) : safeDetails(value, depth + 1);
    }
  }
  return Object.keys(out).length ? out : undefined;
}
