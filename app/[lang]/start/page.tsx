import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { learningChapters, learningLessons, lessonSummary } from "@/lib/learning/course";
import { learningText } from "@/lib/learning/text";
import LearningJourney from "@/components/learning/LearningJourney";
import "./learning.css";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang).start;
  return {
    title: t.title,
    description: t.intro,
    alternates: {
      canonical: buildCanonicalUrl(lang, "/start"),
      languages: buildLanguageAlternates("/start"),
    },
  };
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
