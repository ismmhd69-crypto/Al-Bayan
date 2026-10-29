import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates, buildArticleSchema, buildContentDescription } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { findLearningLesson, learningChapters, learningLessons, lessonReferences, lessonSummary, referenceVerseKeys, splitLearningLesson } from "@/lib/learning/course";
import { lessonExtras } from "@/lib/learning/extras";
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
  const canonicalUrl = buildCanonicalUrl(lang, `/start/${id}`);
  const alternates = {
    canonical: canonicalUrl,
    languages: buildLanguageAlternates(`/start/${id}`),
  };
  if (!isLocale(lang) || !lesson) return { alternates };
  const description = buildContentDescription(splitLearningLesson(lesson.body[lang], lang).core);
  return {
    title: lesson.title[lang],
    description,
    alternates,
    openGraph: {
      title: lesson.title[lang],
      description,
      url: canonicalUrl,
      type: "article",
    },
  };
}

export default async function LearningLessonPage({ params }: Params) {
  const { lang, lesson: id } = await params;
  const lesson = findLearningLesson(id);
  if (!isLocale(lang) || !lesson) notFound();

  const index = learningLessons.indexOf(lesson);
  const body = lesson.body[lang];
  const references = lessonReferences(body);
  const verseCount = new Set(references.flatMap(referenceVerseKeys)).size;
  const chapterTitle = learningChapters.find((chapter) => chapter.id === lesson.chapter)?.title[lang] ?? "";

  const articleSchema = buildArticleSchema({
    title: lesson.title[lang],
    description: buildContentDescription(splitLearningLesson(body, lang).core),
    url: buildCanonicalUrl(lang, `/start/${id}`),
    lang,
  });

  return (
    <>
      <JsonLd data={articleSchema} />
      <LearningLesson
        lang={lang}
        lesson={lessonSummary(lesson, lang)}
        chapterTitle={chapterTitle}
        verseCount={verseCount}
        extras={lessonExtras(lesson, lang)}
        parts={splitLearningLesson(body, lang)}
        references={references}
        lessonIds={learningLessons.map((item) => item.id)}
        previous={index > 0 ? lessonSummary(learningLessons[index - 1], lang) : null}
        next={index < learningLessons.length - 1 ? lessonSummary(learningLessons[index + 1], lang) : null}
        quran={
          <Suspense key={`quran-${lesson.id}-${lang}`} fallback={<p className="learning-small" role="status">{learningText[lang].evidenceLoading}</p>}>
            <LearningEvidence key={`evidence-${lesson.id}-${lang}`} lang={lang} references={references} />
          </Suspense>
        }
      />
    </>
  );
}
