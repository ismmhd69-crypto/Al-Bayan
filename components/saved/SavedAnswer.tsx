"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SavedAnswer as Stored } from "@/lib/chat/answer-store";
import { savedText } from "@/lib/saved/text";
import { useSaved } from "@/lib/saved/useSaved";
import { RichAnswerView } from "@/components/RichAnswerView";
import { AnswerV2View } from "@/components/AnswerV2View";

/** Opens one saved answer: the stored copy goes to /api/saved/hydrate, which loads the Quran and hadith
 * texts fresh and validates the whole answer. Anything that fails is not shown at all. */
export default function SavedAnswer({ lang, id, text }: { lang: Locale; id: string; text: Dictionary["ask"] }) {
  const t = savedText[lang];
  const { ready, items } = useSaved();
  const item = items.find((x) => x.kind === "answer" && x.key === id);
  const [state, setState] = useState<{ status: "loading" } | { status: "ok"; answer: Stored } | { status: "unavailable" }>({ status: "loading" });
  useEffect(() => {
    if (!ready) return;
    if (!item?.answer) { setState({ status: "unavailable" }); return; }
    let live = true;
    setState({ status: "loading" });
    fetch("/api/saved/hydrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: item.answer }) })
      .then(async (r) => { const body = await r.json().catch(() => null); if (live) setState(r.ok && body?.answer ? { status: "ok", answer: body.answer } : { status: "unavailable" }); })
      .catch(() => { if (live) setState({ status: "unavailable" }); });
    return () => { live = false; };
  }, [ready, item?.answer]);
  const date = item ? (() => { try { return new Date(item.savedAt).toLocaleDateString(lang === "ar" ? "ar" : lang, { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } })() : "";
  const answer = state.status === "ok" ? state.answer : null;
  return <>
    <Link href={`/${lang}/saved`} className="back-link"><ArrowLeft aria-hidden="true" className="flip-rtl" />{t.back}</Link>
    {item && <header className="page-head saved-answer-head">
      <h1 dir="auto">{item.question}</h1>
      <p className="saved-note">{t.savedOn} {date}</p>
    </header>}
    {state.status === "loading" && <p className="saved-note" role="status">{t.loading}</p>}
    {state.status === "unavailable" && <p className="saved-empty"><strong>{t.unavailable}</strong><Link href={`/${lang}/ask`} className="btn btn-primary">{t.askAgain}</Link></p>}
    {answer && (answer.version === 2
      ? <AnswerV2View answer={answer} t={text} id={0} />
      : <RichAnswerView sections={answer.sections} language={answer.language} text={text} guide={answer.guide ?? null} videos={answer.videos} complete />)}
  </>;
}
