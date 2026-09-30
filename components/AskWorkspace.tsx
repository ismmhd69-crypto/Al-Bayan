"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { History, Lock, Plus, Trash2, X } from "lucide-react";
import type { Answer } from "@/lib/ask/pipeline";
import type { AnswerV2 } from "@/lib/ask/answer-v2";
import type { ChatText } from "@/lib/chat-text";
import { groupByDay } from "@/lib/chat/answer-store";
import { deleteAllChats, deleteChat, listChats, openChat, saveExchange, type ChatSummary, type OpenedTurn } from "@/lib/chat/chats";
import { browserSupabase } from "@/lib/supabase-browser";
import AskChat, { type NewMessage } from "./AskChat";
import styles from "./AskWorkspace.module.css";

type ChatProps = ComponentProps<typeof AskChat>;
type Active = { key: number; chatId: string | null; seed: NewMessage[]; turns: number };
type Reply = Parameters<NonNullable<ChatProps["onExchange"]>>[1];

// A saved answer is shown by the same view as a fresh one, which only needs its AnswerV2.
const asAnswer = (v2: AnswerV2): Answer => ({
  language: v2.language,
  claims: [],
  direct_answer: [],
  explanation: [],
  not_established: [],
  evidence: [],
  attribution: v2.attribution.quran ?? v2.attribution.hadith ?? { text: "", url: "" },
  prepared: v2.origin === "prepared",
  model: "saved",
  verifier: "saved",
  v2,
});

function seedFrom(turns: OpenedTurn[], unavailable: string): NewMessage[] {
  return turns.flatMap((turn): NewMessage[] => [
    { role: "user", text: turn.question },
    {
      role: "bayan",
      reply:
        turn.reply.kind === "answer"
          ? { kind: "answer", answer: asAnswer(turn.reply.answer) }
          : { kind: "text", text: turn.reply.kind === "text" ? turn.reply.text : unavailable },
    },
  ]);
}

// Wraps the Ask chat with New chat and Recent chats. Inside the chat nothing changes. Signed-in people get
// their chats saved to their account (only the question and the checked answer, never Quran or hadith
// text); everyone else can still start a new chat, and nothing is saved.
type WorkspaceProps = Omit<ChatProps, "initialMessages" | "onExchange" | "headerExtra"> & { chat: ChatText };

