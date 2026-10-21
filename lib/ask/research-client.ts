import type { Locale } from "@/lib/i18n";
import {
  emptyRichState,
  reduceRichEvent,
  type RichEvent,
  type RichStreamState,
} from "./rich-answer";

export type ResearchSaveContext = {
  exchangeId: string;
  chatId: string | null;
  position: number;
};
export type ResearchLocator = {
  version: 1;
  scope: string;
  language: Locale;
  key: string;
  id: string | null;
  createdAt: number;
  chatId: string | null;
  position: number;
};
export type ResearchPending = { locator: ResearchLocator; question: string };
export type ResearchConnection =
  | "queued"
  | "submitting"
  | "working"
  | "reconnecting"
  | "refreshing"
  | "stopping";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Json = Record<string, unknown>;
export class ResearchClientError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ResearchClientError";
  }
}
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SCOPE = /^[a-f0-9]{32}$/;
const TTL = 24 * 60 * 60 * 1000;
function pause(ms: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      signal.removeEventListener("abort", stop);
      resolve();
    };
    const timer = setTimeout(done, ms);
    const stop = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", stop);
      reject(signal.reason);
    };
    signal.addEventListener("abort", stop, { once: true });
  });
}

/** Browser transport. Only opaque, scoped job metadata is saved in sessionStorage. Neither
 * questions nor answers/tokens are put there. Failed submissions use FIND, never automatic POST. */
