import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { categoryOrder, getTopics } from "@/lib/content";
import TopicBrowser from "@/components/TopicBrowser";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).topics.title } : {};
}

export const revalidate = 3600;

export default async function TopicsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).topics;
  const topics = await getTopics(lang);

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
        items={topics}
      />
    </div>
  );
}
