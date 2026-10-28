import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getChapters } from "@/lib/quran/service";
import { SurahIndex } from "@/components/quran/SurahIndex";
import "./quran.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  return {
    title: dict.quran.title,
    description: dict.quran.intro,
    alternates: {
      canonical: buildCanonicalUrl(lang, "/quran"),
      languages: buildLanguageAlternates("/quran"),
    },
  };
}

export const revalidate = 86400; // Cache for 1 day

export default async function QuranIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const chapters = await getChapters(lang === "ar" ? "ar" : "en");

  return (
    <div className="page quran-page">
      <header className="page-head">
        <h1>{dict.quran.title}</h1>
        <p className="lead">{dict.quran.intro}</p>
      </header>

      <SurahIndex lang={lang as Locale} dict={dict.quran} chapters={chapters} />
    </div>
  );
}

