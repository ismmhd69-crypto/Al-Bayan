import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { steps } from "@/data/steps";
import StepsList from "@/components/StepsList";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).start.title } : {};
}

export default async function StartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).start;

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>
      </header>
      <StepsList
        lang={lang}
        t={t}
        items={steps.map((s) => ({
          id: s.id,
          title: s.title[lang],
          text: s.text[lang],
          topicId: s.topicId,
          answerId: s.answerId,
          question: s.question?.[lang],
        }))}
      />
    </div>
  );
}
