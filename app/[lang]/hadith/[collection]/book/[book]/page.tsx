import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getBook, getBookHadiths, getCollection } from "@/lib/hadith/service";
import type { HadithCollectionId } from "@/lib/hadith/types";
import { BookReader } from "@/components/hadith/BookReader";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "@/app/[lang]/hadith/hadith.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string; book: string }>;
}): Promise<Metadata> {
  const { lang, collection, book } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  try {
    const col = await getCollection(collection);
    if (!col) return {};

    const bookData = await getBook(col.id as HadithCollectionId, book);
    if (!bookData) return {};

    const colTitle = col.id === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;
    const bookTitle = lang === "ar" ? bookData.nameArabic : bookData.nameEnglish;

    return {
      title: `${dict.hadith.book} ${bookData.bookNumber}: ${bookTitle} | ${colTitle}`,
      description: `${colTitle} - ${dict.hadith.book} ${bookData.bookNumber}`,
      alternates: {
        canonical: buildCanonicalUrl(lang, `/hadith/${collection}/book/${book}`),
        languages: buildLanguageAlternates(`/hadith/${collection}/book/${book}`),
      },
    };
  } catch {
    return {
      title: dict.hadith.title,
    };
  }
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; collection: string; book: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang, collection, book } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);

  try {
    const col = await getCollection(collection);
    if (!col) notFound();

    const bookData = await getBook(col.id as HadithCollectionId, book);
    if (!bookData) notFound();

    const query = await searchParams;
    const pageNum = Math.max(1, Number(query.page) || 1);

    const initialData = await getBookHadiths(col.id as HadithCollectionId, bookData.bookNumber, {
      page: pageNum,
      limit: 20,
    });

    return (
      <BookReader
        lang={lang as Locale}
        dict={dict.hadith}
        collection={col}
        book={bookData}
        initialData={initialData}
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

