import type { AskResult } from "@/lib/ask/core";
import type { RichCallbacks, RichEvent, RichStreamState } from "@/lib/ask/rich-answer";
import { emptyRichState, reduceRichEvent, validRichAnswer } from "@/lib/ask/rich-answer";
import { validateAnswerV2 } from "@/lib/ask/answer-v2";
import { parseUserHistory } from "@/lib/ask/conversation";
import { isLocale, type Locale } from "@/lib/i18n";
import { abortable } from "@/lib/ask/abort";
import { withModelTransport, type ModelTransport } from "@/lib/ai/transport";
import { withResearchRuntime } from "@/lib/ask/research-runtime";
import { withAskRequest } from "@/lib/ask/trace-context";
import { ModelReconciliationRequired, journalledModelTransport } from "./transport-journal";
import { ResearchStorageError, type ResearchJobStore } from "./job-store";

export type ResearchRequest = { version: 1; question: string; lang: Locale; previous_user_messages: string[]; engineRevision: string };
export function parseResearchRequest(value: unknown): ResearchRequest {
  const r = value as ResearchRequest | null;
  if (!r || r.version !== 1 || typeof r.question !== "string" || !r.question.trim() || r.question.length > 500
    || !isLocale(r.lang) || typeof r.engineRevision !== "string" || !/^[a-f0-9]{64}$/.test(r.engineRevision)) throw new Error("invalid_research_request");
  const history = parseUserHistory(r.previous_user_messages);
  if (!history) throw new Error("invalid_research_history");
  return { version: 1, question: r.question.trim(), lang: r.lang, previous_user_messages: history, engineRevision: r.engineRevision };
}

type WorkerStore = Pick<ResearchJobStore, "claim" | "pulse" | "history" | "hold" | "append" | "attempts">;
type WorkerOutcome = "idle" | "complete" | "incomplete" | "failed" | "lease_lost" | "held" | "interrupted";
export type ResearchWorkerDeps = {
  store: WorkerStore;
  engineRevision: string;
  durationMs: number;
  maxAttemptCostUsd: number;
  execute(request: ResearchRequest, callbacks: RichCallbacks, signal: AbortSignal): Promise<AskResult>;
  /** Defaults to real fetch only in the configured worker. Offline tests inject a fake. */
  send?: ModelTransport;
  signal?: AbortSignal;
};
class ReplayChanged extends Error {}
type WithoutIdentity<T> = T extends unknown ? Omit<T, "request_id" | "sequence"> : never;
type EventBody = WithoutIdentity<RichEvent>;

function terminalState(result: AskResult, state: RichStreamState): "complete" | "incomplete" | "failed" {
  if (result.status === "rich_answer") {
    if (!validRichAnswer(result.answer) || state.withdrawn || JSON.stringify(state.sections) !== JSON.stringify(result.answer.sections)) throw new Error("invalid_worker_completion");
    return "complete";
  }
  if (result.status === "answer") {
    // This comes from the trusted pipeline's prepared/live loader, never a model's trust label.
    // Public reconnect reads must separately revalidate the current approval and originals.
    const answer = result.answer.v2;
    if (!answer || state.sections.length || state.withdrawn || !validateAnswerV2(answer, { origin: answer.origin, review: answer.review }).ok) throw new Error("invalid_worker_legacy_answer");
    return "complete";
  }
  return result.status === "incomplete" ? "incomplete" : "failed";
}

/** One claimed job. HTTP connections are not involved. Restart replays committed model
 * responses and checks prior sections before appending new ones. Unknown billing stops replay. */
