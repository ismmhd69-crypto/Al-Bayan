import { createHash } from "node:crypto";
import type { ModelTransport } from "@/lib/ai/transport";

export type RecordedModelResponse = {
  status: number;
  body: string;
  contentType: string;
  providerRequestId?: string;
};
export type ModelAttempt =
  | { state: "reserved" }
  | { state: "unsettled"; response: RecordedModelResponse }
  | { state: "settled"; response: RecordedModelResponse; costUsd: number };

/** Implementations must bind one owned job, encrypt response bodies, enforce the worker lease,
 * atomically reserve before sending, and durably commit before acknowledging writes.
 * A reservation must also enforce the job's spending cap. No production store is implied here. */
export interface ModelAttemptStore {
  /** Before replay begins, verify this worker's lease and pause the entire job if ANY older
   * reserved/unsettled attempt exists. A changed search result must not bypass an uncertain bill. */
  startRun(): Promise<void>;
  reserve(key: string): Promise<{ acquired: true } | { acquired: false; attempt: ModelAttempt }>;
  record(key: string, response: RecordedModelResponse, costUsd: number | null): Promise<void>;
}

export class ModelReconciliationRequired extends Error {
  constructor(readonly attemptKey: string) {
    super("model_attempt_requires_reconciliation");
    this.name = "ModelReconciliationRequired";
  }
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function boundedBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("model_response_too_large");
      }
      chunks.push(chunk.value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { reader.releaseLock(); }
}

function receipt(response: RecordedModelResponse): number | null {
  // A missing usage receipt, including an HTTP error, is not evidence of zero cost.
  try {
    const value = JSON.parse(response.body);
    const cost = value?.usage?.cost;
    return typeof cost === "number" && Number.isFinite(cost) && cost >= 0 ? cost : null;
  } catch { return null; }
}

const restore = (response: RecordedModelResponse) => new Response(response.body, {
  status: response.status, headers: { "content-type": response.contentType },
});

/** Construct a fresh dispatcher for each deterministic job replay. Identical HTTP attempts have
 * distinct ordinals, while a replay starts its ordinals again and reuses committed responses.
 * This does not guarantee exactly-once provider execution: ambiguous sends stop, never retry. */
export function journalledModelTransport(store: ModelAttemptStore, send: ModelTransport): ModelTransport {
  const ordinals = new Map<string, number>();
  let ready: Promise<void> | undefined;
  return async (target, init) => {
    init.signal?.throwIfAborted();
    await (ready ??= store.startRun());
    init.signal?.throwIfAborted();
    const url = new URL(target);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || init.method !== "POST" || typeof init.body !== "string") throw new Error("unsupported_model_transport");
    // Never persist credentials, headers, raw prompts, or target URLs as keys.
    const fingerprint = digest(JSON.stringify([url.href, init.method, init.body]));
    const ordinal = (ordinals.get(fingerprint) ?? 0) + 1;
    ordinals.set(fingerprint, ordinal);
    const key = `${fingerprint}:${ordinal}`;
    const reservation = await store.reserve(key);
    init.signal?.throwIfAborted();
    if (!reservation.acquired) {
      if (reservation.attempt.state !== "settled") throw new ModelReconciliationRequired(key);
      return restore(reservation.attempt.response);
    }
    // Any exception after reserve leaves an uncertain attempt. Do not clear it or fall back.
    try {
      const raw = await send(target, init);
      const response: RecordedModelResponse = {
        status: raw.status, contentType: raw.headers.get("content-type") ?? "application/json",
        body: await boundedBody(raw),
      };
      try {
        const id = JSON.parse(response.body)?.id;
        if (typeof id === "string" && /^[a-zA-Z0-9_-]{1,200}$/.test(id)) response.providerRequestId = id;
      } catch { /* Non-JSON responses remain unsettled. */ }
      const cost = receipt(response);
      await store.record(key, response, cost);
      if (cost === null) throw new ModelReconciliationRequired(key);
      return restore(response);
    } catch (error) {
      if (error instanceof ModelReconciliationRequired) throw error;
      // A timeout must not become a provider's Busy error and trigger another paid call.
      throw new ModelReconciliationRequired(key);
    }
  };
}
