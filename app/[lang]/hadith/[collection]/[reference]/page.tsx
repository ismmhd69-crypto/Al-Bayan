import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import { getDictionary, isLocale, type Locale, type Dictionary } from "@/lib/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import {
  getAdjacentHadiths,
  getCollection,
  getHadithByReference,
} from "@/lib/hadith/service";
import type { HadithCollectionId, HadithCollectionSummary, HadithDetail } from "@/lib/hadith/types";
import { HadithReader } from "@/components/hadith/HadithReader";
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

async function HadithAdjacentNav({
  lang,
  dict,
  collection,
  hadith,
}: {
  lang: Locale;
  dict: Dictionary["hadith"];
  collection: HadithCollectionSummary;
  hadith: HadithDetail;
}) {
  let adjacent = { prev: null as string | null, next: null as string | null };
  try {
    adjacent = await getAdjacentHadiths(collection.id as HadithCollectionId, hadith);
  } catch {
    // Neighbor resolution failure does not block displaying the verified record
  }

  return (
    <nav className="hadith-pagination" aria-label="Hadith navigation">
      {adjacent.prev ? (
        <Link
          href={`/${lang}/hadith/${collection.id}/${adjacent.prev}`}
          className="hadith-page-btn"
          aria-label={`${dict.previousHadith} (${adjacent.prev})`}
        >
          <ChevronLeft className="flip-rtl" aria-hidden="true" />
          <span>{`${dict.previousHadith} (#${adjacent.prev})`}</span>
        </Link>
      ) : (
        <div />
      )}

      <Link
        href={`/${lang}/hadith/${collection.id}/book/${hadith.bookNumber}`}
        className="hadith-page-btn"
      >
        <span>{dict.backToBook.replace("{book}", hadith.bookNumber)}</span>
      </Link>

      {adjacent.next ? (
        <Link
          href={`/${lang}/hadith/${collection.id}/${adjacent.next}`}
          className="hadith-page-btn"
          aria-label={`${dict.nextHadith} (${adjacent.next})`}
        >
          <span>{`${dict.nextHadith} (#${adjacent.next})`}</span>
          <ChevronRight className="flip-rtl" aria-hidden="true" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

function HadithPaginationSkeleton({
  lang,
  dict,
  collectionId,
  bookNumber,
}: {
  lang: Locale;
  dict: Dictionary["hadith"];
  collectionId: string;
  bookNumber: string;
}) {
  return (
    <nav className="hadith-pagination" aria-label="Hadith navigation">
      <div />
      <Link
        href={`/${lang}/hadith/${collectionId}/book/${bookNumber}`}
        className="hadith-page-btn"
      >
        <span>{dict.backToBook.replace("{book}", bookNumber)}</span>
      </Link>
      <div />
    </nav>
  );
}

export default async function HadithPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string; reference: string }>;
}) {
  const { lang, collection, reference } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const colTitle = collection === "bukhari" ? dict.hadith.bukhari : dict.hadith.muslim;

  // 1. Verify valid collection
  let col = null;
  try {
    col = await getCollection(collection);
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
    return (
      <HadithErrorState
        lang={lang as Locale}
        dict={dict.hadith}
        backHref={`/${lang}/hadith`}
        backLabel={dict.hadith.backToHadith}
        errorMessage={err instanceof Error ? err.message : undefined}
      />
    );
  }

  // If collection does not exist in our system, standard 404
  if (!col) {
    notFound();
  }

  // 2. Fetch hadith record
  let hadith = null;
  try {
    hadith = await getHadithByReference(col.id as HadithCollectionId, reference);
  } catch (err: unknown) {
    if (isNextInternalError(err)) throw err;
    // Genuine provider failure (500, 403, 429, timeout)
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

  // 3. Genuine missing record (API returned 404): show localized not-found state
  if (!hadith) {
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
            <Link
              href={`/${lang}/hadith/${collection}`}
              className="hadith-btn hadith-btn--primary"
            >
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

  // 4. Render reader with streaming adjacent pagination
  return (
    <HadithReader
      lang={lang as Locale}
      dict={dict.hadith}
      collection={col}
      hadith={hadith}
      paginationSlot={
        <Suspense
          fallback={
            <HadithPaginationSkeleton
              lang={lang as Locale}
              dict={dict.hadith}
              collectionId={col.id}
              bookNumber={hadith.bookNumber}
            />
          }
        >
          <HadithAdjacentNav
            lang={lang as Locale}
            dict={dict.hadith}
            collection={col}
            hadith={hadith}
          />
        </Suspense>
      }
    />
  );
}
