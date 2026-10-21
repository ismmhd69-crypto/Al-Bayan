"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronDown, Compass } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { LessonSummary } from "@/lib/learning/course";
import { learningText, learningProgressLabel, learningReadingTime } from "@/lib/learning/text";
import { LEGACY_PROGRESS_KEY } from "@/lib/learning/progress";
import { useReadingProgress } from "./useReadingProgress";
const chapterLabel = (id: number, language: Locale) =>
  language === "ar"
    ? ["أ", "ب", "ج", "د", "هـ", "و"][id - 1] ?? String.fromCharCode(64 + id)
    : String.fromCharCode(64 + id);

export default function LearningJourney({ lang, lessons, chapters }: { lang: Locale; lessons: LessonSummary[]; chapters: { id: number; title: string }[] }) {
  const t = learningText[lang];
  const { progress, ready, storageAvailable } = useReadingProgress(lessons.map((lesson) => lesson.id));
  const [legacy, setLegacy] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([1]);
  const last = lessons.find((lesson) => lesson.id === progress.last);
  useEffect(() => { if (ready && last) setExpanded([last.chapter]); }, [ready, last?.chapter]);
  useEffect(() => { try { const value: unknown = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) ?? "[]"); setLegacy(Array.isArray(value) && value.some((id) => ["purpose", "allah", "quran", "prophet", "pillars", "reason"].includes(id))); } catch { /* Keep the previous key untouched. */ } }, []);
  const label = (done: number, total: number) => learningProgressLabel(lang, done, total);
  return <>
    {ready && last && <section className="learning-resume" aria-labelledby="learning-resume-title">
      <div><p className="eyebrow">{t.continue}</p><h2 id="learning-resume-title">{last.title}</h2><p>{t.chapter} {chapterLabel(last.chapter, lang)} · {t.lesson} {last.number}</p></div>
      <Link className="btn btn-primary" href={`/${lang}/start/${last.id}`} prefetch={false}>{t.continue}<ArrowRight aria-hidden="true" className="learning-arrow" /></Link>
      <p className="learning-resume-note">{t.resumeNote}</p>
    </section>}

    <div className="learning-entrances">
      {[["what-is-islam", t.exploring, t.exploringNote, Compass], ["becoming-muslim", t.newcomer, t.newcomerNote, BookOpen]].map(([id, title, note, Icon]) => {
        const Mark = Icon as typeof Compass;
        return <Link key={id as string} className="learning-entrance" href={`/${lang}/start/${id}`} prefetch={false}><Mark aria-hidden="true" /><h2>{title as string}</h2><p>{note as string}</p><span className="text-link">{t.start}<ArrowRight aria-hidden="true" className="learning-arrow" /></span></Link>;
      })}
    </div>
    <section className="progress learning-progress" aria-label={t.chapters}>
      <p aria-live="polite">{label(progress.read.length, lessons.length)}</p>
      <progress max={lessons.length} value={progress.read.length} aria-label={label(progress.read.length, lessons.length)} />
      <p>{t.progressNote}</p>
      <p>{storageAvailable ? t.storage : t.storageUnavailable}</p>
    </section>
    {legacy && <p className="learning-small">{t.legacy}</p>}
    <section className="learning-chapters" aria-labelledby="learning-chapters-title"><h2 id="learning-chapters-title">{t.chapters}</h2>
      {chapters.map((chapter) => {
        const items = lessons.filter((lesson) => lesson.chapter === chapter.id), read = items.filter((lesson) => progress.read.includes(lesson.id)).length;
        const isOpen = expanded.includes(chapter.id);
        return <section className="learning-chapter" key={chapter.id}>
          <h3><button className="learning-chapter-toggle" type="button" aria-expanded={isOpen} aria-controls={`learning-chapter-${chapter.id}`} onClick={() => setExpanded((value) => value.includes(chapter.id) ? value.filter((id) => id !== chapter.id) : [...value, chapter.id])}>
            <span className="step-num" aria-hidden="true">{read === items.length ? <Check /> : chapterLabel(chapter.id, lang)}</span><span>{chapter.title}<small>{label(read, items.length)}</small></span><ChevronDown aria-hidden="true" className={isOpen ? "learning-chevron-open" : ""} />
          </button></h3>
          <ol id={`learning-chapter-${chapter.id}`} className="learning-lesson-list" hidden={!isOpen}>
            {items.map((lesson) => { const isRead = progress.read.includes(lesson.id); return <li key={lesson.id}><Link href={`/${lang}/start/${lesson.id}`} prefetch={false} aria-current={last?.id === lesson.id ? "page" : undefined} className={isRead ? "learning-is-read" : ""}><span className="learning-status" aria-hidden="true">{isRead ? <Check /> : lesson.number}</span><span><strong>{lesson.title}</strong><small>{learningReadingTime(lang, lesson.minutes)}{isRead ? ` · ${t.read}` : ""}</small></span><ArrowRight aria-hidden="true" className="learning-arrow" /></Link></li>; })}
          </ol>
        </section>;
      })}
    </section>
  </>;
}
