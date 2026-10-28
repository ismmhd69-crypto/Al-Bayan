import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getHadithCollections } from "@/lib/hadith/service";
import { HadithIndex } from "@/components/hadith/HadithIndex";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "./hadith.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  return {
    title: dict.hadith.title,
    description: dict.hadith.intro,
    alternates: {
      canonical: buildCanonicalUrl(lang, "/hadith"),
      languages: buildLanguageAlternates("/hadith"),
    },
  };
}

export const revalidate = 86400; // 1 day

export default async function HadithIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  let collections;
  try {
    collections = await getHadithCollections();
  } catch (err: unknown) {
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }

  return (
    <HadithIndex
      lang={lang as Locale}
      dict={dict.hadith}
      collections={collections}
    />
  );
}

