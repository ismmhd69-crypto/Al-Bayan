import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { authText } from "@/lib/auth-text";
import AuthPanel from "@/components/AuthPanel";

// Optional account page. Nothing here is needed to use Bayan, and search engines skip it.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: authText[lang].title, robots: { index: false, follow: false } } : {};
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = authText[lang];
  const more = getDictionary(lang).more;

  return (
    <article className="page">
      <Link href={`/${lang}/more`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {more.title}
      </Link>
      <header className="page-head">
        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>
      </header>
      <AuthPanel lang={lang} t={t} />
    </article>
  );
}
