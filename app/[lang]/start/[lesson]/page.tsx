import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { findLearningLesson, learningLessons, lessonReferences, lessonSummary, splitLearningLesson } from "@/lib/learning/course";
import { learningText } from "@/lib/learning/text";
import LearningLesson from "@/components/learning/LearningLesson";
import LearningEvidence from "@/components/learning/LearningEvidence";
import "../learning.css";

// Stream Quran passages at reading time, using the existing one-day source cache.
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ lang: string; lesson: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, lesson: id } = await params;
  const lesson = findLearningLesson(id);
  return isLocale(lang) && lesson ? { title: lesson.title[lang], alternates: { languages: Object.fromEntries(["en", "ar", "de"].map((locale) => [locale, `/${locale}/start/${id}`])) } } : {};
}
export default async function LearningLessonPage({ params }: Params) {
  const { lang, lesson: id } = await params;
  const lesson = findLearningLesson(id);
  if (!isLocale(lang) || !lesson) notFound();
  const index = learningLessons.indexOf(lesson), body = lesson.body[lang], references = lessonReferences(body);
  return <LearningLesson lang={lang} lesson={lessonSummary(lesson, lang)} parts={splitLearningLesson(body, lang)} references={references} lessonIds={learningLessons.map((item) => item.id)}
    previous={index > 0 ? lessonSummary(learningLessons[index - 1], lang) : null} next={index < learningLessons.length - 1 ? lessonSummary(learningLessons[index + 1], lang) : null}
    quran={<Suspense key={`quran-${lesson.id}-${lang}`} fallback={<p className="learning-small" role="status">{learningText[lang].evidenceLoading}</p>}><LearningEvidence key={`evidence-${lesson.id}-${lang}`} lang={lang} references={references} /></Suspense>} />;
}
