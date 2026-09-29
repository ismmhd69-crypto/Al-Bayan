import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { Beacon } from "@/components/Logo";
import { BUY_ME_A_COFFEE_URL } from "@/lib/support";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).support.title } : {};
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
      {BUY_ME_A_COFFEE_URL ? (
        <a className="btn btn-primary" href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
          {t.button}
          <ExternalLink aria-hidden="true" />
          <span className="sr-only">({t.newTab})</span>
        </a>
      ) : (
        <p className="card card-soft">{t.notReady}</p>
      )}
    </article>
  );
}
