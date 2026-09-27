import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Hourglass } from "lucide-react";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { getTopic, getTopicIds } from "@/lib/content";
import AskAboutButton from "@/components/AskAboutButton";

type Params = Promise<{ lang: string; id: string }>;

export const revalidate = 3600;
// New topics added to the database get their page on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await getTopicIds();
  return locales.flatMap((lang) => ids.map((id) => ({ lang, id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const topic = isLocale(lang) ? await getTopic(id, lang) : null;
  return topic ? { title: topic.title } : {};
}

export default async function TopicPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const topic = await getTopic(id, lang);
  if (!topic) notFound();
  const t = getDictionary(lang).topics;
  const related = topic.related;

  return (
    <article className="page">
      <Link href={`/${lang}/topics`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {t.backToList}
      </Link>

      <header className="page-head">
        <p className="eyebrow">{t.categories[topic.category]}</p>
        <h1>{topic.title}</h1>
        <p className="lead">{topic.question}</p>
      </header>

      {topic.shortAnswer ? (
        <p className="card">{topic.shortAnswer}</p>
      ) : (
        <div className="card card-soft">
          <Hourglass aria-hidden="true" className="card-icon" />
          <p>{t.preparing}</p>
        </div>
      )}

      <AskAboutButton lang={lang} question={topic.question} label={t.askAbout} />

      {related.length > 0 && (
        <section className="topic-group" aria-labelledby="related-h">
          <h2 id="related-h" className="eyebrow">
            {t.related}
          </h2>
          <ul className="list">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/${lang}/topics/${r.id}`} className="list-row">
                  <span className="list-title">{r.title}</span>
                  <ChevronRight aria-hidden="true" className="flip-rtl" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
