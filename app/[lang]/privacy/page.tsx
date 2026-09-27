import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).privacy.title } : {};
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.privacy;

  return (
    <article className="page">
      <Link href={`/${lang}/more`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {d.more.title}
      </Link>
      <header className="page-head">
        <h1>{t.title}</h1>
      </header>
      <p className="card card-soft">{t.draft}</p>
      <ul className="checks">
        {t.points.map((p) => (
          <li key={p}>
            <Check aria-hidden="true" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
