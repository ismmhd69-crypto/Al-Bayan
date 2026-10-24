import { withResearchRuntime } from "../research-runtime";
import { withAskRequest } from "../trace-context";
import { withModelTransport, type ModelTransport } from "@/lib/ai/transport";
import { journalledModelTransport, ModelReconciliationRequired } from "./transport-journal";
import { ResearchStorageError, type ResearchJobStore, type ResearchLease } from "./job-store";
import { emptyPatientState, reducePatientEvent, type PatientEvent } from "../patient-protocol";
import type { PatientCheckpoint } from "../patient-engine";
import { parseResearchRequest, type ResearchRequest } from "./job-worker";
import { abortable } from "../abort";

export type PatientWorkerRequest = Omit<ResearchRequest, "version"> & { version: 2 };
export type PatientWorkerDeps = {
  store: Pick<ResearchJobStore, "claim" | "history" | "pulse" | "hold" | "attempts" | "appendPatient">;
  engineRevision: string;
  maxAttemptCostUsd: number;
  execute(request: PatientWorkerRequest, checkpoint: PatientCheckpoint | undefined, append: (event: PatientEvent, checkpoint: PatientCheckpoint) => Promise<void>, signal: AbortSignal): Promise<PatientCheckpoint>;
  send?: ModelTransport;
  signal?: AbortSignal;
};

/** A long-lived worker owns the lease, not the browser or a short HTTP route. */
export async function runPatientLease(lease: ResearchLease, deps: PatientWorkerDeps): Promise<"complete" | "paused" | "failed" | "held" | "lease_lost" | "interrupted"> {
  const stop = new AbortController(), signal = AbortSignal.any([stop.signal, ...(deps.signal ? [deps.signal] : [])]);
  let timer: ReturnType<typeof setTimeout> | undefined, pulseWork: Promise<void> = Promise.resolve();
  let lastCheckpoint = lease.checkpoint;
  const pulse = () => { timer = setTimeout(() => { pulseWork = deps.store.pulse(lease).then(() => { if (!signal.aborted) pulse(); }, error => { stop.abort(error); }); }, 5000); };
  try {
    const request = { ...parseResearchRequest({ ...(lease.request as object), version: 1 }), version: 2 as const };
    if ((lease.request as { version?: unknown })?.version !== 2 || request.engineRevision !== deps.engineRevision) throw new Error("patient_engine_changed");
    const history = await deps.store.history(lease);
    let state = emptyPatientState(lease.id, request.lang);
    for (const row of history.events) {
      const event = row.payload as PatientEvent;
      if (event.sequence !== row.sequence) throw new Error("patient_history_changed");
      state = reducePatientEvent(state, event);
    }
    if (state.sequence !== lease.sequence || state.sequence && !lease.checkpoint
      || lease.checkpoint && JSON.stringify(state) !== JSON.stringify(lease.checkpoint.state)) throw new Error("patient_checkpoint_mismatch");
    pulse();
    const transport = journalledModelTransport(deps.store.attempts(lease, deps.maxAttemptCostUsd), deps.send ?? ((url, init) => fetch(url, init)));
    const append = async (event: PatientEvent, checkpoint: PatientCheckpoint) => {
      signal.throwIfAborted();
      const next = reducePatientEvent(state, event);
      if (JSON.stringify(next) !== JSON.stringify(checkpoint.state)) throw new Error("patient_checkpoint_mismatch");
      await deps.store.appendPatient(lease, event, checkpoint); state = next; lastCheckpoint = checkpoint;
    };
    const result = await abortable(withResearchRuntime(Infinity, () => withAskRequest(lease.id, () => withModelTransport(transport,
      () => deps.execute(request, lease.checkpoint, append, signal)))), signal);
    if (JSON.stringify(result.state) !== JSON.stringify(state) || !["complete", "paused", "failed", "cancelled"].includes(state.status)) throw new Error("patient_uncommitted_result");
    return state.status === "cancelled" ? "failed" : state.status as "complete" | "paused" | "failed";
  } catch (error) {
    if (deps.signal?.aborted) return "interrupted";
    const reason = signal.aborted ? signal.reason : error;
    if (reason instanceof ResearchStorageError && reason.code === "lease_lost") return "lease_lost";
    if (reason instanceof ModelReconciliationRequired || reason instanceof ResearchStorageError && reason.code === "reconciliation_required") {
      await deps.store.hold(lease).catch(() => {}); return "held";
    }
    if (lastCheckpoint?.state.status === "working") {
      const event: PatientEvent = { version: 2, job_id: lease.id, sequence: lastCheckpoint.state.sequence + 1, type: "pause", reason: "explanation_failed" };
      const paused = { ...lastCheckpoint, state: reducePatientEvent(lastCheckpoint.state, event) };
      try { await deps.store.appendPatient(lease, event, paused); return "paused"; }
      catch (failure) {
        if (failure instanceof ResearchStorageError && failure.code === "lease_lost") return "lease_lost";
      }
    }
    // An integrity failure or uncommitted reservation needs operator review, not a paid retry.
    await deps.store.hold(lease).catch(() => {}); return "held";
  } finally {
    if (timer) clearTimeout(timer); stop.abort(); await pulseWork;
  }
}
