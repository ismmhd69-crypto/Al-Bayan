"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { History, Lock, Plus, Trash2, X } from "lucide-react";
import type { Answer } from "@/lib/ask/pipeline";
import type { AnswerV2 } from "@/lib/ask/answer-v2";
import type { ChatText } from "@/lib/chat-text";
import { groupByDay } from "@/lib/chat/answer-store";
import {
  deleteAllChats,
  deleteChat,
  listChats,
  openChat,
  saveExchange,
  type ChatSummary,
  type OpenedTurn,
} from "@/lib/chat/chats";
import { browserSupabase } from "@/lib/supabase-browser";
import AskChat, { type NewMessage } from "./AskChat";
import styles from "./AskWorkspace.module.css";

type ChatProps = ComponentProps<typeof AskChat>;
type Active = {
  key: number;
  chatId: string | null;
  seed: NewMessage[];
  turns: number;
  resumeResearch: boolean;
};
type Reply = Parameters<NonNullable<ChatProps["onExchange"]>>[1];

// A saved answer is shown by the same view as a fresh one, which only needs its AnswerV2.
const asAnswer = (v2: AnswerV2): Answer => ({
  language: v2.language,
  claims: [],
  direct_answer: [],
  explanation: [],
  not_established: [],
  evidence: [],
  attribution: v2.attribution.quran ??
    v2.attribution.hadith ?? { text: "", url: "" },
  prepared: v2.origin === "prepared",
  model: "saved",
  verifier: "saved",
  v2,
});

function seedFrom(turns: OpenedTurn[], unavailable: string): NewMessage[] {
  return turns.flatMap((turn): NewMessage[] => [
    { role: "user", text: turn.question, exchangeId: turn.id },
    {
      role: "bayan",
      exchangeId: turn.id,
      reply:
        turn.reply.kind === "answer"
          ? turn.reply.answer.version === 3 || turn.reply.answer.version === 4
            ? { kind: "rich", answer: turn.reply.answer }
            : { kind: "answer", answer: asAnswer(turn.reply.answer) }
          : {
              kind: "text",
              text: turn.reply.kind === "text" ? turn.reply.text : unavailable,
            },
    },
  ]);
}

// Wraps the Ask chat with New chat and Recent chats. Inside the chat nothing changes. Signed-in people get
// their chats saved to their account (only the question and the checked answer, never Quran or hadith
// text); everyone else can still start a new chat, and nothing is saved.
type WorkspaceProps = Omit<
  ChatProps,
  "initialMessages" | "onExchange" | "headerExtra"
> & { chat: ChatText };

