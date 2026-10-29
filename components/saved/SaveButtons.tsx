"use client";

import { useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SavedAnswer } from "@/lib/chat/answer-store";
import { answerItem, answerKey, lessonItem } from "@/lib/saved/store";
import { savedText } from "@/lib/saved/text";
import { useSaved, type SaveResult } from "@/lib/saved/useSaved";

/** A short message at the bottom of the screen, read out by screen readers. */
function useToast() {
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = (message: string) => { setText(message); clearTimeout(timer.current); timer.current = setTimeout(() => setText(""), 2400); };
  const node = <span className={`saved-toast${text ? " is-on" : ""}`} role="status" aria-live="polite">{text}</span>;
  return [node, show] as const;
}

const resultText = (lang: Locale, result: SaveResult) => {
  const t = savedText[lang];
  return result === "saved" ? t.toastSaved : result === "device" ? t.toastDevice : result === "dropped" ? t.toastDropped : t.toastFailed;
};

/** The Save pill at the end of a finished answer. Tapping again removes it from Saved. */
export function SaveAnswerButton({ lang, question, answer }: { lang: Locale; question: string; answer: SavedAnswer }) {
  const t = savedText[lang];
  const { isSaved, save, remove } = useSaved();
  const [toast, show] = useToast();
  const [busy, setBusy] = useState(false);
  const key = answerKey(question, answer);
  const saved = isSaved("answer", key);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (saved) show((await remove("answer", key)) ? t.toastRemoved : t.toastFailed);
    else show(resultText(lang, await save(answerItem({ key, question, lang, answer }))));
    setBusy(false);
  }
  return <>
    <button type="button" className={`report-toggle saved-pill${saved ? " is-saved" : ""}`} aria-pressed={saved} onClick={() => void toggle()}>
      <Bookmark aria-hidden="true" />{saved ? t.saved : t.save}
    </button>
    {toast}
  </>;
}

/** The bookmark in a lesson's top bar. */
export function SaveLessonButton({ lang, id, title }: { lang: Locale; id: string; title: string }) {
  const t = savedText[lang];
  const { isSaved, save, remove } = useSaved();
  const [toast, show] = useToast();
  const saved = isSaved("lesson", id);
  async function toggle() {
    if (saved) show((await remove("lesson", id)) ? t.toastRemoved : t.toastFailed);
    else show(resultText(lang, await save(lessonItem({ id, title, lang }))));
  }
  return <>
    <button type="button" className={`lesson-bar-share saved-bookmark${saved ? " is-saved" : ""}`} aria-pressed={saved} aria-label={saved ? t.removeLesson : t.saveLesson} onClick={() => void toggle()}>
      <Bookmark aria-hidden="true" />
    </button>
    {toast}
  </>;
}
