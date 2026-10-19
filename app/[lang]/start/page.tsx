import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { learningChapters, learningLessons, lessonSummary } from "@/lib/learning/course";
import { learningText } from "@/lib/learning/text";
import LearningJourney from "@/components/learning/LearningJourney";
import "./learning.css";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).start.title } : {};
}

export default async function StartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = learningText[lang];

  return (
    <div className="page learning-page">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>
      </header>
      <LearningJourney
        lang={lang}
        lessons={learningLessons.map((lesson) => lessonSummary(lesson, lang))}
        chapters={learningChapters.map((chapter) => ({ id: chapter.id, title: chapter.title[lang] }))}
      />
    </div>
  );
}
