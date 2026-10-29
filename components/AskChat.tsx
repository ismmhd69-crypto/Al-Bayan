"use client";

import { richFailureKind, validResearchContinuation, mergeContinuationDisplay } from "@/lib/ask/rich-answer";
import { automaticContinuation, isConnectionInterruption, isRecoverableInterruption, removeCardOnReply, stableResearchReply } from "@/lib/ask/auto-continuation";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ExternalLink,
  PlayCircle,
  Quote,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Answer } from "@/lib/ask/pipeline";
import VideoCard from "./VideoCard";
import { ReportProblem } from "./ReportProblem";
import { takePendingQuestion } from "@/lib/pending";
import { Beacon } from "./Logo";
import { AnswerV2View } from "./AnswerV2View";
import { validateAnswerV2 } from "@/lib/ask/answer-v2";
import { cleanHadithMarkup } from "@/lib/sources/hadith-markup";
import { previousUserMessages } from "@/lib/ask/conversation";
import {
  consumeRichStream,
  emptyRichState,
  reduceRichEvent,
  validRichAnswer,
  validRichSection,
  RICH_ORDER,
  type RichSection,
  type RichAnswer,
  type RichStreamState,
} from "@/lib/ask/rich-answer";
import { richText } from "@/lib/ask/rich-text";
import { RichAnswerView } from "./RichAnswerView";
import { StableAnswerView, type RevealMemory } from "./StableAnswerView";
import { SaveAnswerButton } from "./saved/SaveButtons";
import type { PatientState } from "@/lib/ask/patient-protocol";
import type { Locale } from "@/lib/i18n";
import { streamedAnswerLanguage } from "@/lib/chat/answer-language";
import { browserSupabase } from "@/lib/supabase-browser";
import {
  researchClient,
  ResearchClientError,
  type ResearchClient,
  type ResearchPending,
  type ResearchSaveContext,
  type ResearchConnection,
} from "@/lib/ask/research-client";

type AskText = Dictionary["ask"];

type Reply =
  | { kind: "not_ready" }
  | { kind: "no_summary" }
  | { kind: "clarify"; choices: string[] }
  | { kind: "text"; text: string }
  | { kind: "answer"; answer: Answer }
  | { kind: "rich"; answer: RichAnswer }
  | { kind: "stable"; state: RichStreamState; question: string; history?: string[] }
  | { kind: "patient"; state: PatientState }
  | { kind: "partial"; state: RichStreamState; question?: string };
export type NewMessage = (
  | { role: "user"; text: string }
  | { role: "bayan"; reply: Reply }
) & { exchangeId?: string; researchKey?: string };
type Message = NewMessage & { id: number };

const MAX = 500;
// Only real answers and the fixed "no source / personal / out of scope" replies are worth saving in a chat.
const SAVED_STATUSES = new Set([
  "answer",
  "no_source",
  "no_summary",
  "ask_scholar",
  "out_of_scope",
  "clarify",
]);

