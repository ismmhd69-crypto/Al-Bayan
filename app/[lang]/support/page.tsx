import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { Beacon } from "@/components/Logo";
import { BUY_ME_A_COFFEE_URL } from "@/lib/support";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang).support;
  return {
    title: t.title,
    description: t.intro,
    alternates: {
      canonical: buildCanonicalUrl(lang, "/support"),
      languages: buildLanguageAlternates("/support"),
    },
  };
}

export default async function SupportPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.support;

  return (
    <article className="page">
      <Link href={`/${lang}/more`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {d.more.title}
      </Link>
      <header className="page-head">
        <Beacon size={64} />
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>
      </header>
      <ol className="points">
        {t.points.map(([title, text]) => (
          <li key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <div className="support-action">
        <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer" className="support-button">
          {t.button}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
