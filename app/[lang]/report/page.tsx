import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import ReportProblemForm from "@/components/ReportProblemForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).reportPage.title, robots: { index: false, follow: false } } : {};
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ url?: string; q?: string; cat?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const query = await searchParams;
  const d = getDictionary(lang);
  const t = d.reportPage;
  const initialPage = query.url || query.q || "";

  return (
    <article className="page">
      <Link href={`/${lang}/more`} className="back-link">
        <ArrowLeft aria-hidden="true" className="flip-rtl" />
        {d.more.title}
      </Link>
      <header className="page-head">
        <h1>{t.title}</h1>
        <p className="lead">{t.subtitle}</p>
      </header>
      <ReportProblemForm
        lang={lang}
        t={t}
        initialPageUrl={initialPage}
        initialCategory={query.cat}
      />
    </article>
  );
}