export function researchClient(options: {
  language: Locale;
  getToken(): Promise<string | null>;
  storage?: () => StorageLike;
  fetch?: typeof fetch;
  onConnection?: (state: ResearchConnection) => void;
}) {
  const network = options.fetch ?? fetch;
  let scope: string | null = null,
    active: ResearchLocator | null = null;
  const storage = () => options.storage?.() ?? sessionStorage;
  const slot = (s: string) => `bayan:research:v1:${s}:${options.language}`;
  const clear = (locator: ResearchLocator) => {
    try {
      const value = JSON.parse(
        storage().getItem(slot(locator.scope)) ?? "null",
      );
      if (value?.key === locator.key) storage().removeItem(slot(locator.scope));
    } catch {
      /* Storage may be blocked. */
    }
    if (active?.key === locator.key) active = null;
  };
  const remember = (locator: ResearchLocator) => {
    active = locator;
    try {
      storage().setItem(slot(locator.scope), JSON.stringify(locator));
    } catch {
      /* In-memory reconnect still works; reload recovery is unavailable. */
    }
  };
  const read = (): ResearchLocator | null => {
    if (!scope) return null;
    try {
      const l = JSON.parse(
        storage().getItem(slot(scope)) ?? "null",
      ) as ResearchLocator | null;
      if (!l) return active?.scope === scope ? active : null;
      if (
        l.version !== 1 ||
        l.scope !== scope ||
        l.language !== options.language ||
        !UUID.test(l.key) ||
        (l.id !== null && !UUID.test(l.id)) ||
        !Number.isFinite(l.createdAt) ||
        Date.now() - l.createdAt > TTL ||
        l.createdAt > Date.now() + 60_000 ||
        (l.chatId !== null && !UUID.test(l.chatId)) ||
        !Number.isInteger(l.position) ||
        l.position < 1 ||
        l.position > 50
      ) {
        storage().removeItem(slot(scope));
        return null;
      }
      active = l;
      return l;
    } catch {
      return active?.scope === scope ? active : null;
    }
  };
  const post = async (
    path: string,
    body: object,
    signal?: AbortSignal,
    key?: string,
  ): Promise<Json> => {
    signal?.throwIfAborted();
    const token = await options.getToken();
    signal?.throwIfAborted();
    const response = await network(`/api/ask/jobs${path}`, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      redirect: "error",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(25_000)])
        : AbortSignal.timeout(25_000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(scope && path !== "/session"
          ? { "X-Bayan-Research-Scope": scope }
          : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: JSON.stringify(body),
    });
    let value: Json;
    try {
      value = await response.json();
    } catch {
      throw new ResearchClientError("network_error");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new ResearchClientError("invalid_response");
    if (
      path !== "/session" &&
      value.scope !== undefined &&
      value.scope !== scope
    )
      throw new ResearchClientError("scope_changed");
    if (!response.ok)
      throw new ResearchClientError(
        typeof value.status === "string"
          ? value.status
          : response.status >= 500
            ? "network_error"
            : "invalid_response",
      );
    if (value.version !== 1 || (path !== "/session" && value.scope !== scope))
      throw new ResearchClientError("invalid_response");
    return value;
  };
  const connect = async (signal: AbortSignal) => {
    const value = await post("/session", {}, signal);
    if (
      value.status !== "ready" ||
      typeof value.scope !== "string" ||
      !SCOPE.test(value.scope)
    )
      throw new ResearchClientError("invalid_session");
    if (scope && scope !== value.scope)
      throw new ResearchClientError("scope_changed");
    scope = value.scope;
  };
  const find = async (
    locator: ResearchLocator,
    signal: AbortSignal,
  ): Promise<ResearchPending | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const value = await post("/find", { key: locator.key }, signal);
        if (
          value.status !== "job" ||
          typeof value.id !== "string" ||
          !UUID.test(value.id) ||
          value.language !== options.language
        )
          throw new ResearchClientError("invalid_response");
        if (value.state === "cancelled" || value.state === "expired") {
          clear(locator);
          return null;
        }
        if (
          typeof value.question !== "string" ||
          !value.question.trim() ||
          value.question.length > 500
        )
          throw new ResearchClientError("invalid_response");
        const next = { ...locator, id: value.id };
        remember(next);
        return { locator: next, question: value.question };
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof ResearchClientError && error.code === "expired") {
          clear(locator);
          return null;
        }
        const retry =
          error instanceof TypeError ||
          (error instanceof Error && error.name === "TimeoutError") ||
          (error instanceof ResearchClientError &&
            [
              "not_found",
              "network_error",
              "research_unavailable",
              "rate_limited",
            ].includes(error.code));
        if (!retry) throw error;
        if (attempt === 4)
          throw new ResearchClientError(
            error instanceof ResearchClientError && error.code === "not_found"
              ? "submission_uncertain"
              : "connection_interrupted",
          );
        options.onConnection?.("reconnecting");
        await pause(1000, signal);
      }
    }
    return null;
  };
  const cancel = async (locator: ResearchLocator) => {
    if (scope !== locator.scope) throw new ResearchClientError("scope_changed");
    options.onConnection?.("stopping");
    const value = await post("/cancel", {
      key: locator.key,
      lang: options.language,
    });
    if (
      value.status !== "job" ||
      !["cancelled", "complete", "incomplete", "failed"].includes(
        String(value.state),
      )
    )
      throw new ResearchClientError("cancel_unconfirmed");
    clear(locator);
    return value.state;
  };
  return {
    async pending(signal: AbortSignal) {
      await connect(signal);
      const locator = read();
      return locator ? find(locator, signal) : null;
    },
    async begin(
      question: string,
      history: string[],
      target: { chatId: string | null; position: number },
      signal: AbortSignal,
    ): Promise<ResearchPending> {
      await connect(signal);
      const previous = read();
      if (previous) await cancel(previous);
      signal.throwIfAborted();
      options.onConnection?.("submitting");
      if (
        !Number.isInteger(target.position) ||
        target.position < 1 ||
        target.position > 50
      )
        throw new ResearchClientError("chat_full");
      const locator: ResearchLocator = {
        version: 1,
        scope: scope!,
        language: options.language,
        key: crypto.randomUUID(),
        id: null,
        createdAt: Date.now(),
        ...target,
      };
      remember(locator);
      try {
        const value = await post(
          "",
          { question, lang: options.language, previous_user_messages: history },
          signal,
          locator.key,
        );
        if (
          value.status !== "job" ||
          typeof value.id !== "string" ||
          !UUID.test(value.id)
        )
          throw new ResearchClientError("invalid_response");
        if (value.state === "cancelled") {
          clear(locator);
          throw new ResearchClientError("cancelled");
        }
        const next = { ...locator, id: value.id };
        remember(next);
        return { locator: next, question };
      } catch (error) {
        signal.throwIfAborted();
        if (
          error instanceof ResearchClientError &&
          [
            "unauthorized",
            "scope_changed",
            "rate_limited",
            "bad_request",
            "too_long",
            "not_ready",
            "cancelled",
          ].includes(error.code)
        ) {
          clear(locator);
          throw error;
        }
        options.onConnection?.("reconnecting");
        const recovered = await find(locator, signal);
        if (!recovered) throw new ResearchClientError("cancelled");
        return recovered;
      }
    },
    async observe(
      pending: ResearchPending,
      receive: (state: RichStreamState) => void,
      signal: AbortSignal,
    ): Promise<{ result: unknown; state: RichStreamState }> {
      const locator = pending.locator;
      if (scope !== locator.scope || !locator.id)
        throw new ResearchClientError("invalid_session");
      let state = emptyRichState(),
        failures = 0;
      while (true) {
        signal.throwIfAborted();
        try {
          const value = await post(
            "/read",
            { id: locator.id, after: state.sequence },
            signal,
          );
          if (
            value.status !== "job" ||
            value.id !== locator.id ||
            value.language !== options.language ||
            !Array.isArray(value.events)
          )
            throw new ResearchClientError("invalid_response");
          for (const event of value.events)
            state = reduceRichEvent(state, event as RichEvent);
          if (value.sequence !== state.sequence)
            throw new ResearchClientError("invalid_response");
          options.onConnection?.(
            value.state === "queued" ? "queued" : "working",
          );
          receive(state);
          failures = 0;
          if (state.terminal) return { result: state.result, state };
          if (["cancelled", "expired"].includes(String(value.state))) {
            clear(locator);
            throw new ResearchClientError("cancelled");
          }
          if (
            ["failed", "incomplete", "reconciliation_required"].includes(
              String(value.state),
            )
          )
            return {
              result: {
                status: "incomplete",
                language: options.language,
                sections: state.sections.filter((s) => s.group !== "summary"),
                withdraw: state.withdrawn,
              },
              state,
            };
          if (!["queued", "running"].includes(String(value.state)))
            throw new ResearchClientError("invalid_response");
          await pause(1000, signal);
        } catch (error) {
          signal.throwIfAborted();
          if (
            error instanceof ResearchClientError &&
            [
              "sources_changed",
              "scope_changed",
              "unauthorized",
              "cancelled",
              "expired",
              "not_found",
              "invalid_response",
            ].includes(error.code)
          ) {
            if (error.code !== "cancelled") {
              state = { ...emptyRichState(), withdrawn: true };
              receive(state);
            }
            if (!["scope_changed", "unauthorized"].includes(error.code))
              clear(locator);
            throw error;
          }
          if (
            error instanceof ResearchClientError &&
            error.code === "source_refresh_failed"
          ) {
            state = emptyRichState();
            receive({ ...state, withdrawn: true });
            options.onConnection?.("refreshing");
          } else options.onConnection?.("reconnecting");
          if (++failures >= 5)
            throw new ResearchClientError("connection_interrupted");
          await pause(Math.min(1000 * 2 ** (failures - 1), 8000), signal);
        }
      }
    },
    async stop() {
      const locator = active ?? read();
      if (!locator) return "cancelled";
      return cancel(locator);
    },
    acknowledge(pending: ResearchPending) {
      clear(pending.locator);
    },
    current() {
      return active;
    },
  };
}
export type ResearchClient = ReturnType<typeof researchClient>;
