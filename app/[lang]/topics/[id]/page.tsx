import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Hourglass } from "lucide-react";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { getTopic, topics } from "@/data/topics";
import AskAboutButton from "@/components/AskAboutButton";

type Params = Promise<{ lang: string; id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => topics.map((t) => ({ lang, id: t.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const topic = getTopic(id);
  return isLocale(lang) && topic ? { title: topic.title[lang] } : {};
}

export default async function TopicPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  const topic = getTopic(id);
  if (!isLocale(lang) || !topic) notFound();
  const t = getDictionary(lang).topics;
  const related = topic.related.map(getTopic).filter((x) => x !== undefined);

  return (
    <article className="page">
      <Link href={`/${lang}/topics`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {t.backToList}
      </Link>

      <header className="page-head">
        <p className="eyebrow">{t.categories[topic.category]}</p>
        <h1>{topic.title[lang]}</h1>
        <p className="lead">{topic.question[lang]}</p>
      </header>

      <div className="card card-soft">
        <Hourglass aria-hidden="true" className="card-icon" />
        <p>{t.preparing}</p>
      </div>

      <AskAboutButton lang={lang} question={topic.question[lang]} label={t.askAbout} />

      {related.length > 0 && (
        <section className="topic-group" aria-labelledby="related-h">
          <h2 id="related-h" className="eyebrow">
            {t.related}
          </h2>
          <ul className="list">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/${lang}/topics/${r.id}`} className="list-row">
                  <span className="list-title">{r.title[lang]}</span>
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
