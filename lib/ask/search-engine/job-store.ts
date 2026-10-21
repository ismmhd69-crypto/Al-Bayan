import type { EncryptedJobValue } from "./job-encryption";
import { randomUUID } from "node:crypto";
import { parseUserHistory } from "../conversation";
import { researchJobEncryption } from "./job-encryption";
import {
  ModelReconciliationRequired,
  type ModelAttemptStore,
  type RecordedModelResponse,
} from "./transport-journal";
import { isLocale, type Locale } from "@/lib/i18n";

export type ResearchRpc = (
  operation: string,
  payload: Record<string, unknown>,
) => Promise<unknown>;
export type ResearchJobState =
  | "queued"
  | "running"
  | "complete"
  | "incomplete"
  | "cancelled"
  | "failed"
  | "reconciliation_required"
  | "expired";
export type ResearchLease = {
  id: string;
  lease: string;
  sequence: number;
  request: unknown;
  expiresAt: string;
};
export type ResearchJobView = {
  id: string;
  state: ResearchJobState;
  language: Locale;
  sequence: number;
  events: { sequence: number; payload: unknown }[];
  expiresAt: string;
};
type Codec = ReturnType<typeof researchJobEncryption>;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const ATTEMPT = /^[a-f0-9]{64}:[1-9][0-9]{0,3}$/;
const states: ResearchJobState[] = [
  "queued",
  "running",
  "complete",
  "incomplete",
  "cancelled",
  "failed",
  "reconciliation_required",
  "expired",
];
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid_research_storage_response");
  return value as Record<string, unknown>;
};
const sequence = (value: unknown): number => {
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > 512
  )
    throw new Error("invalid_research_sequence");
  return value as number;
};
const timestamp = (value: unknown): string => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Error("invalid_research_expiry");
  return value;
};

export class ResearchStorageError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ResearchStorageError";
  }
}

/** Server/worker repository. Its RPC is service-only; callers must never pass visitor-controlled
 * operation names or expose the backing client. Ownership is checked again inside PostgreSQL. */
