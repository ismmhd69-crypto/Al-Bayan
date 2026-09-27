"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, BookOpen, ChevronDown, PlayCircle, Quote, ShieldCheck, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { takePendingQuestion } from "@/lib/pending";
import { Beacon } from "./Logo";

type AskText = Dictionary["ask"];

type Reply = { kind: "not_ready" } | { kind: "error"; text: string };
type NewMessage = { role: "user"; text: string } | { role: "bayan"; reply: Reply };
type Message = NewMessage & { id: number };

const MAX = 500;

export default function AskChat({
  lang,
  t,
  backLabel,
  suggestions,
}: {
  lang: string;
  t: AskText;
  backLabel: string;
  suggestions: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      push({ role: "bayan", reply: { kind: "error", text: t.tooLong } });
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
      const data = (await res.json()) as { status?: string };
      if (!res.ok) throw new Error(data.status ?? "error");
      push({ role: "bayan", reply: { kind: "not_ready" } });
    } catch {
      push({ role: "bayan", reply: { kind: "error", text: t.error } });
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
        <span>{t.notice}</span>
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
              {m.reply.kind === "error" ? <p>{m.reply.text}</p> : <NotReady t={t} />}
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
