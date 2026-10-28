import { validResearchContinuation, type ResearchContinuation, type RichFailureKind, type RichStreamState } from "./rich-answer";
import type { Locale } from "@/lib/i18n";

/** How a stable answer card shows a research_* reply. Checked sources stay; only the status changes.
 * busy: research is still running elsewhere. Keep an earlier result during Continue; never call it an interruption.
 * Other reasons get their real continuation reason, so "Check billing receipt" only appears for an uncertain charge. */
export function stableResearchReply(state: RichStreamState, reason: string, reply: unknown, continuing: boolean, language: Locale): RichStreamState {
  const sent = (reply as { continuation?: unknown } | null)?.continuation;
  // A new card has no saved link yet: keep the one the server sent with its reply.
  const known = state.continuation ?? (validResearchContinuation(sent) ? sent : undefined);
  if (reason === "busy") return { ...state, terminal: true, continuation: known ? { ...known, available: false, reason: "busy" } : undefined,
    result: continuing && state.result ? state.result : { status: "incomplete", language, withdraw: false, failureKind: "research_running" satisfies RichFailureKind } };
  const failureKind: RichFailureKind = reason === "incompatible" || reason === "expired" ? "checkpoint_incompatible"
    : reason === "billing_uncertain" ? "billing_uncertain" : reason === "cancelled" ? "cancelled" : "spending_limit";
  const why = reason === "incompatible" || reason === "expired" ? "expired" as const : reason === "billing_uncertain" ? "billing_uncertain" as const
    : reason === "cancelled" ? "cancelled" as const : "limit" as const;
  return { ...state, terminal: true, continuation: known ? { ...known, available: false, reason: why } : undefined,
    result: { status: "incomplete", language, withdraw: false, failureKind } };
}

/** A card that already holds checked sources (Continue) is never removed by any later reply. */
export const removeCardOnReply = (continuing: boolean) => !continuing;

/** A status check is read-only. Only the same eligible session may resume. */
export function automaticContinuation(value: unknown, token: string): ResearchContinuation | null {
  if (!validResearchContinuation(value) || value.token !== token || !value.available || value.reason || value.remaining < 1 || value.expires <= Date.now()) return null;
  return value;
}

/** Protocol and validation failures are not connection interruptions. */
export function isConnectionInterruption(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message)
    || error instanceof Error && ["interrupted_stream", "missing_stream"].includes(error.message);
}

export const isRecoverableInterruption = (failureKind: unknown) => failureKind === "transport_failure" || failureKind === "connection_interrupted";