export default function AskWorkspace({ chat: text, ...props }: WorkspaceProps) {
  const lang = props.lang as "ar" | "en" | "de";
  const [account, setAccount] = useState<string | null | undefined>(undefined);
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [active, setActive] = useState<Active>({
    key: 0,
    chatId: null,
    seed: [],
    turns: 0,
    resumeResearch: true,
  });
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
  const accountIdentity = useRef<string | null | undefined>(undefined);
  const cancelCurrent = useRef<() => void>(() => {});
  const registerCancel = useCallback((cancel: () => void) => {
    cancelCurrent.current = cancel;
  }, []);

  useEffect(() => {
    if (active.key >= activeRef.current.key) activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const supabase = browserSupabase();
    let alive = true;
    let authEvents = 0;
    const apply = (id: string | null, email: string | null) => {
      if (!alive) return;
      const before = accountIdentity.current;
      accountIdentity.current = id;
      if (before !== undefined && before !== id) {
        const next = {
          key: activeRef.current.key + 1,
          chatId: null,
          seed: [],
          turns: 0,
          resumeResearch: true,
        };
        activeRef.current = next;
        setActive(next);
        setChats(null);
        setProblem(null);
        setSheet(false);
      }
      setAccount(id ? email || id : null);
    };
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!authEvents)
          apply(
            data.session?.user.id ?? null,
            data.session?.user.email ?? null,
          );
      })
      .catch(() => {
        if (!authEvents) apply(null, null);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      authEvents++;
      apply(session?.user.id ?? null, session?.user.email ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const owner = accountIdentity.current;
    try {
      const rows = await listChats();
      if (owner !== accountIdentity.current) return;
      setChats(rows);
      setLoadFailed(false);
    } catch {
      if (owner === accountIdentity.current) setLoadFailed(true);
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
    cancelCurrent.current();
    const next = {
      key: activeRef.current.key + 1,
      chatId: null,
      seed: [],
      turns: 0,
      resumeResearch: false,
    };
    activeRef.current = next;
    setActive(next);
    setSheet(false);
    setConfirm(null);
    setProblem(null);
    setStatus(text.started);
  }, [text.started]);

  async function open(id: string) {
    const owner = accountIdentity.current,
      key = activeRef.current.key;
    setBusyId(id);
    setProblem(null);
    try {
      const chat = await openChat(id);
      if (owner !== accountIdentity.current || key !== activeRef.current.key)
        return;
      cancelCurrent.current();
      const next = {
        key: key + 1,
        chatId: id,
        seed: seedFrom(chat.turns, text.unavailable),
        turns: chat.turns.length,
        resumeResearch: false,
      };
      activeRef.current = next;
      setActive(next);
      setSheet(false);
      setStatus(text.opened);
    } catch {
      if (owner === accountIdentity.current && key === activeRef.current.key)
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
  const renderOwner = accountIdentity.current;
  const onExchange = useCallback(
    (
      question: string,
      reply: Reply,
      context?: Parameters<NonNullable<ChatProps["onExchange"]>>[2],
    ) => {
      const key = active.key,
        owner = renderOwner;
      const work = queue.current
        .catch(() => {})
        .then(async () => {
          const now = activeRef.current;
          if (now.key !== key || !owner || owner !== accountIdentity.current)
            throw new Error("chat_owner_or_workspace_changed");
          if (reply.kind === "answer" && !reply.answer.v2) return;
          try {
            const saved = await saveExchange(
              context ? context.chatId : now.chatId,
              context ? context.position : now.turns + 1,
              lang,
              question,
              reply.kind === "rich"
                ? { kind: "answer", answer: reply.answer }
                : reply.kind === "answer"
                  ? { kind: "answer", answer: reply.answer.v2! }
                  : { kind: "text", text: reply.text },
              { userId: owner, exchangeId: context?.exchangeId },
            );
            if (
              activeRef.current.key !== key ||
              accountIdentity.current !== owner
            )
              throw new Error("chat_owner_or_workspace_changed");
            const count =
              activeRef.current.chatId === saved.chatId
                ? Math.max(activeRef.current.turns, saved.position)
                : saved.position;
            const next = {
              ...activeRef.current,
              chatId: saved.chatId,
              turns: count,
            };
            if (activeRef.current.key === key) {
              activeRef.current = next;
              setActive((a) =>
                a.key === key
                  ? { ...a, chatId: saved.chatId, turns: count }
                  : a,
              );
            }
            setProblem(null);
            await refresh();
          } catch (error) {
            if (
              activeRef.current.key === key &&
              accountIdentity.current === owner
            )
              setProblem(text.saveError);
            throw error;
          }
        });
      queue.current = work.catch(() => {});
      return work;
    },
    [lang, refresh, text.saveError, active.key, renderOwner],
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
    const items = [
      ...(sheetRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ??
        []),
    ].filter((el) => !el.hasAttribute("disabled"));
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

  const countLabel = (n: number) =>
    n === 1 ? text.oneQuestion : text.manyQuestions.replace("{n}", String(n));
  const timeFmt = new Intl.DateTimeFormat(lang, { timeStyle: "short" });
  const dayFmt = new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
  });
  const groupLabel = {
    today: text.today,
    yesterday: text.yesterday,
    earlier: text.earlier,
  };

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

          {account && chats === null && !loadFailed && (
            <p className={styles.note} role="status">
              {text.loading}
            </p>
          )}
          {account && loadFailed && (
            <div className={`${styles.note} ${styles.error}`}>
              <p>{text.loadError}</p>
              <button
                type="button"
                className={styles.link}
                onClick={() => void refresh()}
              >
                {text.retry}
              </button>
            </div>
          )}
          {account && chats && chats.length === 0 && (
            <p className={styles.note}>{text.empty}</p>
          )}

          {account &&
            chats &&
            groupByDay(chats).map(({ group, items }) => (
              <section key={group} aria-label={groupLabel[group]}>
                <h3 className={styles.group}>{groupLabel[group]}</h3>
                <ul className={styles.rows}>
                  {items.map((c) => {
                    const when =
                      group === "today"
                        ? timeFmt.format(new Date(c.updated_at))
                        : group === "earlier"
                          ? dayFmt.format(new Date(c.updated_at))
                          : "";
                    const isActive = active.chatId === c.id;
                    return (
                      <li
                        key={c.id}
                        className={styles.row}
                        data-active={isActive}
                      >
                        {confirm === c.id ? (
                          <div
                            className={styles.confirm}
                            role="group"
                            aria-label={text.deleteAsk}
                          >
                            <span>{text.deleteAsk}</span>
                            <div className={styles.confirmButtons}>
                              <button
                                type="button"
                                className={`${styles.smallBtn} ${styles.danger}`}
                                onClick={() => void remove(c.id)}
                              >
                                {text.deleteYes}
                              </button>
                              <button
                                type="button"
                                className={styles.smallBtn}
                                onClick={() => setConfirm(null)}
                              >
                                {text.deleteNo}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.open}
                              aria-current={isActive ? "true" : undefined}
                              disabled={busyId !== null}
                              onClick={() => void open(c.id)}
                            >
                              <span className={styles.title}>{c.title}</span>
                              <span className={styles.sub}>
                                {[countLabel(c.turns), when]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </button>
                            <button
                              type="button"
                              className={styles.bin}
                              aria-label={`${text.deleteChat}: ${c.title}`}
                              onClick={() => setConfirm(c.id)}
                            >
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
              <span
                role="group"
                aria-label={text.deleteAllAsk}
                className={styles.confirmButtons}
              >
                <span>{text.deleteAllAsk}</span>
                <button
                  type="button"
                  className={`${styles.smallBtn} ${styles.danger}`}
                  onClick={() => void removeAll()}
                >
                  {text.deleteYes}
                </button>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => setConfirm(null)}
                >
                  {text.deleteNo}
                </button>
              </span>
            ) : (
              <>
                <span>{text.savedInAccount}</span>
                {chats && chats.length > 0 && (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => setConfirm("all")}
                  >
                    {text.deleteAll}
                  </button>
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
          key={`${lang}:${active.key}`}
          {...props}
          initialMessages={active.seed}
          onExchange={account ? onExchange : undefined}
          onCancelReady={registerCancel}
          resumePending={active.resumeResearch}
          researchTarget={{ chatId: active.chatId, position: active.turns + 1 }}
          headerExtra={
            <div className={styles.actions}>
              <button
                ref={historyBtn}
                type="button"
                className={`${styles.headBtn} ${styles.historyOnly}`}
                aria-label={text.openRecent}
                aria-haspopup="dialog"
                aria-expanded={sheet}
                onClick={() => setSheet(true)}
              >
                <History aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.headBtn}
                aria-label={text.newChat}
                onClick={newChat}
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
          }
        />
      </div>

      <p className={styles.live} role="status">
        {status}
      </p>

      {sheet && (
        <>
          <div
            className={styles.scrim}
            onClick={() => setSheet(false)}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recent-chats-h"
            onKeyDown={onSheetKey}
          >
            <div className={styles.sheetHead}>
              <h2 id="recent-chats-h">{text.recent}</h2>
              <button
                ref={closeRef}
                type="button"
                className={styles.headBtn}
                aria-label={text.close}
                onClick={() => setSheet(false)}
              >
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
