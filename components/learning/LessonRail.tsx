"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { LessonExtras } from "@/lib/learning/extras";
import { learningText, learningCourseProgress, learningSourceLabel } from "@/lib/learning/text";

export type RailSection = { id: string; label: string };

/** Wide screens only: sections of this lesson, reading percent, key takeaways and course dots. */
export default function LessonRail({ lang, sections, percent, takeaways, lessonIds, currentId, readIds }: {
  lang: Locale; sections: RailSection[]; percent: number; takeaways: LessonExtras["takeaways"] | null;
  lessonIds: string[]; currentId: string; readIds: string[];
}) {
  const t = learningText[lang];
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const update = () => {
      let current = sections[0]?.id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top < 200) current = section.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [sections]);
  return <aside className="lesson-rail" aria-label={t.inThisLesson}>
    <h2 className="lesson-rail-title">{t.inThisLesson}</h2>
    <nav className="lesson-toc">
      {sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>{section.label}</a>)}
    </nav>
    <p className="lesson-rail-percent"><strong>{percent} %</strong>{t.percentRead}</p>
    {takeaways && <>
      <h2 className="lesson-rail-title">{t.keyTakeaways}</h2>
      <ul className="lesson-takeaways">
        {takeaways.map(({ text, reference }) => <li key={text}>{text} <a href={`#learning-source-${reference.id}`}>{learningSourceLabel(reference.title, lang)}</a></li>)}
      </ul>
    </>}
    <h2 className="lesson-rail-title">{learningCourseProgress(lang, readIds.length, lessonIds.length)}</h2>
    <div className="lesson-dots" aria-hidden="true">
      {lessonIds.map((id) => <i key={id} className={id === currentId ? "is-current" : readIds.includes(id) ? "is-read" : undefined} />)}
    </div>
  </aside>;
}
