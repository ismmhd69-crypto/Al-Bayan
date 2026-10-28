import type { RichFailureKind } from "./rich-answer";

/** Fixed reason codes only. Never expose exception messages to the reader. */
export function researchFailure(error: unknown, explicitStop = false): RichFailureKind {
  if (explicitStop || error === "answer_stopped" || (error as {message?:string})?.message === "answer_stopped") return "cancelled";
  const e = error as { name?: string; code?: string; message?: string } | null;
  if (e?.name === "ResearchSessionStop") return ["incompatible", "expired"].includes(e.code ?? "") ? "checkpoint_incompatible" : e.code === "billing_uncertain" ? "billing_uncertain"
    : e.code === "cancelled" ? "cancelled" : "spending_limit";
  if (e?.name === "ResponseAborted" || e?.message === "interrupted_stream") return "connection_interrupted";
  if (e?.message === "stable_research_budget_exhausted") return "spending_limit";
  return "transport_failure";
}