export default function AskChat({
  lang,
  t,
  backLabel,
  suggestions,
  testMode,
  initialMessages,
  onExchange,
  headerExtra,
  richEnabled = false,
  durableEnabled = false,
  researchTarget = { chatId: null, position: 1 },
  onCancelReady,
  resumePending = true,
}: {
  lang: string;
  t: AskText;
  backLabel: string;
  suggestions: string[];
  testMode: boolean;
  // Optional, for saved chats: earlier messages to show, a call after each finished answer, and extra header content.
  initialMessages?: NewMessage[];
  onExchange?: (
    question: string,
    reply:
      | { kind: "answer"; answer: Answer }
      | { kind: "text"; text: string }
      | { kind: "rich"; answer: RichAnswer },
    context?: ResearchSaveContext,
  ) => void | Promise<void>;
  headerExtra?: React.ReactNode;
  richEnabled?: boolean;
  durableEnabled?: boolean;
  researchTarget?: { chatId: string | null; position: number };
  onCancelReady?: (cancel: () => void) => void;
  resumePending?: boolean;
}) {
  const stableEnabled = richEnabled && process.env.NEXT_PUBLIC_ASK_STABLE_STREAMING === "true";
  const [messages, setMessages] = useState<Message[]>(() =>
    (initialMessages ?? []).map((m, i) => ({ ...m, id: i + 1 })),
  );
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [continuationTarget, setContinuationTarget] = useState<number | null>(null);
  const nextId = useRef((initialMessages?.length ?? 0) + 1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const [streamState, setStreamState] = useState<RichStreamState | null>(null);
  const stableMessage = useRef<number | null>(null);
  const revealMemory = useRef<RevealMemory>(new Map());
  const logRef = useRef<HTMLDivElement>(null), followingRef = useRef(true);
  const [following, setFollowing] = useState(true);
  const [patientState, setPatientState] = useState<PatientState | null>(null);
  const patientRef = useRef<PatientState | null>(null);
  const [initializing, setInitializing] = useState(
    durableEnabled && resumePending,
  );
  const [connection, setConnection] = useState<ResearchConnection | "saving">(
    "working",
  );
  const [recoverable, setRecoverable] = useState(false);
  const [cancelProblem, setCancelProblem] = useState(false);
  const alive = useRef(true),
    exchange = useRef(onExchange),
    target = useRef(researchTarget),
    stopOutcome = useRef<string | null>(null);
  exchange.current = onExchange;
  target.current = researchTarget;
  const researcher = useRef<ResearchClient | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  if (durableEnabled && !researcher.current)
    researcher.current = researchClient({
      stablePublications: stableEnabled,
      language: lang as Locale,
      onPatientState: state => { patientRef.current = state; if (alive.current) setPatientState(state); },
      getToken: async () => {
        const { data, error } = await browserSupabase().auth.getSession();
        if (error) throw error;
        return data.session?.access_token ?? null;
      },
      onConnection: (state) => {
        if (alive.current) setConnection(state);
      },
    });
  const rt = richText[lang as Locale];
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      activeRequest.current?.abort();
    };
  }, []);
  useEffect(() => {
    onCancelReady?.(() => {
      void stop();
    });
    return () => onCancelReady?.(() => {});
  }, [onCancelReady, durableEnabled]);

  async function stop() {
    if (!durableEnabled) {
      const active = [...messagesRef.current].reverse().find(m => m.role === "bayan" && m.reply.kind === "stable" && !m.reply.state.terminal && m.reply.state.continuation);
      if (active?.role === "bayan" && active.reply.kind === "stable" && active.reply.state.continuation) {
        void fetch("/api/ask/stream", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, stream_version: 3, action: "stop", continue_token: active.reply.state.continuation.token }) }).catch(() => {});
      }
      activeRequest.current?.abort("answer_stopped");
      return;
    }
    try {
      setCancelProblem(false);
      setConnection("stopping");
      const outcome = await researcher.current!.stop();
      stopOutcome.current = String(outcome);
      activeRequest.current?.abort();
      if (alive.current) {
        setRecoverable(false);
        if (!sending.current)
          push({
            role: "bayan",
            reply: {
              kind: "text",
              text: outcome === "cancelled" ? rt.stopped : rt.notRunning,
            },
          });
      }
    } catch {
      if (alive.current) {
        setCancelProblem(true);
        setConnection("working");
      }
    }
  }

  async function restore(signal: AbortSignal, continuePaused = false) {
    try {
      const pending = await researcher.current!.pending(signal);
      signal.throwIfAborted();
      if (pending?.paused && continuePaused) await researcher.current!.continue(pending, signal);
      if (pending) void send(pending.question, pending);
      else if (alive.current) setRecoverable(false);
    } catch {
      if (!signal.aborted && alive.current) {
        setRecoverable(true);
        push({
          role: "bayan",
          reply: { kind: "text", text: rt.reconnectFailed },
        });
      }
    } finally {
      if (alive.current) setInitializing(false);
      if (activeRequest.current?.signal === signal)
        activeRequest.current = null;
    }
  }
  function resume() {
    if (sending.current || initializing) return;
    setInitializing(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    void restore(controller.signal, true);
  }

  useEffect(() => {
    const log = logRef.current; if (!log) return;
    // No following while an answer streams (Mo, 2026-10-29): a new question is scrolled to the top of
    // the chat once, then the view stays still so the answer can be read from its start. "Jump to
    // latest" shows whenever the reader is not at the bottom.
    let frame = 0, questions = 0;
    const atBottom = () => {
      followingRef.current = log.scrollHeight - log.scrollTop - log.clientHeight <= 4;
      setFollowing(followingRef.current);
    };
    const showNewQuestion = () => {
      const asked = log.querySelectorAll<HTMLElement>(".msg-user");
      if (asked.length === questions) return;
      questions = asked.length;
      const latest = asked[asked.length - 1];
      if (!latest || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        log.scrollTop += latest.getBoundingClientRect().top - log.getBoundingClientRect().top - 12;
        atBottom();
      });
    };
    const mutation = new MutationObserver(() => { showNewQuestion(); atBottom(); });
    mutation.observe(log, { childList: true, subtree: true, characterData: true });
    log.addEventListener("scroll", atBottom, { passive: true });
    showNewQuestion();
    return () => {
      cancelAnimationFrame(frame); mutation.disconnect();
      log.removeEventListener("scroll", atBottom);
    };
  }, []);

  // A question handed over from Home or a topic page is asked straight away.
  useEffect(() => {
    // Defer both consuming the handoff and sending until after mount-effect replay.
    // Strict Mode cleans up its first setup immediately; starting fetch there aborts
    // the only request while leaving the pending question consumed and started=true.
    const startup = new AbortController();
    const launch = window.setTimeout(() => {
      if (started.current) return;
      started.current = true;
      const pending = takePendingQuestion();
      if (pending) {
        setInitializing(false);
        void send(pending);
      } else if (durableEnabled && resumePending) {
        activeRequest.current = startup;
        void restore(startup.signal);
      }
    }, 0);
    return () => {
      window.clearTimeout(launch);
      startup.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkReceipt(messageId: number, token: string) {
    if (sending.current) return;
    sending.current = true; setBusy(true);
    let reuse: { question: string; initialState: RichStreamState } | undefined;
    try {
      const owner = messagesRef.current.find(m => m.id === messageId);
      const version = owner?.role === "bayan" && owner.reply.kind === "stable" ? 3 : 2;
      const response = await fetch("/api/ask/stream", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, stream_version: version, action: "status", continue_token: token }) });
      const result = await response.json();
      if (owner?.role === "bayan" && owner.reply.kind === "stable" && validResearchContinuation(result.continuation)
        && result.continuation.token === token && result.continuation.approved) reuse = { question: owner.reply.question, initialState: owner.reply.state };
      setMessages(previous => previous.map(m => m.id === messageId && m.role === "bayan" && (m.reply.kind === "partial" || m.reply.kind === "stable") ? { ...m, reply: { ...m.reply,
        state: { ...m.reply.state, continuation: validResearchContinuation(result.continuation) ? result.continuation : m.reply.state.continuation
          ? { ...m.reply.state.continuation, available: false, reason: "expired" } : undefined } } } : m));
    } catch { push({ role: "bayan", reply: { kind: "text", text: rt.interrupted } }); }
    finally { sending.current = false; setBusy(false); }
    // The finished answer was approved: fetch it by asking the identical question again. The server
    // rechecks every original first and refuses to start any new research for this request.
    if (reuse && alive.current) void send(reuse.question, undefined, { token, messageId, initialState: reuse.initialState, automatic: true, reuse: true });
  }

  async function send(raw: string, restored?: ResearchPending, continuing?: { token: string; messageId: number; initialState?: RichStreamState; automatic?: boolean;
    /** Ask the identical question again to reuse an approved answer; the server refuses anything else. */ reuse?: boolean }) {
    const question = raw.trim();
    if (!question || sending.current) return;
    if (question.length > MAX) {
      push({ role: "bayan", reply: { kind: "text", text: t.tooLong } });
      return;
    }
    const restoredId = restored?.locator.id;
    const hasUser =
      restoredId &&
      messagesRef.current.some(
        (m) =>
          (m.exchangeId === restoredId ||
            m.researchKey === restored?.locator.key) &&
          m.role === "user",
      );
    if (restoredId)
      setMessages((previous) =>
        previous.filter(
          (m) =>
            m.role !== "bayan" ||
            (m.exchangeId !== restoredId &&
              m.researchKey !== restored?.locator.key),
        ),
      );
    const userId = nextId.current;
    if (!hasUser && !continuing)
      push({
        role: "user",
        text: question,
        exchangeId: restoredId ?? undefined,
      });
    setValue("");
    setBusy(true);
    setContinuationTarget(continuing?.messageId ?? null);
    patientRef.current = null; setPatientState(null);
    sending.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;
    stopOutcome.current = null;
    setRecoverable(false);
    setCancelProblem(false);
    setConnection(
      durableEnabled ? (restored ? "reconnecting" : "submitting") : "working",
    );
    const stable = stableEnabled;
    let state: RichStreamState = { ...emptyRichState(), ...(stable ? { version: 3 as const } : {}) };
    const stableId = stable ? continuing?.messageId ?? nextId.current++ : null;
    stableMessage.current = stableId;
    let stableDisplay = continuing ? messagesRef.current.find(m => m.id === continuing.messageId) : undefined;
    // The exact history of the original question. Reuse must match it, or the server would treat it as a new question.
    const requestHistory = stableDisplay?.role === "bayan" && stableDisplay.reply.kind === "stable" && stableDisplay.reply.history
      ? stableDisplay.reply.history : previousUserMessages(messages);
    const updateStable = (next: RichStreamState) => {
      if (stableId === null) return;
      setMessages(previous => previous.map(m => m.id === stableId && m.role === "bayan" ? { ...m, reply: { kind: "stable", question, history: requestHistory, state: next } } : m));
    };
    if (stableId !== null && !continuing) setMessages(previous => [...previous, { id: stableId, role: "bayan", reply: { kind: "stable", question, history: requestHistory, state } }]);
    let continuedState = continuing?.initialState ?? (stableDisplay?.role === "bayan" && (stableDisplay.reply.kind === "stable" || stableDisplay.reply.kind === "partial") ? stableDisplay.reply.state : state);
    let autoResume: { token: string; messageId: number; initialState: RichStreamState; automatic: true; reuse?: boolean } | undefined;
    const checkAutomaticResume = async () => {
      const previous = continuedState.continuation;
      if (stableId === null || durableEnabled || controller.signal.aborted || continuing?.automatic || !previous
        || RICH_ORDER.some(group => (continuedState.publication?.groups[group].notices.length ?? 0) > 0)) return false;
      setConnection("reconnecting");
      try {
        const response = await fetch("/api/ask/stream", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, stream_version: 3, action: "status", continue_token: previous.token }) });
        const value = await response.json();
        controller.signal.throwIfAborted();
        const eligible = automaticContinuation(value?.continuation, previous.token);
        if (validResearchContinuation(value?.continuation) && value.continuation.token === previous.token && value.continuation.approved) {
          autoResume = { token: previous.token, messageId: stableId, initialState: { ...continuedState, continuation: value.continuation }, automatic: true, reuse: true };
          return true;
        }
        if (eligible) {
          autoResume = { token: eligible.token, messageId: stableId, initialState: { ...continuedState, continuation: eligible }, automatic: true };
          return true;
        }
        if (validResearchContinuation(value?.continuation) && value.continuation.token === previous.token)
          continuedState = { ...continuedState, continuation: value.continuation };
        else continuedState = { ...continuedState, continuation: { ...previous, available: false,
          ...(value?.status === "research_expired" ? { reason: "expired" as const } : { reason: undefined }) } };
      } catch {
        // A failed status check cannot establish that a paid retry is safe.
        continuedState = { ...continuedState, continuation: { ...previous, available: false, reason: undefined } };
      }
      return false;
    };
    let job: ResearchPending | undefined = restored;
    if (richEnabled) setStreamState(state);
    try {
      let res: Response | undefined, rawData: unknown;
      if (durableEnabled) {
        job =
          restored ??
          (await researcher.current!.begin(
            question,
            previousUserMessages(messages),
            target.current,
            controller.signal,
          ));
        if (!hasUser)
          setMessages((previous) =>
            previous.map((m) =>
              m.id === userId
                ? {
                    ...m,
                    exchangeId: job!.locator.id ?? undefined,
                    researchKey: job!.locator.key,
                  }
                : m,
            ),
          );
        const result = await researcher.current!.observe(
          job,
          (next) => {
            state = next;
            if (stable && next.publication) { continuedState = next; updateStable(next); }
            if (alive.current) setStreamState(next);
          },
          controller.signal,
        );
        rawData = result.result;
        state = result.state;
        if (stable && state.publication) { continuedState = state; updateStable(state); }
      } else {
        res = await fetch(richEnabled ? "/api/ask/stream" : "/api/ask", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(continuing && !continuing.reuse ? { continue_token: continuing.token } : { question }),
            ...(continuing?.reuse ? { reuse_only: true } : {}),
            lang,
            previous_user_messages: requestHistory,
            supports_clarification: true,
            // Keep the earlier answer flow until progressive delivery passes
            // end-to-end acceptance. API review tools can exercise v2 separately.
            ...(stable ? { stream_version: 3 } : richEnabled && process.env.NEXT_PUBLIC_ASK_PROGRESSIVE_STREAMING === "true" ? { stream_version: 2 } : {}),
          }),
        });
        if (res.headers.get("content-type")?.startsWith("text/event-stream")) {
          if (!res.body) throw new Error("missing_stream");
          await consumeRichStream(res.body, (event) => {
            state = reduceRichEvent(state, event);
            if (stable) { continuedState = continuing ? mergeContinuationDisplay(continuedState, state, event) : state; updateStable(continuedState); }
            if (continuing) setMessages(previous => previous.map(m => m.id === continuing.messageId && m.role === "bayan" && m.reply.kind === "partial"
              ? { ...m, reply: { ...m.reply, state: mergeContinuationDisplay(m.reply.state, state, event) } } : m));
            setStreamState(state);
          });
          if (!state.terminal) throw new Error("interrupted_stream");
          rawData = state.result;
        } else rawData = await res.json();
      }
      controller.signal.throwIfAborted();
      const data = rawData as {
        status?: string;
        answer?: Answer;
        clarification?: { choices?: string[] };
        withdraw?: boolean;
        sections?: RichSection[];
        continuation?: unknown;
        failureKind?: string;
      };
      if (validResearchContinuation(data.continuation)) state = { ...state, continuation: data.continuation };
      if (data.status?.startsWith("research_")) {
        const reason = data.status.slice(9);
        if (stableId !== null) { updateStable(stableResearchReply(continuedState, reason, data, !!continuing, lang as Locale)); return; }
        if (continuing) setMessages(previous => previous.map(m => m.id === continuing.messageId && m.role === "bayan" && m.reply.kind === "partial"
          ? { ...m, reply: { ...m.reply, state: { ...m.reply.state, continuation: m.reply.state.continuation ? { ...m.reply.state.continuation, available: false,
            reason: ["expired", "busy", "limit", "billing_uncertain", "cancelled"].includes(reason) ? reason as "expired" : "expired" } : undefined } } } : m));
        push({ role: "bayan", reply: { kind: "text", text: reason in rt.continuationIssues ? rt.continuationIssues[reason as keyof typeof rt.continuationIssues] : rt.continuationIssues.expired } });
        return;
      }
      if (data.status === "patient_paused") {
        const current = patientRef.current as PatientState | null;
        if (!durableEnabled || !current || current.status !== "paused") throw new ResearchClientError("invalid_response");
        if (stable) { updateStable({ ...continuedState, terminal: true, result: { status: "incomplete", language: lang, withdraw: false } }); setRecoverable(true); return; }
        push({ role: "bayan", reply: { kind: "patient", state: current }, exchangeId: job?.locator.id ?? undefined, researchKey: job?.locator.key });
        setRecoverable(true); return;
      }
      if (data.status === "rich_answer") {
        // The answer follows the question language, which can differ from the
        // interface language. The answer validator checks its own language and sources.
        if (!validRichAnswer(data.answer) || durableEnabled && data.answer.language !== lang)
          throw new Error("invalid_rich_answer");
        if (stable) { updateStable({ ...continuedState, terminal: true, result: data }); await persist(question, { kind: "rich", answer: data.answer }, job); return; }
        if (continuing) setMessages(previous => previous.filter(m => m.id !== continuing.messageId));
        push({
          role: "bayan",
          reply: { kind: "rich", answer: data.answer },
          exchangeId: job?.locator.id ?? undefined,
        });
        await persist(question, { kind: "rich", answer: data.answer }, job);
        return;
      }
      if (data.status === "incomplete") {
        if (stable) {
          if (isRecoverableInterruption(data.failureKind) && await checkAutomaticResume()) return;
          controller.signal.throwIfAborted();
          updateStable({ ...continuedState, terminal: true, result: data }); return;
        }
        if (
          data.sections &&
          !res?.headers.get("content-type")?.startsWith("text/event-stream")
        ) {
          if (
            !Array.isArray(data.sections) ||
            data.sections.length > 4 ||
            !data.sections.every(
              (s, i) =>
                (continuing || state.version === 2 || data.continuation ? RICH_ORDER.includes(s.group) : s.group === RICH_ORDER[i]) &&
                validRichSection(s, lang as Locale),
            )
          )
            throw new Error("invalid_partial");
          state = { ...state, sections: data.sections };
        }
        if (continuing) setMessages(previous => previous.filter(m => m.id !== continuing.messageId));
        push({
          role: "bayan",
          reply: {
            kind: "partial",
            question,
            state: data.withdraw
              ? { ...state, sections: [], withdrawn: true }
              : {
                  ...state,
                  sections: state.sections.filter((s) => s.group !== "summary"),
                  result: data,
                },
          },
        });
        if (durableEnabled) setRecoverable(true);
        return;
      }
      if (durableEnabled && data.status === "answer") {
        const answer = data.answer?.v2;
        if (
          !answer ||
          answer.language !== lang ||
          !validateAnswerV2(answer, {
            origin: answer.origin,
            review: answer.review,
          }).ok
        )
          throw new ResearchClientError("invalid_response");
      }
      const reply: Reply =
        data.status === "answer" && data.answer
          ? { kind: "answer", answer: data.answer }
          : data.status === "clarify"
            ? {
                kind: "clarify",
                choices: (data.clarification?.choices ?? [])
                  .filter(
                    (choice) =>
                      typeof choice === "string" && choice.length <= 80,
                  )
                  .slice(0, 2),
              }
            : data.status === "not_ready"
              ? { kind: "not_ready" }
              : data.status === "no_source"
                ? { kind: "text", text: t.noSource }
                : data.status === "no_summary"
                  ? { kind: "no_summary" }
                  : data.status === "ask_scholar"
                    ? { kind: "text", text: t.personal }
                    : data.status === "out_of_scope"
                      ? { kind: "text", text: t.outOfScope }
                      : data.status === "rate_limited"
                        ? { kind: "text", text: t.rateLimited }
                        : data.status === "busy"
                          ? { kind: "text", text: t.busy }
                          : data.status === "too_long"
                            ? { kind: "text", text: t.tooLong }
                            : { kind: "text", text: t.error };
      // During Continue the card already holds checked sources: never remove it. Its saved
      // Continue link stays usable, and the reply (for example "rate limited") is shown below it.
      if (stableId !== null && removeCardOnReply(!!continuing)) setMessages(previous => previous.filter(m => m.id !== stableId));
      push({ role: "bayan", reply, exchangeId: job?.locator.id ?? undefined });
      if (data.status === "answer" && reply.kind === "answer")
        await persist(question, reply, job);
      else if (
        !durableEnabled &&
        data.status &&
        SAVED_STATUSES.has(data.status)
      ) {
        if (reply.kind === "text") await persist(question, reply);
        else if (reply.kind === "no_summary")
          await persist(question, { kind: "text", text: t.noSummary });
        else if (reply.kind === "clarify")
          await persist(question, {
            kind: "text",
            text: [t.clarify, ...reply.choices].join(" "),
          });
      } else if (job) researcher.current?.acknowledge(job);
    } catch (error) {
      if (!alive.current) return;
      if (stableId !== null) {
        if (isConnectionInterruption(error) && await checkAutomaticResume()) return;
        updateStable({ ...continuedState, terminal: true, result: { status: "incomplete", language: lang, withdraw: false, failureKind: controller.signal.reason === "answer_stopped" ? "cancelled" : "connection_interrupted" } });
        return;
      }
      if (durableEnabled) {
        const pendingKey =
          job?.locator.key ?? researcher.current?.current()?.key;
        if (pendingKey && !hasUser)
          setMessages((previous) =>
            previous.map((m) =>
              m.id === userId ? { ...m, researchKey: pendingKey } : m,
            ),
          );
        const changed =
          error instanceof ResearchClientError &&
          ["sources_changed", "scope_changed", "unauthorized"].includes(
            error.code,
          );
        if (changed) {
          state = { ...emptyRichState(), withdrawn: true };
          if (job?.locator.id)
            setMessages((previous) =>
              previous.map((m) =>
                m.role === "bayan" && m.exchangeId === job!.locator.id
                  ? { ...m, reply: { kind: "partial", state, question } }
                  : m,
              ),
            );
        }
        const stopped =
          stopOutcome.current ||
          (error instanceof ResearchClientError && error.code === "cancelled"
            ? "cancelled"
            : null);
        const code =
          error instanceof ResearchClientError
            ? error.code
            : "connection_interrupted";
        setRecoverable(
          !!researcher.current?.current() &&
            !changed &&
            !stopped &&
            [
              "connection_interrupted",
              "submission_uncertain",
              "network_error",
              "research_unavailable",
            ].includes(code),
        );
        if (stopped) {
          push({
            role: "bayan",
            reply: {
              kind: "text",
              text: stopped === "cancelled" ? rt.stopped : rt.notRunning,
            },
          });
          return;
        }
        if (state.sections.length || state.cards?.length || state.withdrawn)
          push({
            role: "bayan",
            researchKey: pendingKey,
            reply: {
              kind: "partial",
              question,
              state: {
                ...state,
                sections: state.sections.filter((s) => s.group !== "summary"),
              },
            },
          });
        else
          push({
            role: "bayan",
            researchKey: pendingKey,
            reply: {
              kind: "text",
              text:
                code === "chat_full"
                  ? rt.chatFull
                  : code === "rate_limited"
                    ? t.rateLimited
                    : code === "too_long"
                      ? t.tooLong
                      : code === "not_ready"
                        ? t.notReady
                        : code === "invalid_response"
                          ? rt.checkFailure
                          : changed
                            ? rt.changed
                            : pendingKey
                              ? rt.reconnectFailed
                              : t.error,
            },
          });
        return;
      }
      // An interrupted paid request is never automatically retried or saved.
      if (continuing) {
        push({ role: "bayan", reply: { kind: "text", text: controller.signal.aborted ? rt.stopped : rt.interrupted } });
      } else if (richEnabled && (state.sections.length || state.cards?.length || state.continuation || state.withdrawn))
        push({
          role: "bayan",
          reply: {
            kind: "partial",
            question,
            state: {
              ...state,
              sections: state.sections.filter((s) => s.group !== "summary"),
            },
          },
        });
      else
        push({
          role: "bayan",
          reply: {
            kind: "text",
            text: richEnabled
              ? controller.signal.aborted
                ? rt.stopped
                : error instanceof TypeError &&
                    /fetch|network|load failed/i.test(error.message)
                  ? rt.interrupted
                  : rt.checkFailure
              : t.error,
          },
        });
    } finally {
      const resume = autoResume && !controller.signal.aborted ? autoResume : undefined;
      controller.abort();
      activeRequest.current = null;
      sending.current = false;
      if (alive.current) {
        setBusy(false);
        setContinuationTarget(null);
        setStreamState(null);
        inputRef.current?.focus({ preventScroll: true });
      }
      if (resume && alive.current) void send(question, undefined, resume);
    }
  }

  async function persist(
    question: string,
    reply: Parameters<NonNullable<typeof onExchange>>[1],
    job?: ResearchPending,
  ) {
    try {
      if (exchange.current) {
        setConnection("saving");
        setStreamState(null);
        await exchange.current(
          question,
          reply,
          job && job.locator.id
            ? {
                exchangeId: job.locator.id,
                chatId: job.locator.chatId,
                position: job.locator.position,
              }
            : undefined,
        );
      }
      if (job) researcher.current?.acknowledge(job);
    } catch {
      if (job && alive.current) {
        setRecoverable(true);
        push({
          role: "bayan",
          exchangeId: job.locator.id ?? undefined,
          researchKey: job.locator.key,
          reply: { kind: "text", text: rt.saveFailed },
        });
      }
    }
  }

  function push(m: NewMessage) {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...m, id }]);
  }

  return (
    <div className="chat" data-ask-flow={stableEnabled ? "stable-v3" : "legacy"}>
      <header className="chat-top">
        <Link href={`/${lang}`} className="icon-btn" aria-label={backLabel}>
          <ArrowLeft aria-hidden="true" className="flip-rtl" />
        </Link>
        <Beacon size={24} />
        <h1>{t.title}</h1>
        {headerExtra}
      </header>

      <div ref={logRef} className="chat-log" aria-busy={busy && !richEnabled}>
        <p className="chat-notice">
          <ShieldCheck aria-hidden="true" />
          <span>
            {t.notice}
            {testMode && <strong className="chat-test"> {t.testMode}</strong>}
          </span>
        </p>

        {messages.length === 0 && !busy && (
          <div className="chat-empty">
            <Beacon size={64} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptySub}</p>
            <p className="eyebrow">{t.suggestions}</p>
            <ul className="chips">
              {suggestions.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="chip"
                    disabled={initializing || busy}
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, index) =>
          m.role === "user" ? (
            <div key={m.id} className="msg msg-user">
              <span className="sr-only">{t.you}: </span>
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="msg msg-bayan">
              <span className="sr-only">{t.bayan}: </span>
              {m.reply.kind === "stable" ? <>
                <StableAnswerView state={m.reply.state} language={streamedAnswerLanguage(m.reply.state, m.reply.question, lang as Locale)} text={t} working={busy && stableMessage.current === m.id} reconnecting={busy && stableMessage.current === m.id && connection === "reconnecting"} memory={revealMemory.current}
                  saveSlot={(() => { const result = m.reply.state.result as { status?: string; answer?: import("@/lib/ask/rich-answer").RichAnswer } | undefined; return result?.status === "rich_answer" && result.answer ? <SaveAnswerButton lang={lang as Locale} question={m.reply.question} answer={result.answer} /> : undefined; })()} />
                {busy && stableMessage.current === m.id ? <button type="button" className="chip" onClick={() => void stop()}>{rt.stop}</button>
                  : m.reply.state.continuation?.available && !RICH_ORDER.some(g => m.reply.kind === "stable" && m.reply.state.publication?.groups[g].notices.length) ? <button type="button" className="btn btn-primary" onClick={() => { if (m.reply.kind === "stable" && m.reply.state.continuation) void send(m.reply.question, undefined, { token: m.reply.state.continuation.token, messageId: m.id }); }}>{rt.continueResearch}</button>
                    : m.reply.state.continuation && ["billing_uncertain", "busy", ""].includes(m.reply.state.continuation.reason ?? "") ? <button type="button" className="chip" onClick={() => { if (m.reply.kind === "stable" && m.reply.state.continuation) void checkReceipt(m.id, m.reply.state.continuation.token); }}>{rt.checkReceipt}</button> : null}
              </> : m.reply.kind === "rich" ? (
                <RichAnswerView
                  sections={m.reply.answer.sections}
                  language={m.reply.answer.language}
                  text={t}
                  guide={m.reply.answer.guide ?? null}
                  videos={m.reply.answer.videos}
                  complete
                  saveSlot={<SaveAnswerButton lang={lang as Locale} question={questionBefore(messages, index)} answer={m.reply.answer} />}
                />
              ) : m.reply.kind === "patient" ? (
                <RichAnswerView sections={RICH_ORDER.flatMap(g => m.reply.kind === "patient" && m.reply.state.groups[g].section ? [m.reply.state.groups[g].section!] : [])}
                  language={lang as Locale} text={t} patient={m.reply.state} />
              ) : m.reply.kind === "partial" ? (
                <>
                <RichAnswerView
                  sections={m.reply.state.sections}
                  language={lang as Locale}
                  text={t}
                  incomplete={continuationTarget !== m.id}
                  working={busy && continuationTarget === m.id}
                  withdrawn={m.reply.state.withdrawn}
                  technicalFailure={richFailureKind(m.reply.state.result) === "checker_failure"}
                  failureKind={richFailureKind(m.reply.state.result)}
                  cards={m.reply.state.cards}
                />
                {m.reply.state.continuation && <div role="status">
                  {m.reply.state.continuation.available && m.reply.state.continuation.remaining > 0 && m.reply.question
                    ? <><p>{rt.continuationNotice}</p><button type="button" className="btn btn-primary" disabled={busy} onClick={() => {
                      if (m.reply.kind === "partial" && m.reply.state.continuation && m.reply.question) void send(m.reply.question, undefined, { token: m.reply.state.continuation.token, messageId: m.id });
                    }}>{rt.continueResearch}</button></>
                    : <><p>{rt.continuationIssues[m.reply.state.continuation.reason ?? "limit"]}</p>
                      {["billing_uncertain", "busy"].includes(m.reply.state.continuation.reason ?? "") && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => {
                        if (m.reply.kind === "partial" && m.reply.state.continuation) void checkReceipt(m.id, m.reply.state.continuation.token);
                      }}>{rt.checkReceipt}</button>}</>}
                </div>}
                </>
              ) : m.reply.kind === "text" ? (
                <p role="status">{m.reply.text}</p>
              ) : m.reply.kind === "clarify" ? (
                <ClarificationView
                  choices={m.reply.choices}
                  prompt={t.clarify}
                  busy={busy}
                  onChoose={(choice) => void send(choice)}
                />
              ) : m.reply.kind === "no_summary" ? (
                <div role="status" className="answer-empty">
                  <p>{t.noSummary}</p>
                  <Link href={`/${lang}/topics`}>{t.noSummaryBrowse}</Link>
                  <ReportProblem
                    lang={lang as "ar" | "en" | "de"}
                    sourceIds={[]}
                    labels={t.report}
                    defaultReason="not_answering"
                  />
                </div>
              ) : m.reply.kind === "answer" ? (
                <>
                  <span className="sr-only" role="status">
                    {t.v2.answerReady}
                  </span>
                  {m.reply.answer.v2 ? (
                    <AnswerV2View answer={m.reply.answer.v2} t={t} id={m.id} saveSlot={<SaveAnswerButton lang={lang as Locale} question={questionBefore(messages, index)} answer={m.reply.answer.v2} />} />
                  ) : (
                    <AnswerView a={m.reply.answer} t={t} id={m.id} />
                  )}
                </>
              ) : (
                <>
                  <span className="sr-only" role="status">
                    {t.notReady}
                  </span>
                  <NotReady t={t} />
                </>
              )}
            </div>
          ),
        )}

        {busy && streamState && streamState.version !== 3 && (
          <div className="msg msg-bayan">
            <p role="status" aria-live="polite">
              {connection === "submitting"
                ? rt.submitting
                : connection === "queued"
                  ? rt.queued
                  : connection === "reconnecting"
                    ? rt.reconnecting
                    : connection === "refreshing"
                      ? rt.refreshing
                      : connection === "stopping"
                        ? rt.stopping
                        : rt.progress[streamState.progress]}
            </p>
            {!continuationTarget && (patientState || streamState.sections.length > 0 || !!streamState.cards?.length || streamState.withdrawn) && (
              <RichAnswerView
                sections={streamState.sections}
                language={lang as Locale}
                text={t}
                withdrawn={streamState.withdrawn}
                cards={streamState.cards}
                patient={patientState ?? undefined}
                working
              />
            )}
            {cancelProblem && <p role="alert">{rt.cancelFailed}</p>}
            <button
              type="button"
              className="chip"
              disabled={connection === "stopping"}
              onClick={() => void stop()}
            >
              {rt.stop}
            </button>
          </div>
        )}
        {busy && !streamState && (
          <div className="msg msg-bayan msg-thinking" role="status">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {connection === "saving" ? rt.saving : t.thinking}
          </div>
        )}
        {initializing && !busy && (
          <div className="msg msg-bayan">
            <p role="status" aria-live="polite">
              {rt.checkingPending}
            </p>
            <button type="button" className="chip" onClick={() => void stop()}>
              {rt.stop}
            </button>
          </div>
        )}
        {recoverable && !busy && !initializing && (
          <div className="msg msg-bayan">
            <button type="button" className="chip" onClick={resume}>
              {patientState?.status === "paused" ? rt.continueResearch : rt.resume}
            </button>
            <button type="button" className="chip" onClick={() => void stop()}>
              {rt.stop}
            </button>
            {cancelProblem && <p role="alert">{rt.cancelFailed}</p>}
          </div>
        )}
        <div ref={endRef} />
      </div>
      {!following && <button type="button" className="chip" onClick={() => { followingRef.current = true; setFollowing(true); logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" }); }}>{lang === "ar" ? "انتقل إلى آخر الإجابة" : lang === "de" ? "Zum Neuesten springen" : "Jump to latest"}</button>}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (!initializing) void send(value);
        }}
      >
        <label htmlFor="ask-q" className="sr-only">
          {t.placeholder}
        </label>
        <textarea
          id="ask-q"
          ref={inputRef}
          rows={1}
          value={value}
          maxLength={MAX}
          placeholder={t.placeholder}
          enterKeyHint="send"
          disabled={initializing}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (!initializing) void send(value);
            }
          }}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={busy || initializing || !value.trim()}
          aria-label={t.send}
        >
          <ArrowUp aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export function ClarificationView({
  choices,
  prompt,
  busy,
  onChoose,
}: {
  choices: string[];
  prompt: string;
  busy: boolean;
  onChoose: (choice: string) => void;
}) {
  return (
    <div role="status">
      <p>{prompt}</p>
      <ul className="chips">
        {choices.map((choice) => (
          <li key={choice}>
            <button
              type="button"
              className="chip"
              disabled={busy}
              onClick={() => onChoose(choice)}
            >
              {choice}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Until the source library exists, Bayan says so and shows the answer layout with no content in it.
function NotReady({ t }: { t: AskText }) {
  return (
    <>
      <p>{t.notReady}</p>
      <details className="preview">
        <summary>
          {t.previewToggle}
          <ChevronDown aria-hidden="true" className="chev" />
        </summary>
        <div className="answer answer--preview">
          <p className="answer-label">{t.label}</p>
          <Part
            icon={<BookOpen aria-hidden="true" />}
            title={t.parts.short}
            text={t.previewText.short}
          />
          <Part
            icon={<Quote aria-hidden="true" />}
            title={t.parts.evidence}
            text={t.previewText.evidence}
          />
          <Part
            icon={<Users aria-hidden="true" />}
            title={t.parts.scholars}
            text={t.previewText.scholars}
          />
          <Part
            icon={<PlayCircle aria-hidden="true" />}
            title={t.parts.watch}
            text={t.previewText.watch}
          />
          <details className="fold">
            <summary>
              {t.parts.otherViews}
              <ChevronDown aria-hidden="true" className="chev" />
            </summary>
            <p>{t.previewText.otherViews}</p>
          </details>
          <p className="answer-foot">{t.notFatwa}</p>
        </div>
      </details>
    </>
  );
}

const dirOf = (l: string) => (l === "ar" ? "rtl" : "ltr");
/** The visitor question an answer replies to: the nearest user message before it. */
const questionBefore = (messages: { role: string; text?: string }[], index: number) => {
  for (let i = index - 1; i >= 0; i--) if (messages[i].role === "user") return messages[i].text ?? "";
  return "";
};

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A real answer: an automatic explanation with a source on every sentence, then the verses exactly as served.
export function AnswerView({
  a,
  t,
  id,
}: {
  a: Answer;
  t: AskText;
  id: number;
}) {
  if (a.v2) return <AnswerV2View answer={a.v2} t={t} id={id} />;
  const anchor = (key: string) => `ev-${id}-${key.replace(":", "-")}`;
  // Source tags: verses show "2:255", hadith their Bukhari (or Muslim) number, quotes the scholar.
  const byKey = new Map(a.evidence.map((e) => [e.key, e]));
  const texts = a.evidence.filter((e) => e.kind !== "scholar");
  const quotes = a.evidence.filter((e) => e.kind === "scholar");
  const scholarShort = (id: string, full: string) =>
    t.scholarShort[id as keyof typeof t.scholarShort] ?? full;
  const refText = (r: string) => {
    const e = byKey.get(r);
    if (e?.kind === "scholar") {
      const name = scholarShort(e.scholarId, e.scholarName);
      return { short: name, long: `${e.scholarName}, ${e.reference}` };
    }
    if (e?.kind !== "hadith") return { short: r, long: `${t.quran} ${r}` };
    const n = e.numbers.bukhari
      ? `${t.hadith.numberBukhari} ${e.numbers.bukhari}`
      : `${t.hadith.numberMuslim} ${e.numbers.muslim}`;
    return { short: n, long: `${t.hadith[e.collection]}, ${n}` };
  };
  // Move keyboard and screen-reader focus to the cited verse, not just the view.
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    const el = document.getElementById(anchor(key));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "center",
    });
    el.focus({ preventScroll: true });
  };
  const sentences = (items: { text: string; source_ids: string[] }[]) =>
    items.map((s, i) => (
      <span key={i}>
        {s.text}{" "}
        {s.source_ids.map((r) => (
          <a
            key={r}
            href={`#${anchor(r)}`}
            className="ref"
            aria-label={`${t.source}: ${refText(r).long}`}
            onClick={(e) => goTo(e, r)}
          >
            {refText(r).short}
          </a>
        ))}{" "}
      </span>
    ));
  return (
    <div className="answer">
      <p className="answer-label">{a.prepared ? t.preparedLabel : t.label}</p>

      <section className="answer-part answer-part--real">
        <h3>
          <BookOpen aria-hidden="true" />
          {t.parts.short}
        </h3>
        <p className="answer-direct" lang={a.language} dir={dirOf(a.language)}>
          {sentences(a.direct_answer)}
        </p>
      </section>

      {a.explanation.map((section, index) => (
        <section className="answer-part answer-part--real" key={index}>
          <h3 lang={a.language} dir={dirOf(a.language)}>
            <BookOpen aria-hidden="true" />
            {section.heading}
          </h3>
          <p lang={a.language} dir={dirOf(a.language)}>
            {sentences(section.sentences)}
          </p>
        </section>
      ))}

      {a.not_established.length > 0 && (
        <aside
          className="answer-part answer-part--real answer-note"
          lang={a.language}
          dir={dirOf(a.language)}
        >
          <h3>{t.parts.limit}</h3>
          {a.not_established.map((note, index) => (
            <p key={index}>{note.text}</p>
          ))}
        </aside>
      )}

      {texts.length > 0 && (
        <section className="answer-part answer-part--real">
          <h3>
            <Quote aria-hidden="true" />
            {t.parts.evidence}
          </h3>
          <ul className="evidence">
            {texts.map((e) =>
              e.kind === "hadith" ? (
                // Hadith: collection, numbers, grade and text exactly as the source gives them.
                <li key={e.key} id={anchor(e.key)} tabIndex={-1}>
                  <p className="hadith-meta">
                    <span className="hadith-collection">
                      {t.hadith[e.collection]}
                    </span>
                    <span>
                      {[
                        e.numbers.bukhari &&
                          `${t.hadith.numberBukhari} ${e.numbers.bukhari}`,
                        e.numbers.muslim &&
                          `${t.hadith.numberMuslim} ${e.numbers.muslim}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span lang="ar" dir="rtl" translate="no">
                      {e.gradeAr} · {e.attributionAr}
                    </span>
                  </p>
                  <p className="verse-ar" lang="ar" dir="rtl" translate="no">
                    {cleanHadithMarkup(e.arabic)}
                  </p>
                  {e.translation && e.translationLanguage && (
                    <p
                      className="verse-tr"
                      lang={e.translationLanguage}
                      dir="ltr"
                    >
                      <span translate="no">
                        {cleanHadithMarkup(e.translation)}
                      </span>
                      <span className="verse-by">
                        {e.translationLanguage !== a.language
                          ? t.hadith.englishFallback
                          : t.hadith.translationBy}
                      </span>
                    </p>
                  )}
                  <a
                    className="verse-link"
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {e.url.startsWith("https://sunnah.com/")
                      ? t.hadith.linkSunnah
                      : t.hadith.link}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </li>
              ) : e.kind === "quran" ? (
                <li key={e.key} id={anchor(e.key)} tabIndex={-1}>
                  <p className="verse-ar" lang="ar" dir="rtl" translate="no">
                    {e.arabic}
                  </p>
                  {e.translation && (
                    <p className="verse-tr" lang={a.language} dir="ltr">
                      <span translate="no">{e.translation}</span>
                      <span className="verse-by">
                        {t.translation}: {e.translationName}
                      </span>
                    </p>
                  )}
                  <a
                    className="verse-link"
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.quran} {e.key}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {quotes.length > 0 && (
        <section className="answer-part answer-part--real">
          <h3>
            <Users aria-hidden="true" />
            {t.parts.scholars}
          </h3>
          <ul className="evidence">
            {quotes.map((e) =>
              e.kind === "scholar" ? (
                // A scholar's own words, a short quote exactly as on his website, with the question it answers.
                <li key={e.key} id={anchor(e.key)} tabIndex={-1}>
                  <p className="hadith-meta">
                    <span className="hadith-collection">{e.scholarName}</span>
                  </p>
                  {e.title && (
                    <p
                      className="quote-title"
                      lang="ar"
                      dir="rtl"
                      translate="no"
                    >
                      {e.title}
                    </p>
                  )}
                  <p className="verse-ar" lang="ar" dir="rtl" translate="no">
                    {e.arabic}
                  </p>
                  <p className="verse-by">
                    {a.language !== "ar" && <>{t.scholarQuote.arabicOnly} · </>}
                    <span lang="ar" dir="rtl" translate="no">
                      {e.reference}
                    </span>
                  </p>
                  <a
                    className="verse-link"
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.scholarQuote.link}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {a.videos && a.videos.length > 0 && (
        <details className="fold answer-part--real video-fold">
          <summary>
            <PlayCircle aria-hidden="true" />
            {t.parts.watch}
            <ChevronDown aria-hidden="true" className="chev" />
          </summary>
          <div className="video-fold__content">
            <p className="muted">{t.video.note}</p>
            <ul className="evidence">
              {a.videos.map((v) => (
                <VideoCard key={v.youtubeId} v={v} labels={t.video} />
              ))}
            </ul>
          </div>
        </details>
      )}

      <p className="answer-foot">
        {a.prepared ? t.preparedChecked : t.checked}{" "}
        <a href={a.attribution.url} target="_blank" rel="noopener noreferrer">
          {a.attribution.text}
        </a>
        {a.hadithAttribution && (
          <>
            {". "}
            <a
              href={a.hadithAttribution.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.hadithAttribution.text}
            </a>
          </>
        )}
        . {t.notFatwa}
      </p>
      <ReportProblem
        lang={a.language}
        sourceIds={a.evidence.map((e) =>
          e.kind === "quran" ? `Q${e.key}` : e.key,
        )}
        labels={t.report}
      />
    </div>
  );
}

function Part({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="answer-part">
      <h3>
        {icon}
        {title}
      </h3>
      <p>{text}</p>
    </section>
  );
}
