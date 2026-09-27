import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { categoryOrder, topics } from "@/data/topics";
import TopicBrowser from "@/components/TopicBrowser";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).topics.title } : {};
}

export default async function TopicsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).topics;

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>
      </header>
      <TopicBrowser
        lang={lang}
        allLabel={t.all}
        categories={categoryOrder.map((id) => ({ id, name: t.categories[id] }))}
        items={topics.map((x) => ({
          id: x.id,
          category: x.category,
          title: x.title[lang],
          question: x.question[lang],
        }))}
      />
    </div>
  );
}
