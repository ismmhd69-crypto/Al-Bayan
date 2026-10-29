"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SavedKind } from "@/lib/saved/store";
import { savedText } from "@/lib/saved/text";
import { useSaved } from "@/lib/saved/useSaved";

/** The Saved page: one plain line about where saves live, underline tabs and a divided list. */
export default function SavedList({ lang, lessonNumbers }: { lang: Locale; lessonNumbers: Record<string, number> }) {
  const t = savedText[lang];
  const { ready, signedIn, account, items, remove } = useSaved();
  const [tab, setTab] = useState<SavedKind>("answer");
  const answers = items.filter((x) => x.kind === "answer"), lessons = items.filter((x) => x.kind === "lesson");
  const shown = tab === "answer" ? answers : lessons;
  const date = (iso: string) => { try { return new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : lang, { day: "numeric", month: "short" }); } catch { return ""; } };
  return <>
    <p className="saved-note">
      {account ? t.accountNote : <>{t.deviceNote} {!signedIn && <><Link href={`/${lang}/account`}>{t.signIn}</Link> {t.deviceNoteEnd}</>}</>}
    </p>
    <div className="saved-tabs" role="tablist" aria-label={t.title}>
      {([["answer", t.answers, answers.length], ["lesson", t.lessons, lessons.length]] as const).map(([kind, label, count]) =>
        <button key={kind} type="button" role="tab" aria-selected={tab === kind} className="saved-tab" onClick={() => setTab(kind)}>{label}<span>{count}</span></button>)}
    </div>
    {ready && shown.length === 0 && <p className="saved-empty"><strong>{t.emptyTitle}</strong>{t.emptyText}</p>}
    <ul className="saved-list">
      {shown.map((item) => {
        const href = item.kind === "answer" ? `/${lang}/saved/${encodeURIComponent(item.key)}` : `/${item.lang}/start/${item.key}`;
        const arabic = /\p{Script=Arabic}/u.test(item.title);
        return <li key={`${item.kind}-${item.key}`}>
          <Link href={href} dir={arabic ? "rtl" : undefined} lang={arabic ? "ar" : undefined} className={arabic ? "is-arabic" : undefined}>
            <strong dir="auto">{item.title}</strong>
            <small>{item.kind === "lesson" && lessonNumbers[item.key] ? `${t.lessonLabel} ${lessonNumbers[item.key]} · ` : ""}{date(item.savedAt)}</small>
          </Link>
          <button type="button" className="saved-remove" aria-label={`${t.remove}: ${item.title}`} onClick={() => void remove(item.kind, item.key)}><X aria-hidden="true" /></button>
        </li>;
      })}
    </ul>
  </>;
}
