"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { LearningReference, LessonParts, LessonSummary, PrayerKey } from "@/lib/learning/course";
import { learningText, learningReadingTime, learningSourceLabel } from "@/lib/learning/text";
import { useReadingProgress } from "./useReadingProgress";
import LearningMarkdown, { LearningInline } from "./LearningMarkdown";
import PrayerUnitTracker from "./PrayerUnitTracker";
const chapterLabel = (id: number, language: Locale) =>
  language === "ar"
    ? ["أ", "ب", "ج", "د", "هـ", "و"][id - 1] ?? String.fromCharCode(64 + id)
    : String.fromCharCode(64 + id);

export default function LearningLesson({ lang, lesson, parts, references, lessonIds, previous, next, quran }: {
  lang: Locale; lesson: LessonSummary; parts: LessonParts; references: LearningReference[]; lessonIds: string[]; previous: LessonSummary | null; next: LessonSummary | null; quran: ReactNode;
}) {
  const t = learningText[lang];
  const { progress, ready, storageAvailable, visit, toggle } = useReadingProgress(lessonIds);
  const [prayer, setPrayer] = useState<PrayerKey>("fajr");
  useEffect(() => { if (ready) visit(lesson.id); }, [ready, lesson.id, visit]);
  const byId = Object.fromEntries(references.map((ref) => [ref.id, ref]));
  const isRead = progress.read.includes(lesson.id);
  function choosePrayer(key: string) {
    if (!["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(key)) return;
    setPrayer(key as PrayerKey);
    document.getElementById("learning-prayer-branch")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }
  const prose = (text: string) => <LearningMarkdown text={text} lang={lang} references={byId} lessonIds={lessonIds} onPrayer={choosePrayer} isPrayerLesson={lesson.id === "how-to-pray"} isWuduLesson={lesson.id === "wudu"} lessonId={lesson.id} />;
  const selected = parts.branches.find((branch) => branch.key === prayer);
  return <article className="page learning-page learning-reader">
    <nav className="learning-reader-nav" aria-label={t.overview}><Link href={`/${lang}/start`} className="text-link"><ArrowLeft className="learning-arrow" aria-hidden="true" />{t.overview}</Link><span className="learning-small">{t.chapter} {chapterLabel(lesson.chapter, lang)} · {t.lesson} {lesson.number} / 32</span></nav>
    <header className="page-head"><h1>{lesson.title}</h1><p className="learning-small">{learningReadingTime(lang, lesson.minutes)}</p></header>
    {parts.branches.length > 0 && <aside className="learning-prayer-intro prayer-picker-box">
      <p>{t.prayerScope}</p>
      <div className="prayer-pills-row" role="tablist" aria-label={t.choosePrayer}>
        {parts.branches.map((branch, i) => {
          const unitsText = lang === "ar" ? ["ركعتان", "أربع ركعات", "أربع ركعات", "ثلاث ركعات", "أربع ركعات"][i] : `${[2, 4, 4, 3, 4][i]} ${t.units}`;
          const isSelected = prayer === branch.key;
          return (
            <button
              key={branch.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`prayer-pill ${isSelected ? "active" : ""}`}
              onClick={() => choosePrayer(branch.key)}
            >
              <span className="prayer-pill-name">{t.prayerNames[i]}</span>
              <span className="prayer-pill-units">{unitsText}</span>
            </button>
          );
        })}
      </div>
      <p className="learning-small">{t.commonSequence}</p>
    </aside>}

    {selected && <section id="learning-prayer-branch" className="learning-prayer-branch" aria-labelledby="learning-prayer-branch-title">
      <h2 id="learning-prayer-branch-title">{t.prayerSequence}: {t.prayerNames[["fajr", "dhuhr", "asr", "maghrib", "isha"].indexOf(prayer)]}</h2>
      {prose(selected.text)}
      <PrayerUnitTracker prayer={prayer} lang={lang} />
    </section>}

    <section className="learning-core" aria-labelledby="learning-core-title"><h2 id="learning-core-title"><BookOpen aria-hidden="true" />{t.core}</h2>{prose(parts.core)}</section>
    <section aria-labelledby="learning-explanation-title"><h2 id="learning-explanation-title">{t.understand}</h2>{prose(parts.explanation)}</section>
    {quran}
    <section className="learning-guide" aria-labelledby="learning-guide-title"><h2 id="learning-guide-title">{t.guide}</h2>{prose(parts.guide)}</section>
    <section className="learning-followups" aria-labelledby="learning-followups-title"><h2 id="learning-followups-title">{t.followups}</h2>{parts.followups.map((item) => <details key={item.question} className="learning-followup"><summary>{item.question}<ChevronDown className="chev" aria-hidden="true" /></summary>{prose(item.answer)}</details>)}</section>
    {lesson.number === 29 && <Link href={`/${lang}/topics`} className="text-link">{t.difficultQuestions}</Link>}
    <div className="learning-mark">
      <button className={`btn ${isRead ? "btn-ghost" : "btn-primary"}`} type="button" aria-pressed={isRead} onClick={() => toggle(lesson.id)}>{isRead && <Check aria-hidden="true" />}{isRead ? t.undo : t.mark}</button>
      <p className="learning-small" aria-live="polite">{storageAvailable ? t.storage : t.storageUnavailable}</p>
    </div>
    <section className="learning-next-section" aria-label={t.next}>
      {parts.transition && <aside className="learning-next-note">{prose(parts.transition)}</aside>}
      <nav className={`learning-reader-footer ${!previous ? "learning-reader-footer--single" : ""}`} aria-label={t.chapters}>
        {previous && <Link className="learning-neighbour learning-neighbour--prev" href={`/${lang}/start/${previous.id}`} prefetch={false}><span><ArrowLeft className="learning-arrow" aria-hidden="true" />{t.previous}</span><strong>{previous.title}</strong></Link>}
        {next ? <Link className={`learning-neighbour learning-neighbour--next ${!previous ? "learning-neighbour--full" : ""}`} href={`/${lang}/start/${next.id}`} prefetch={false}><span>{t.next}<ArrowRight className="learning-arrow" aria-hidden="true" /></span><strong>{next.title}</strong></Link> : <p className="learning-completed-note">{t.completed}</p>}
      </nav>
    </section>
    {references.some((r) => r.kind === "hadith" || r.kind === "scholar") && (
      <section className="learning-other-evidence" aria-labelledby="learning-evidence-title"><h2 id="learning-evidence-title">{t.sources}</h2>
        {(["hadith", "scholar"] as const).map((kind) => {
          const entries = references.filter((reference) => reference.kind === kind);
          return entries.length > 0 && <section className="learning-reference-group" key={kind}><h3>{kind === "hadith" ? t.hadith : t.scholars}</h3>{entries.map((ref) => <details key={ref.id} className="learning-source answer-source-card" id={`learning-source-${ref.id}`} tabIndex={-1}><summary><span>{learningSourceLabel(ref.title, lang)}</span><ChevronDown className="chev" aria-hidden="true" /></summary><div className="learning-source-content"><p>{t.sourceNote}</p><a href={ref.url} className="text-link" target="_blank" rel="noopener noreferrer">{t.openSource}<ExternalLink aria-hidden="true" size={14} /></a></div></details>)}</section>;
        })}
      </section>
    )}
    <footer className="learning-small learning-status-note"><p>{t.guideStatus}</p><p>{t.noPersonal}</p></footer>
  </article>;
}
