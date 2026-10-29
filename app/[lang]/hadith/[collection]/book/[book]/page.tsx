import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import { getBook, getBookHadiths, getCollection } from "@/lib/hadith/service";
import type { HadithCollectionId } from "@/lib/hadith/types";
import { BookReader } from "@/components/hadith/BookReader";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import "@/app/[lang]/hadith/hadith.css";

function isNextInternalError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "digest" in err) {
    const digest = String((err as { digest?: unknown }).digest);
    return digest.startsWith("NEXT_");
  }
  return false;
}

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
  const colTitle = collection === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;

  let col;
  try {
    col = await getCollection(collection);
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }

  if (!col) {
    notFound();
  }

  let bookData;
  try {
    bookData = await getBook(col.id as HadithCollectionId, book);
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
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

  if (!bookData) {
    return (
      <div className="hadith-page">
        <nav className="hadith-nav-top" aria-label="Breadcrumb">
          <Link href={`/${lang}/hadith/${collection}`} className="hadith-back-link">
            <ArrowLeft className="flip-rtl" aria-hidden="true" />
            <span>{colTitle}</span>
          </Link>
        </nav>
        <div className="hadith-empty-state" role="status">
          <CircleAlert aria-hidden="true" className="w-12 h-12 text-accent" />
          <h1>{dict.hadith.notFound}</h1>
          <p>{dict.hadith.notFoundDesc}</p>
          <div style={{ display: "flex", gap: "12px", marginBlockStart: "8px" }}>
            <Link href={`/${lang}/hadith/${collection}`} className="hadith-btn hadith-btn--primary">
              <span>{colTitle}</span>
            </Link>
            <Link href={`/${lang}/hadith`} className="hadith-btn hadith-btn--secondary">
              <span>{dict.hadith.backToHadith}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
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
    if (isNextInternalError(err)) throw err;
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
