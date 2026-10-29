import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronRight, CircleHelp, Compass, Flag, HeartHandshake, Info, Lock, type LucideIcon } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import LangSwitch from "@/components/LangSwitch";
import AccountRow from "@/components/AccountRow";
import TeamReviewSection from "@/components/TeamReviewSection";
import SavedMoreRow from "@/components/saved/SavedMoreRow";
import { authText } from "@/lib/auth-text";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? {
    title: getDictionary(lang).more.title,
    alternates: { canonical: buildCanonicalUrl(lang, "/more"), languages: buildLanguageAlternates("/more") },
  } : {};
}

type Row = { Icon: LucideIcon; title: string; note?: string; href?: string; custom?: React.ReactNode };

export default async function MorePage({ params }: { params: Promise<{ lang: string }> }): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.more;

  const rows: Row[][] = [
    // Not in the phone tab bar, so they lead the More page.
    [
      { Icon: Bookmark, title: "saved", custom: <SavedMoreRow lang={lang} /> },
      { Icon: CircleHelp, title: d.nav.topics, href: `/${lang}/topics` },
      { Icon: Compass, title: d.nav.start, href: `/${lang}/start` },
    ],
    [
      {
        Icon: Bookmark,
        title: t.account,
        custom: <AccountRow href={`/${lang}/account`} signInTitle={t.account} signInNote={t.accountNote} accountTitle={authText[lang].title} />,
      },
    ],
    [
      { Icon: Info, title: t.about, href: `/${lang}/about` },
      { Icon: HeartHandshake, title: t.support, note: t.supportNote, href: `/${lang}/support` },
      { Icon: Lock, title: t.privacy, href: `/${lang}/privacy` },
      { Icon: Flag, title: t.report, note: t.reportNote, href: `/${lang}/report` },
    ],
  ];

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.title}</h1>
      </header>

      {rows.slice(0, 1).map((group, i) => <RowList key={`top-${i}`} group={group} />)}

      <section className="topic-group" aria-labelledby="lang-h">
        <h2 id="lang-h" className="eyebrow">
          {t.language}
        </h2>
        <LangSwitch lang={lang} label={t.language} />
      </section>

      <TeamReviewSection lang={lang} />

      {rows.slice(1).map((group, i) => <RowList key={i} group={group} />)}
    </div>
  );
}

function RowList({ group }: { group: Row[] }): React.ReactElement {
  return (
    <ul className="list">
      {group.map(({ Icon, title, note, href, custom }) => {
        if (custom) return <li key={title}>{custom}</li>;
        const inner = (
          <>
            <Icon aria-hidden="true" className="row-icon" />
            <span>
              <span className="list-title">{title}</span>
              {note && <span className="list-sub">{note}</span>}
            </span>
            {href && <ChevronRight aria-hidden="true" className="flip-rtl" />}
          </>
        );
        return (
          <li key={title}>
            {href ? (
              <Link href={href} className="list-row">
                {inner}
              </Link>
            ) : (
              <div className="list-row list-row--muted">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