export async function runNextResearchJob(deps: ResearchWorkerDeps): Promise<WorkerOutcome> {
  if (!/^[a-f0-9]{64}$/.test(deps.engineRevision) || !Number.isInteger(deps.durationMs) || deps.durationMs < 1000 || deps.durationMs > 600_000) throw new Error("invalid_research_worker_policy");
  deps.signal?.throwIfAborted();
  const lease = await deps.store.claim();
  if (!lease) return "idle";
  const cancel = new AbortController();
  const duration = AbortSignal.timeout(deps.durationMs);
  const signal = AbortSignal.any([cancel.signal, duration, ...(deps.signal ? [deps.signal] : [])]);
  let state = emptyRichState(), sequence = lease.sequence, heartbeat: ReturnType<typeof setTimeout> | undefined;
  let heartbeatWork: Promise<void> = Promise.resolve(), writes: Promise<void> = Promise.resolve();
  let queueError: unknown, closed = false;
  const language = isLocale((lease.request as ResearchRequest)?.lang) ? (lease.request as ResearchRequest).lang : "en";
  const pulse = () => {
    heartbeat = setTimeout(() => {
      heartbeatWork = deps.store.pulse(lease).then(() => { if (!signal.aborted) pulse(); }, error => { cancel.abort(error); });
    }, 5000);
  };
  const append = async (payload: EventBody, terminal?: "complete" | "incomplete" | "failed") => {
    const event = { ...payload, request_id: lease.id, sequence: sequence + 1 } as RichEvent;
    const next = reduceRichEvent(state, event);
    sequence = await deps.store.append(lease, sequence, event, terminal);
    state = next;
  };
  const queue = (work: () => Promise<void>) => {
    if (closed || signal.aborted) return;
    writes = writes.then(async () => { if (queueError || closed || signal.aborted) return; await work(); }).catch(error => { queueError = error; cancel.abort(error); });
  };
  try {
    pulse();
    const history = await deps.store.history(lease);
    if (history.sequence !== sequence) throw new Error("research_history_changed");
    for (const event of history.events) {
      const payload = event.payload as RichEvent;
      if (payload?.request_id !== lease.id || payload.sequence !== event.sequence) throw new Error("invalid_worker_history_identity");
      state = reduceRichEvent(state, payload);
    }
    if (state.terminal) throw new Error("terminal_job_reclaimed");
    if (state.withdrawn) {
      await append({ type: "terminal", result: { status: "incomplete", language, withdraw: true, sections: [] } }, "incomplete");
      return "incomplete";
    }
    const request = parseResearchRequest(lease.request);
    if (request.engineRevision !== deps.engineRevision) throw new ReplayChanged("research_engine_changed");
    const oldSections = [...state.sections];
    let replayed = 0;
    const transport = journalledModelTransport(deps.store.attempts(lease, deps.maxAttemptCostUsd), deps.send ?? ((url, init) => fetch(url, init)));
    let result = await abortable(withResearchRuntime(deps.durationMs, () => withAskRequest(lease.id, () => withModelTransport(transport, () => deps.execute(request, {
      onProgress: stage => queue(async () => { if (replayed >= oldSections.length) await append({ type: "progress", stage }); }),
      onSection: section => queue(async () => {
        if (replayed < oldSections.length) {
          if (JSON.stringify(section) !== JSON.stringify(oldSections[replayed++])) throw new ReplayChanged("research_section_changed");
        } else await append({ type: "section", section });
      }),
      onWithdraw: () => queue(async () => { replayed = oldSections.length; await append({ type: "withdraw" }); }),
    }, signal)))), signal);
    await writes;
    if (queueError) throw queueError;
    if (!state.withdrawn && replayed < oldSections.length) throw new ReplayChanged("research_section_missing");
    if ((result.status === "rich_answer" && result.answer.language !== request.lang)
      || (result.status === "answer" && result.answer.language !== request.lang)) throw new Error("worker_answer_language_mismatch");
    if (result.status === "incomplete" || ((state.sections.length || state.withdrawn) && result.status !== "rich_answer" && result.status !== "answer")) {
      result = { status: "incomplete", language, withdraw: state.withdrawn || (result.status === "incomplete" && result.withdraw), sections: state.sections };
    }
    const terminal = terminalState(result, state);
    await append({ type: "terminal", result }, terminal);
    return terminal;
  } catch (error) {
    await writes;
    if (deps.signal?.aborted) return "interrupted"; // Redelivery uses the same job after its lease expires.
    const reason = queueError ?? (signal.aborted ? signal.reason : error);
    if (reason instanceof ResearchStorageError && reason.code === "lease_lost") return "lease_lost";
    if (reason instanceof ModelReconciliationRequired || (reason instanceof ResearchStorageError && reason.code === "reconciliation_required")) {
      await deps.store.hold(lease).catch(() => {}); return "held";
    }
    try {
      if (reason instanceof ReplayChanged && state.sections.length && !state.withdrawn) await append({ type: "withdraw" });
      const result = { status: "incomplete", language,
        withdraw: state.withdrawn, sections: state.sections };
      await append({ type: "terminal", result }, "incomplete");
      return "incomplete";
    } catch (failure) {
      if (failure instanceof ResearchStorageError && failure.code === "reconciliation_required") {
        await deps.store.hold(lease).catch(() => {}); return "held";
      }
      if (failure instanceof ResearchStorageError && failure.code === "lease_lost") return "lease_lost";
      // Ambiguous persistence is left for the leased storage's restart rules, never resubmitted.
      return "interrupted";
    }
  } finally {
    closed = true;
    if (heartbeat) clearTimeout(heartbeat);
    cancel.abort();
    await heartbeatWork;
  }
}
