"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, BookOpen, ChevronDown, ExternalLink, PlayCircle, Quote, ShieldCheck, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Answer } from "@/lib/ask/pipeline";
import { takePendingQuestion } from "@/lib/pending";
import { Beacon } from "./Logo";

type AskText = Dictionary["ask"];

type Reply = { kind: "not_ready" } | { kind: "text"; text: string } | { kind: "answer"; answer: Answer };
type NewMessage = { role: "user"; text: string } | { role: "bayan"; reply: Reply };
type Message = NewMessage & { id: number };

const MAX = 500;

export default function AskChat({
  lang,
  t,
  backLabel,
  suggestions,
  testMode,
}: {
  lang: string;
  t: AskText;
  backLabel: string;
  suggestions: string[];
  testMode: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "end" });
  }, [messages, busy]);

  // A question handed over from Home or a topic page is asked straight away.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const pending = takePendingQuestion();
    if (pending) void send(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || busy) return;
    if (question.length > MAX) {
      push({ role: "bayan", reply: { kind: "text", text: t.tooLong } });
      return;
    }
    push({ role: "user", text: question });
    setValue("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang }),
      });
      const data = (await res.json()) as { status?: string; answer?: Answer };
      const reply: Reply =
        data.status === "answer" && data.answer
          ? { kind: "answer", answer: data.answer }
          : data.status === "not_ready"
            ? { kind: "not_ready" }
            : data.status === "no_source"
              ? { kind: "text", text: t.noSource }
              : data.status === "out_of_scope"
                ? { kind: "text", text: t.outOfScope }
                : data.status === "rate_limited"
                  ? { kind: "text", text: t.rateLimited }
                  : data.status === "too_long"
                    ? { kind: "text", text: t.tooLong }
                    : { kind: "text", text: t.error };
      push({ role: "bayan", reply });
    } catch {
      push({ role: "bayan", reply: { kind: "text", text: t.error } });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function push(m: NewMessage) {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...m, id }]);
  }

  return (
    <div className="chat">
      <header className="chat-top">
        <Link href={`/${lang}`} className="icon-btn" aria-label={backLabel}>
          <ArrowLeft aria-hidden="true" className="flip-rtl" />
        </Link>
        <Beacon size={24} />
        <h1>{t.title}</h1>
      </header>

      <p className="chat-notice">
        <ShieldCheck aria-hidden="true" />
        <span>
          {t.notice}
          {testMode && <strong className="chat-test"> {t.testMode}</strong>}
        </span>
      </p>

      <div className="chat-log" aria-live="polite" aria-busy={busy}>
        {messages.length === 0 && !busy && (
          <div className="chat-empty">
            <Beacon size={44} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptySub}</p>
            <p className="eyebrow">{t.suggestions}</p>
            <ul className="chips">
              {suggestions.map((q) => (
                <li key={q}>
                  <button type="button" className="chip" onClick={() => send(q)}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="msg msg-user">
              <span className="sr-only">{t.you}: </span>
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="msg msg-bayan">
              <span className="sr-only">{t.bayan}: </span>
              {m.reply.kind === "text" ? (
                <p>{m.reply.text}</p>
              ) : m.reply.kind === "answer" ? (
                <AnswerView a={m.reply.answer} t={t} id={m.id} />
              ) : (
                <NotReady t={t} />
              )}
            </div>
          ),
        )}

        {busy && (
          <div className="msg msg-bayan msg-thinking" role="status">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {t.thinking}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(value);
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
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(value);
            }
          }}
        />
        <button type="submit" className="send-btn" disabled={busy || !value.trim()} aria-label={t.send}>
          <ArrowUp aria-hidden="true" />
        </button>
      </form>
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
          <Part icon={<BookOpen aria-hidden="true" />} title={t.parts.short} text={t.previewText.short} />
          <Part icon={<Quote aria-hidden="true" />} title={t.parts.evidence} text={t.previewText.evidence} />
          <Part icon={<Users aria-hidden="true" />} title={t.parts.scholars} text={t.previewText.scholars} />
          <Part icon={<PlayCircle aria-hidden="true" />} title={t.parts.watch} text={t.previewText.watch} />
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

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A real answer: an automatic explanation with a source on every sentence, then the verses exactly as served.
function AnswerView({ a, t, id }: { a: Answer; t: AskText; id: number }) {
  const anchor = (key: string) => `ev-${id}-${key.replace(":", "-")}`;
  // Move keyboard and screen-reader focus to the cited verse, not just the view.
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    const el = document.getElementById(anchor(key));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };
  return (
    <div className="answer">
      <p className="answer-label">{t.label}</p>

      <section className="answer-part answer-part--real">
        <h3>
          <BookOpen aria-hidden="true" />
          {t.parts.short}
        </h3>
        <p lang={a.language} dir={dirOf(a.language)}>
          {a.claims.map((s, i) => (
            <span key={i}>
              {s.text}{" "}
              {s.refs.map((r) => (
                <a
                  key={r}
                  href={`#${anchor(r)}`}
                  className="ref"
                  aria-label={`${t.source}: ${t.quran} ${r}`}
                  onClick={(e) => goTo(e, r)}
                >
                  {r}
                </a>
              ))}{" "}
            </span>
          ))}
        </p>
        {a.personal && <p className="answer-note">{t.personal}</p>}
      </section>

      <section className="answer-part answer-part--real">
        <h3>
          <Quote aria-hidden="true" />
          {t.parts.evidence}
        </h3>
        <ul className="evidence">
          {a.evidence.map((e) => (
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
              <a className="verse-link" href={e.url} target="_blank" rel="noopener noreferrer">
                {t.quran} {e.key}
                <ExternalLink aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="answer-part answer-part--real">
        <h3>
          <Users aria-hidden="true" />
          {t.parts.scholars}
        </h3>
        <p className="muted">{t.scholarsEmpty}</p>
      </section>

      <p className="answer-foot">
        {t.checked} {t.attribution}: {a.attribution}. {t.notFatwa}
      </p>
    </div>
  );
}

function Part({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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
