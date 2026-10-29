import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Cpu, ExternalLink, Flag, HandHeart, Server, Share2, Sparkles } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { Beacon } from "@/components/Logo";
import { BUY_ME_A_COFFEE_URL } from "@/lib/support";
import { SUPPORT_HADITH, supportText } from "@/lib/support-text";

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

const GOES_ICONS = [Cpu, Server, BookOpen];
const HELP_ICONS = [Share2, Flag, HandHeart];

export default async function SupportPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.support;
  const s = supportText[lang];
  const cta = (
    <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary support-cta">
      {s.cta}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  );

  return (
    <article className="page support-page">
      <Link href={`/${lang}/more`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {d.more.title}
      </Link>

      <section className="support-hero">
        <div className="support-hero-text">
          <Beacon size={64} />
          <h1>{t.title}</h1>
          <p className="lead">{s.lead}</p>
          <div className="support-hero-action">
            {cta}
            <p className="support-small">{s.ctaNote}</p>
          </div>
        </div>
      </section>

      <section className="support-jariya" aria-labelledby="support-jariya-title">
        <h2 id="support-jariya-title"><Sparkles aria-hidden="true" />{s.jariyaTitle}</h2>
        <figure>
          <figcaption>{s.hadithIntro}</figcaption>
          <blockquote lang="ar" dir="rtl" className="support-hadith-ar">«{SUPPORT_HADITH.arabic}»</blockquote>
          {s.hadithTranslation && <>
            <blockquote className="support-hadith-tr">{s.hadithTranslation}</blockquote>
            <p className="support-small">{s.aiTranslation}</p>
          </>}
          <a href={SUPPORT_HADITH.url} target="_blank" rel="noopener noreferrer" className="text-link support-source">{s.hadithSource}<ExternalLink size={14} aria-hidden="true" /></a>
        </figure>
        <p className="support-jariya-text">{s.jariyaText}</p>
      </section>

      <section aria-labelledby="support-goes-title">
        <h2 id="support-goes-title" className="support-section-title">{s.goesTitle}</h2>
        <div className="support-grid support-grid--three">
          {s.goes.map(([title, text], i) => {
            const Icon = GOES_ICONS[i];
            return <div key={title} className="support-card"><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>;
          })}
        </div>
      </section>

      <section aria-labelledby="support-promise-title">
        <h2 id="support-promise-title" className="support-section-title">{s.promiseTitle}</h2>
        <div className="support-grid support-grid--two">
          {s.promises.map(([title, text]) => <div key={title} className="support-card support-card--promise"><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section aria-labelledby="support-help-title">
        <h2 id="support-help-title" className="support-section-title">{s.helpTitle}</h2>
        <ul className="support-help">
          {s.help.map((item, i) => {
            const Icon = HELP_ICONS[i];
            return <li key={item.title}><Icon aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}{item.link === "report" && <> <Link href={`/${lang}/report`} className="text-link">{s.reportLink}</Link></>}</p></div></li>;
          })}
        </ul>
      </section>

      <section className="support-closing">
        <h2>{s.closingTitle}</h2>
        <p>{s.closingText}</p>
        {cta}
      </section>
    </article>
  );
}
