import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronRight, Flag, Info, Lock, UserRound, type LucideIcon } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import LangSwitch from "@/components/LangSwitch";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).more.title } : {};
}

type Row = { Icon: LucideIcon; title: string; note?: string; href?: string };

export default async function MorePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.more;

  const rows: Row[][] = [
    [
      { Icon: UserRound, title: t.account, note: `${t.accountNote} ${d.common.comingSoon}.` },
      { Icon: Bookmark, title: t.saved, note: d.common.comingSoon },
    ],
    [
      { Icon: Info, title: t.about, href: `/${lang}/about` },
      { Icon: Lock, title: t.privacy, href: `/${lang}/privacy` },
      { Icon: Flag, title: t.report, note: `${t.reportNote} ${d.common.comingSoon}.` },
    ],
  ];

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t.title}</h1>
      </header>

      <section className="topic-group" aria-labelledby="lang-h">
        <h2 id="lang-h" className="eyebrow">
          {t.language}
        </h2>
        <LangSwitch lang={lang} label={t.language} />
      </section>

      {rows.map((group, i) => (
        <ul key={i} className="list">
          {group.map(({ Icon, title, note, href }) => {
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
      ))}
    </div>
  );
}
