"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { LearningReference, LessonParts, LessonSummary, PrayerKey } from "@/lib/learning/course";
import type { LessonExtras } from "@/lib/learning/extras";
import { learningText, learningReadingTime, learningSourceLabel, learningVerseCount } from "@/lib/learning/text";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { useReadingProgress } from "./useReadingProgress";
import LearningMarkdown from "./LearningMarkdown";
import PrayerUnitTracker from "./PrayerUnitTracker";
import LessonQuiz from "./LessonQuiz";
import { SaveLessonButton } from "@/components/saved/SaveButtons";
import LessonRail, { type RailSection } from "./LessonRail";
const chapterLabel = (id: number, language: Locale) =>
  language === "ar"
    ? ["أ", "ب", "ج", "د", "هـ", "و"][id - 1] ?? String.fromCharCode(64 + id)
    : String.fromCharCode(64 + id);

/** How far the reader has scrolled through the page, 0 to 100. */
function useScrollPercent() {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const update = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      setPercent(room > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / room) * 100))) : 100);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return percent;
}

export default function LearningLesson({ lang, lesson, chapterTitle, verseCount, parts, references, lessonIds, previous, next, quran, extras }: {
  lang: Locale; lesson: LessonSummary; chapterTitle: string; verseCount: number; parts: LessonParts; references: LearningReference[]; lessonIds: string[];
  previous: LessonSummary | null; next: LessonSummary | null; quran: ReactNode; extras: LessonExtras | null;
}) {
  const t = learningText[lang];
  const { progress, ready, storageAvailable, visit, toggle, markRead } = useReadingProgress(lessonIds);
  const [prayer, setPrayer] = useState<PrayerKey>("fajr");
  const [shared, setShared] = useState(false);
  const percent = useScrollPercent();
  useEffect(() => { if (ready) visit(lesson.id); }, [ready, lesson.id, visit]);
  const byId = Object.fromEntries(references.map((ref) => [ref.id, ref]));
  const isRead = progress.read.includes(lesson.id);
  const hasQuran = references.some((ref) => ref.kind === "quran");
  const otherSources = references.some((r) => r.kind === "hadith" || r.kind === "scholar");
  function choosePrayer(key: string) {
    if (!["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(key)) return;
    setPrayer(key as PrayerKey);
    document.getElementById("learning-prayer-branch")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }
  async function share() {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) { await navigator.share({ title: lesson.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setShared(true); setTimeout(() => setShared(false), 2500);
    } catch { /* The visitor closed the share sheet or copying is blocked. */ }
  }
  const prose = (text: string) => <LearningMarkdown text={text} lang={lang} references={byId} lessonIds={lessonIds} onPrayer={choosePrayer} isPrayerLesson={lesson.id === "how-to-pray"} isWuduLesson={lesson.id === "wudu"} lessonId={lesson.id} />;
  const selected = parts.branches.find((branch) => branch.key === prayer);
  const sections: RailSection[] = [
    { id: "lesson-answer", label: t.core },
    { id: "lesson-understand", label: t.understand },
    ...(hasQuran ? [{ id: "lesson-quran", label: t.quran }] : []),
    { id: "lesson-guide", label: t.guide },
    ...(parts.followups.length ? [{ id: "lesson-questions", label: t.followups }] : []),
    ...(extras ? [{ id: "lesson-quiz", label: t.quickCheck }] : []),
    ...(otherSources ? [{ id: "lesson-sources", label: t.sources }] : []),
  ];
  const takeaways = extras && <ul className="lesson-takeaways">
    {extras.takeaways.map(({ text, reference }) => <li key={text}>{text} <a href={`#learning-source-${reference.id}`}>{learningSourceLabel(reference.title, lang)}</a></li>)}
  </ul>;

  return <div className="lesson-layout">
    <div className="lesson-bar">
      <Link href={`/${lang}/start`} className="lesson-bar-back"><ArrowLeft className="learning-arrow" aria-hidden="true" />{t.overview}</Link>
      <span className="lesson-bar-where">{t.chapter} {chapterLabel(lesson.chapter, lang)} · {t.lesson} {lesson.number} / {lessonIds.length}</span>
      <SaveLessonButton lang={lang} id={lesson.id} title={lesson.title} />
      <button type="button" className="lesson-bar-share" onClick={() => void share()} aria-label={t.share}><Share2 aria-hidden="true" /></button>
      <span className="lesson-bar-status" role="status">{shared ? t.linkCopied : ""}</span>
      <span className="lesson-bar-meter" aria-hidden="true"><i style={{ inlineSize: `${percent}%` }} /></span>
    </div>

    <article className="page learning-page learning-reader">
      <header className="lesson-head">
        <p className="lesson-eyebrow"><strong>{t.chapter} {chapterLabel(lesson.chapter, lang)} · {chapterTitle}</strong><span>{learningReadingTime(lang, lesson.minutes)}</span>{verseCount > 0 && <span>{learningVerseCount(lang, verseCount)}</span>}</p>
        <h1>{lesson.title}</h1>
        {extras && <div className="lesson-head-actions"><a className="btn btn-ghost" href="#lesson-quiz">{t.jumpToQuiz}</a></div>}
      </header>

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

      <section id="lesson-answer" className="learning-core" aria-labelledby="learning-core-title"><h2 id="learning-core-title"><BookOpen aria-hidden="true" />{t.core}</h2>{prose(parts.core)}</section>
      {takeaways && <section className="lesson-takeaways-inline" aria-labelledby="lesson-takeaways-title"><h2 id="lesson-takeaways-title">{t.keyTakeaways}</h2>{takeaways}</section>}
      <section id="lesson-understand" className="lesson-section" aria-labelledby="learning-explanation-title"><h2 id="learning-explanation-title">{t.understand}</h2>{prose(parts.explanation)}</section>
      {quran}
      <section id="lesson-guide" className="learning-guide" aria-labelledby="learning-guide-title"><h2 id="learning-guide-title">{t.guide}</h2>{prose(parts.guide)}</section>
      {parts.followups.length > 0 && <section id="lesson-questions" className="learning-followups lesson-section" aria-labelledby="learning-followups-title"><h2 id="learning-followups-title">{t.followups}</h2>{parts.followups.map((item) => <details key={item.question} className="learning-followup"><summary>{item.question}<ChevronDown className="chev" aria-hidden="true" /></summary>{prose(item.answer)}</details>)}</section>}
      {extras && <LessonQuiz lang={lang} quiz={extras.quiz} onSolved={() => markRead(lesson.id)} />}
      {lesson.number === 29 && <Link href={`/${lang}/topics`} className="text-link">{t.difficultQuestions}</Link>}
      <div className="learning-mark">
        {/* With a quick check, answering it correctly completes the lesson; the button then only offers undo. */}
        {extras && !isRead
          ? <p className="lesson-complete-hint" aria-live="polite"><Check aria-hidden="true" />{t.completeByQuiz}</p>
          : <button className={`btn lesson-complete ${isRead ? "btn-ghost" : "btn-primary"}`} type="button" aria-pressed={isRead} onClick={() => toggle(lesson.id)}><Check aria-hidden="true" />{isRead ? t.lessonCompleted : t.completeLesson}</button>}
        <p className="learning-small" aria-live="polite">{storageAvailable ? t.storage : t.storageUnavailable}</p>
      </div>
      <section className="learning-next-section" aria-label={t.next}>
        {parts.transition && <aside className="learning-next-note">{prose(parts.transition)}</aside>}
        <nav className={`learning-reader-footer ${!previous ? "learning-reader-footer--single" : ""}`} aria-label={t.chapters}>
          {previous && <Link className="learning-neighbour learning-neighbour--prev" href={`/${lang}/start/${previous.id}`} prefetch={false}><span><ArrowLeft className="learning-arrow" aria-hidden="true" />{t.previous}</span><strong>{previous.number} · {previous.title}</strong></Link>}
          {next ? <Link className={`learning-neighbour learning-neighbour--next ${!previous ? "learning-neighbour--full" : ""}`} href={`/${lang}/start/${next.id}`} prefetch={false}><span>{t.next}<ArrowRight className="learning-arrow" aria-hidden="true" /></span><strong>{next.number} · {next.title}</strong></Link> : <p className="learning-completed-note">{t.completed}</p>}
        </nav>
      </section>
      {otherSources && (
        <section id="lesson-sources" className="learning-other-evidence" aria-labelledby="learning-evidence-title"><h2 id="learning-evidence-title">{t.sources}</h2>
          {(["hadith", "scholar"] as const).map((kind) => {
            const entries = references.filter((reference) => reference.kind === kind);
            return entries.length > 0 && <section className="learning-reference-group" key={kind}><h3>{kind === "hadith" ? t.hadith : t.scholars}</h3>{entries.map((ref) => <details key={ref.id} className="learning-source answer-source-card" id={`learning-source-${ref.id}`} tabIndex={-1}><summary><span>{learningSourceLabel(ref.title, lang)}</span><ChevronDown className="chev" aria-hidden="true" /></summary><div className="learning-source-content"><p>{t.sourceNote}</p><a href={ref.url} className="text-link" target="_blank" rel="noopener noreferrer">{t.openSource}<ExternalLink aria-hidden="true" size={14} /></a></div></details>)}</section>;
          })}
        </section>
      )}
      <footer className="learning-small learning-status-note"><p>{t.guideStatus}</p><p>{t.noPersonal}</p>{hasQuran && <p><a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer" className="text-link">{ATTRIBUTION.text}</a> · {t.reciter}</p>}</footer>
    </article>

    <LessonRail lang={lang} sections={sections} percent={percent} takeaways={extras?.takeaways ?? null}
      lessonIds={lessonIds} currentId={lesson.id} readIds={progress.read} />
  </div>;
}