export default function AskWorkspace({ chat: text, ...props }: WorkspaceProps) {
  const lang = props.lang as "ar" | "en" | "de";
  const [account, setAccount] = useState<string | null | undefined>(undefined);
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [active, setActive] = useState<Active>({ key: 0, chatId: null, seed: [], turns: 0 });
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const activeRef = useRef(active);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const historyBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const supabase = browserSupabase();
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setAccount(data.session?.user ? (data.session.user.email ?? "") : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAccount(session?.user ? (session.user.email ?? "") : null));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setChats(await listChats());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    if (account) void refresh();
    else {
      setChats(null);
      setLoadFailed(false);
    }
  }, [account, refresh]);

  const newChat = useCallback(() => {
    setActive((a) => ({ key: a.key + 1, chatId: null, seed: [], turns: 0 }));
    setSheet(false);
    setConfirm(null);
    setProblem(null);
    setStatus(text.started);
  }, [text.started]);

  async function open(id: string) {
    setBusyId(id);
    setProblem(null);
    try {
      const chat = await openChat(id);
      setActive((a) => ({ key: a.key + 1, chatId: id, seed: seedFrom(chat.turns, text.unavailable), turns: chat.turns.length }));
      setSheet(false);
      setStatus(text.opened);
    } catch {
      setProblem(text.openError);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setConfirm(null);
    try {
      await deleteChat(id);
      if (activeRef.current.chatId === id) newChat();
      setStatus(text.deleted);
      await refresh();
    } catch {
      setProblem(text.loadError);
    }
  }

  async function removeAll() {
    setConfirm(null);
    try {
      await deleteAllChats();
      newChat();
      setStatus(text.deleted);
      await refresh();
    } catch {
      setProblem(text.loadError);
    }
  }

  // After each answer: save it (one at a time, so quick questions never make two chats).
  const onExchange = useCallback(
    (question: string, reply: Reply) => {
      const key = activeRef.current.key;
      queue.current = queue.current.then(async () => {
        const now = activeRef.current;
        if (now.key !== key) return; // the person moved to another chat meanwhile
        if (reply.kind === "answer" && !reply.answer.v2) return;
        try {
          const saved = await saveExchange(
            now.chatId,
            now.turns + 1,
            lang,
            question,
            reply.kind === "answer" ? { kind: "answer", answer: reply.answer.v2! } : { kind: "text", text: reply.text },
          );
          const next = { ...activeRef.current, chatId: saved.chatId, turns: saved.position };
          if (activeRef.current.key === key) {
            activeRef.current = next;
            setActive((a) => (a.key === key ? { ...a, chatId: saved.chatId, turns: saved.position } : a));
          }
          setProblem(null);
          await refresh();
        } catch {
          setProblem(text.saveError);
        }
      });
    },
    [lang, refresh, text.saveError],
  );

  // Phone sheet: focus moves in, Escape closes, Tab stays inside, focus returns to the button.
  useEffect(() => {
    if (!sheet) return;
    closeRef.current?.focus();
    const button = historyBtn.current;
    return () => button?.focus();
  }, [sheet]);
  const onSheetKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") return setSheet(false);
    if (e.key !== "Tab") return;
    const items = [...(sheetRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [])].filter((el) => !el.hasAttribute("disabled"));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const countLabel = (n: number) => (n === 1 ? text.oneQuestion : text.manyQuestions.replace("{n}", String(n)));
  const timeFmt = new Intl.DateTimeFormat(lang, { timeStyle: "short" });
  const dayFmt = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  const groupLabel = { today: text.today, yesterday: text.yesterday, earlier: text.earlier };

  function renderList() {
    return (
      <div className={styles.list}>
        <div className={styles.top}>
          <button type="button" className={styles.newBtn} onClick={newChat}>
            <Plus aria-hidden="true" />
            {text.newChat}
          </button>
        </div>

        <div className={styles.scroll}>
          {problem && (
            <p role="alert" className={`${styles.note} ${styles.error}`}>
              {problem}
            </p>
          )}

          {account === null && (
            <div className={styles.card}>
              <strong>{text.keepTitle}</strong>
              <span>{text.keepText}</span>
              <Link href={`/${lang}/account`}>{text.signInButton}</Link>
            </div>
          )}

          {account && chats === null && !loadFailed && <p className={styles.note} role="status">{text.loading}</p>}
          {account && loadFailed && (
            <div className={`${styles.note} ${styles.error}`}>
              <p>{text.loadError}</p>
              <button type="button" className={styles.link} onClick={() => void refresh()}>{text.retry}</button>
            </div>
          )}
          {account && chats && chats.length === 0 && <p className={styles.note}>{text.empty}</p>}

          {account &&
            chats &&
            groupByDay(chats).map(({ group, items }) => (
              <section key={group} aria-label={groupLabel[group]}>
                <h3 className={styles.group}>{groupLabel[group]}</h3>
                <ul className={styles.rows}>
                  {items.map((c) => {
                    const when = group === "today" ? timeFmt.format(new Date(c.updated_at)) : group === "earlier" ? dayFmt.format(new Date(c.updated_at)) : "";
                    const isActive = active.chatId === c.id;
                    return (
                      <li key={c.id} className={styles.row} data-active={isActive}>
                        {confirm === c.id ? (
                          <div className={styles.confirm} role="group" aria-label={text.deleteAsk}>
                            <span>{text.deleteAsk}</span>
                            <div className={styles.confirmButtons}>
                              <button type="button" className={`${styles.smallBtn} ${styles.danger}`} onClick={() => void remove(c.id)}>{text.deleteYes}</button>
                              <button type="button" className={styles.smallBtn} onClick={() => setConfirm(null)}>{text.deleteNo}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button type="button" className={styles.open} aria-current={isActive ? "true" : undefined} disabled={busyId !== null}
                              onClick={() => void open(c.id)}>
                              <span className={styles.title}>{c.title}</span>
                              <span className={styles.sub}>{[countLabel(c.turns), when].filter(Boolean).join(" · ")}</span>
                            </button>
                            <button type="button" className={styles.bin} aria-label={`${text.deleteChat}: ${c.title}`} onClick={() => setConfirm(c.id)}>
                              <Trash2 aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>

        <div className={styles.foot}>
          <Lock aria-hidden="true" />
          {account ? (
            confirm === "all" ? (
              <span role="group" aria-label={text.deleteAllAsk} className={styles.confirmButtons}>
                <span>{text.deleteAllAsk}</span>
                <button type="button" className={`${styles.smallBtn} ${styles.danger}`} onClick={() => void removeAll()}>{text.deleteYes}</button>
                <button type="button" className={styles.smallBtn} onClick={() => setConfirm(null)}>{text.deleteNo}</button>
              </span>
            ) : (
              <>
                <span>{text.savedInAccount}</span>
                {chats && chats.length > 0 && (
                  <button type="button" className={styles.link} onClick={() => setConfirm("all")}>{text.deleteAll}</button>
                )}
              </>
            )
          ) : (
            <span>{text.nothingSaved}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.panel} aria-label={text.recent}>
        {renderList()}
      </aside>

      <div className={styles.main}>
        <AskChat
          key={active.key}
          {...props}
          initialMessages={active.seed}
          onExchange={account ? onExchange : undefined}
          headerExtra={
            <div className={styles.actions}>
              <button ref={historyBtn} type="button" className={`${styles.headBtn} ${styles.historyOnly}`} aria-label={text.openRecent}
                aria-haspopup="dialog" aria-expanded={sheet} onClick={() => setSheet(true)}>
                <History aria-hidden="true" />
              </button>
              <button type="button" className={styles.headBtn} aria-label={text.newChat} onClick={newChat}>
                <Plus aria-hidden="true" />
              </button>
            </div>
          }
        />
      </div>

      <p className={styles.live} role="status">{status}</p>

      {sheet && (
        <>
          <div className={styles.scrim} onClick={() => setSheet(false)} aria-hidden="true" />
          <div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="recent-chats-h" onKeyDown={onSheetKey}>
            <div className={styles.sheetHead}>
              <h2 id="recent-chats-h">{text.recent}</h2>
              <button ref={closeRef} type="button" className={styles.headBtn} aria-label={text.close} onClick={() => setSheet(false)}>
                <X aria-hidden="true" />
              </button>
            </div>
            <div className={styles.sheetBody}>{renderList()}</div>
          </div>
        </>
      )}
    </div>
  );
}