export function researchJobStore(rpc: ResearchRpc, codec: Codec) {
  const call = async (operation: string, payload: Record<string, unknown>) => {
    const reply = object(await rpc(operation, payload));
    if (reply.status !== "ok")
      throw new ResearchStorageError(
        typeof reply.status === "string"
          ? reply.status
          : "invalid_research_storage_response",
      );
    return reply;
  };
  const leasePayload = (lease: Pick<ResearchLease, "id" | "lease">) => {
    if (!UUID.test(lease.id) || !UUID.test(lease.lease))
      throw new Error("invalid_research_lease");
    return { id: lease.id, lease: lease.lease };
  };
  const view = (
    reply: Record<string, unknown>,
    id: string,
    after: number,
  ): ResearchJobView => {
    if (
      reply.id !== id ||
      !states.includes(reply.state as ResearchJobState) ||
      typeof reply.language !== "string" ||
      !isLocale(reply.language) ||
      !Array.isArray(reply.events)
    )
      throw new Error("invalid_research_job_view");
    const end = sequence(reply.sequence);
    const events = reply.events.map((entry: unknown, index: number) => {
      const event = object(entry),
        n = sequence(event.sequence);
      if (n !== after + index + 1 || n > end)
        throw new Error("invalid_research_event_order");
      return {
        sequence: n,
        payload: codec.open(
          id,
          `event:${n}`,
          event.payload_cipher as EncryptedJobValue,
        ),
      };
    });
    if (after > end || events.length !== end - after)
      throw new Error("incomplete_research_event_history");
    return {
      id,
      state: reply.state as ResearchJobState,
      language: reply.language,
      sequence: end,
      events,
      expiresAt: timestamp(reply.expires_at),
    };
  };
  return {
    async enqueue(input: {
      id: string;
      owner: string;
      rate: string;
      dedupe: string;
      requestHash: string;
      request: unknown;
      maxCostUsd: number;
      accountId?: string;
    }) {
      if (
        !UUID.test(input.id) || (input.accountId !== undefined && !UUID.test(input.accountId)) ||
        ![input.owner, input.rate, input.dedupe, input.requestHash].every((v) =>
          HASH.test(v),
        ) ||
        !Number.isFinite(input.maxCostUsd) ||
        input.maxCostUsd <= 0 ||
        input.maxCostUsd > 1.5
      )
        throw new Error("invalid_research_enqueue");
      const language = (input.request as { lang?: unknown } | null)?.lang;
      if (typeof language !== "string" || !isLocale(language))
        throw new Error("invalid_research_language");
      if (input.accountId && (await call("account_ready", { account_id: input.accountId })).lifecycle_version !== 1)
        throw new Error("research_account_lifecycle_unavailable");
      const reply = await call("enqueue", {
        id: input.id,
        owner: input.owner,
        ...(input.accountId ? { account_id: input.accountId } : {}),
        rate: input.rate,
        dedupe: input.dedupe,
        request_hash: input.requestHash,
        language,
        request_cipher: codec.seal(input.id, "request", input.request),
        max_cost_usd: input.maxCostUsd,
      });
      if (
        typeof reply.id !== "string" ||
        !UUID.test(reply.id) ||
        !states.includes(reply.state as ResearchJobState)
      )
        throw new Error("invalid_research_enqueue_response");
      return {
        id: reply.id,
        state: reply.state as ResearchJobState,
        sequence: sequence(reply.sequence),
      };
    },
    async read(id: string, owner: string, after = 0): Promise<ResearchJobView> {
      if (!UUID.test(id) || !HASH.test(owner))
        throw new Error("invalid_research_owner");
      sequence(after);
      return view(await call("read", { id, owner, after }), id, after);
    },
    async cancel(id: string, owner: string): Promise<ResearchJobView> {
      if (!UUID.test(id) || !HASH.test(owner))
        throw new Error("invalid_research_owner");
      return view(await call("cancel", { id, owner, after: 0 }), id, 0);
    },
    async find(owner: string, dedupe: string) {
      if (!HASH.test(owner) || !HASH.test(dedupe))
        throw new Error("invalid_research_lookup");
      const reply = await call("lookup", { owner, dedupe });
      if (
        typeof reply.id !== "string" ||
        !UUID.test(reply.id) ||
        !states.includes(reply.state as ResearchJobState) ||
        typeof reply.language !== "string" ||
        !isLocale(reply.language)
      )
        throw new Error("invalid_research_lookup_response");
      if (reply.state === "cancelled" && reply.request_cipher === null)
        return {
          id: reply.id,
          state: "cancelled" as const,
          language: reply.language,
          sequence: sequence(reply.sequence),
          question: null,
        };
      const input = object(
        codec.open(
          reply.id,
          "request",
          reply.request_cipher as EncryptedJobValue,
        ),
      );
      if (
        typeof input.question !== "string" ||
        !input.question.trim() ||
        input.question.length > 500 ||
        input.lang !== reply.language
      )
        throw new Error("invalid_research_lookup_request");
      return {
        id: reply.id,
        state: reply.state as ResearchJobState,
        language: reply.language,
        sequence: sequence(reply.sequence),
        question: input.question,
      };
    },
    async cancelSubmission(
      owner: string,
      rate: string,
      dedupe: string,
      language: Locale,
      accountId?: string,
    ) {
      if (
        ![owner, rate, dedupe].every((v) => HASH.test(v)) ||
        !isLocale(language) || (accountId !== undefined && !UUID.test(accountId))
      )
        throw new Error("invalid_research_cancellation");
      if (accountId && (await call("account_ready", { account_id: accountId })).lifecycle_version !== 1)
        throw new Error("research_account_lifecycle_unavailable");
      const reply = await call("cancel_key", {
        id: randomUUID(),
        owner,
        rate,
        dedupe,
        language,
        ...(accountId ? { account_id: accountId } : {}),
      });
      if (
        typeof reply.id !== "string" ||
        !UUID.test(reply.id) ||
        !states.includes(reply.state as ResearchJobState)
      )
        throw new Error("invalid_research_cancel_response");
      return {
        id: reply.id,
        state: reply.state as ResearchJobState,
        sequence: sequence(reply.sequence),
      };
    },
    async claim(): Promise<ResearchLease | null> {
      const reply = object(await rpc("claim", {}));
      if (reply.status === "empty" || reply.status === "busy") return null;
      if (
        reply.status !== "ok" ||
        typeof reply.id !== "string" ||
        !UUID.test(reply.id) ||
        typeof reply.lease !== "string" ||
        !UUID.test(reply.lease)
      )
        throw new ResearchStorageError("invalid_research_claim");
      return {
        id: reply.id,
        lease: reply.lease,
        sequence: sequence(reply.sequence),
        request: codec.open(
          reply.id,
          "request",
          reply.request_cipher as EncryptedJobValue,
        ),
        expiresAt: timestamp(reply.expires_at),
      };
    },
    async pulse(lease: ResearchLease) {
      await call("pulse", leasePayload(lease));
    },
    async history(lease: ResearchLease) {
      return view(await call("history", leasePayload(lease)), lease.id, 0);
    },
    async hold(lease: ResearchLease) {
      await call("hold", leasePayload(lease));
    },
    async append(
      lease: ResearchLease,
      expectedSequence: number,
      payload: unknown,
      terminal?: "complete" | "incomplete" | "failed",
    ): Promise<number> {
      sequence(expectedSequence);
      const next = expectedSequence + 1;
      const reply = await call(terminal ? "finish" : "event", {
        ...leasePayload(lease),
        expected_sequence: expectedSequence,
        payload_cipher: codec.seal(lease.id, `event:${next}`, payload),
        ...(terminal ? { state: terminal } : {}),
      });
      if (reply.sequence !== next)
        throw new Error("invalid_research_append_response");
      return next;
    },
    attempts(
      lease: ResearchLease,
      maxAttemptCostUsd: number,
    ): ModelAttemptStore {
      const identity = leasePayload(lease);
      if (
        !Number.isFinite(maxAttemptCostUsd) ||
        maxAttemptCostUsd <= 0 ||
        maxAttemptCostUsd > 1.5
      )
        throw new Error("invalid_attempt_reservation");
      const validKey = (key: string) => {
        if (!ATTEMPT.test(key)) throw new Error("invalid_attempt_key");
      };
      const response = (
        key: string,
        encrypted: unknown,
      ): RecordedModelResponse => {
        const value = object(
          codec.open(lease.id, `model:${key}`, encrypted as EncryptedJobValue),
        );
        if (
          !Number.isInteger(value.status) ||
          Number(value.status) < 200 ||
          Number(value.status) > 599 ||
          typeof value.body !== "string" ||
          Buffer.byteLength(value.body) > 2 * 1024 * 1024 ||
          typeof value.contentType !== "string" ||
          value.contentType.length > 200 ||
          (value.providerRequestId !== undefined &&
            (typeof value.providerRequestId !== "string" ||
              !/^[a-zA-Z0-9_-]{1,200}$/.test(value.providerRequestId)))
        )
          throw new Error("invalid_recorded_model_response");
        return value as RecordedModelResponse;
      };
      return {
        async startRun() {
          await call("start_run", identity);
        },
        async reserve(key) {
          validKey(key);
          const reply = await call("reserve", {
            ...identity,
            key,
            max_cost_usd: maxAttemptCostUsd,
          });
          if (reply.acquired === true) return { acquired: true };
          if (reply.acquired !== false)
            throw new Error("invalid_attempt_reservation_response");
          if (reply.state === "reserved")
            return { acquired: false, attempt: { state: "reserved" } };
          const saved = response(key, reply.response_cipher);
          if (reply.state === "unsettled")
            return {
              acquired: false,
              attempt: { state: "unsettled", response: saved },
            };
          const costUsd = Number(reply.cost_usd);
          if (
            reply.state !== "settled" ||
            reply.cost_usd === null ||
            !Number.isFinite(costUsd) ||
            costUsd < 0
          )
            throw new Error("invalid_recorded_model_cost");
          return {
            acquired: false,
            attempt: { state: "settled", response: saved, costUsd },
          };
        },
        async record(key, saved, costUsd) {
          validKey(key);
          const reply = object(
            await rpc("record", {
              ...identity,
              key,
              response_cipher: codec.seal(lease.id, `model:${key}`, saved),
              cost_usd: costUsd,
              ...(saved.providerRequestId
                ? { provider_request_id: saved.providerRequestId }
                : {}),
            }),
          );
          if (reply.status === "reconciliation_required")
            throw new ModelReconciliationRequired(key);
          if (reply.status !== "ok")
            throw new ResearchStorageError(
              typeof reply.status === "string"
                ? reply.status
                : "invalid_attempt_record_response",
            );
        },
      };
    },
    async prune() {
      await call("prune", {});
    },
    async exportAccount(accountId: string, after?: string, asOf?: string) {
      if (!UUID.test(accountId) || after !== undefined && !UUID.test(after) || asOf !== undefined && !Number.isFinite(Date.parse(asOf)))
        throw new Error("invalid_research_export");
      const reply = await call("account_export", { account_id: accountId, ...(after ? { after } : {}), ...(asOf ? { as_of: asOf } : {}) });
      if (!Array.isArray(reply.jobs) || reply.jobs.length > 10 || !(reply.next === null || typeof reply.next === "string" && UUID.test(reply.next))) throw new Error("invalid_research_export_page");
      const snapshot = timestamp(reply.as_of);
      if (asOf && Date.parse(asOf) !== Date.parse(snapshot)) throw new Error("research_export_snapshot_changed");
      const jobs = reply.jobs.map(value => {
        const row = object(value);
        if (typeof row.id !== "string" || !UUID.test(row.id) || typeof row.state !== "string" || !states.includes(row.state as ResearchJobState)
          || typeof row.language !== "string" || !isLocale(row.language)) throw new Error("invalid_research_export_row");
        const input = object(codec.open(row.id, "request", row.request_cipher as EncryptedJobValue));
        const previous = parseUserHistory(input.previous_user_messages);
        if (typeof input.question !== "string" || !input.question.trim() || input.question.length > 500 || input.lang !== row.language || !previous)
          throw new Error("invalid_research_export_request");
        return { id: row.id, state: row.state as ResearchJobState, language: row.language,
          createdAt: timestamp(row.created_at), expiresAt: timestamp(row.expires_at), question: input.question, previousUserMessages: previous };
      });
      if (new Set(jobs.map(j => j.id)).size !== jobs.length || jobs.some((j, i) => (i ? jobs[i - 1].id : after ?? "") >= j.id)
        || reply.next !== null && reply.next !== jobs.at(-1)?.id) throw new Error("invalid_research_export_order");
      return { asOf: snapshot, next: reply.next as string | null, jobs };
    },
  };
}
export type ResearchJobStore = ReturnType<typeof researchJobStore>;
