import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import {
  getAdjacentHadiths,
  getCollection,
  getHadithByReference,
} from "@/lib/hadith/service";
import type { HadithCollectionId } from "@/lib/hadith/types";
import { HadithReader } from "@/components/hadith/HadithReader";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "@/app/[lang]/hadith/hadith.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string; reference: string }>;
}): Promise<Metadata> {
  const { lang, collection, reference } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  try {
    const col = await getCollection(collection);
    if (!col) return {};

    const hadith = await getHadithByReference(col.id as HadithCollectionId, reference);
    if (!hadith) return {};

    const colTitle = col.id === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;
    const numTitle = dict.hadith.hadithNumber.replace("{number}", hadith.displayNumber);

    return {
      title: `${colTitle} ${numTitle} | ${dict.hadith.title}`,
      description: hadith.englishText?.slice(0, 160) || hadith.arabicText.slice(0, 160),
      alternates: {
        canonical: buildCanonicalUrl(lang, `/hadith/${collection}/${hadith.displayNumber}`),
        languages: buildLanguageAlternates(`/hadith/${collection}/${hadith.displayNumber}`),
      },
    };
  } catch {
    return {
      title: dict.hadith.title,
    };
  }
}

export default async function HadithPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string; reference: string }>;
}) {
  const { lang, collection, reference } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);

  try {
    const col = await getCollection(collection);
    if (!col) notFound();

    const hadith = await getHadithByReference(col.id as HadithCollectionId, reference);
    if (!hadith) notFound();

    const adjacent = await getAdjacentHadiths(col.id as HadithCollectionId, hadith);

    return (
      <HadithReader
        lang={lang as Locale}
        dict={dict.hadith}
        collection={col}
        hadith={hadith}
        prevRef={adjacent.prev}
        nextRef={adjacent.next}
      />
    );
  } catch (err: unknown) {
    const colTitle = collection === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        backHref={`/${lang}/hadith/${collection}`}
        backLabel={colTitle}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }
}

