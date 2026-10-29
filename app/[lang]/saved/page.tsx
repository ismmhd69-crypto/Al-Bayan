import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { savedText } from "@/lib/saved/text";
import { learningLessons } from "@/lib/learning/course";
import SavedList from "@/components/saved/SavedList";

// Personal list of saved answers and lessons. Its content lives on the device or in the person's
// account, so the page itself is never indexed.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? savedText[lang].title : undefined, robots: { index: false, follow: false } };
}

export default async function SavedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const lessonNumbers = Object.fromEntries(learningLessons.map((lesson) => [lesson.id, lesson.number]));
  return <div className="page saved-page">
    <h1>{savedText[lang].title}</h1>
    <SavedList lang={lang} lessonNumbers={lessonNumbers} />
  </div>;
}
