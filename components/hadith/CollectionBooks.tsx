"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Search, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithBookSummary, HadithCollectionSummary } from "@/lib/hadith/types";
import { normalizeHadithReference } from "@/lib/hadith/search";
import {
  normalizeArabicText,
  normalizeDigits,
  normalizeLatinText,
} from "@/lib/search/normalization";

interface CollectionBooksProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  collection: HadithCollectionSummary;
  books: HadithBookSummary[];
}

export function CollectionBooks({ lang, dict, collection, books }: CollectionBooksProps) {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState("");
  const [referenceQuery, setReferenceQuery] = useState("");

  const title = collection.id === "bukhari" ? dict.bukhari : dict.muslim;
  const desc = collection.id === "bukhari" ? dict.bukhariDesc : dict.muslimDesc;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeHadithReference(referenceQuery);
    if (!cleaned) return;
    router.push(`/${lang}/hadith/${collection.id}/${encodeURIComponent(cleaned)}`);
  };

  const filteredBooks = useMemo(() => {
    const q = filterQuery.trim();
    if (!q) return books;

    const qDigits = normalizeDigits(q);
    const qLatin = normalizeLatinText(q);
    const qArabic = normalizeArabicText(q);

    return books.filter((b) => {
      const bNumDigits = normalizeDigits(b.bookNumber);
      if (bNumDigits === qDigits || bNumDigits.startsWith(qDigits)) return true;

      const bLatin = normalizeLatinText(b.nameEnglish);
      if (bLatin.includes(qLatin)) return true;

      const bArabic = normalizeArabicText(b.nameArabic);
      if (bArabic.includes(qArabic)) return true;

      return false;
    });
  }, [books, filterQuery]);

  return (
    <div className="hadith-page">
      {/* Breadcrumb Navigation */}
      <nav className="hadith-nav-top" aria-label="Breadcrumb">
        <Link href={`/${lang}/hadith`} className="hadith-back-link">
          <ArrowLeft className="flip-rtl" aria-hidden="true" />
          <span>{dict.backToHadith}</span>
        </Link>
        <span className="hadith-nav-sep" aria-hidden="true">/</span>
        <span className="hadith-nav-current">{title}</span>
      </nav>

      {/* Header */}
      <header className="hadith-header">
        <h1 className="hadith-title">{title}</h1>
        <div className="hadith-collection-title-ar" lang="ar" dir="rtl" style={{ marginBlock: "8px" }}>
          {collection.nameArabic}
        </div>
        <p className="hadith-intro">{desc}</p>
      </header>

      {/* Direct Hadith Lookup */}
      <div className="hadith-search-wrapper">
        <form onSubmit={handleLookup} className="hadith-search-form" role="search">
          <Search className="hadith-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="hadith-search-input"
            value={referenceQuery}
            onChange={(e) => setReferenceQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            aria-label={dict.searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="hadith-search-btn">
            {dict.searchBtn}
          </button>
        </form>
      </div>

      {/* Filter Books */}
      <div style={{ marginBlockEnd: "20px" }}>
        <input
          type="search"
          className="hadith-search-input"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            blockSize: "40px",
            paddingInline: "14px",
          }}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={dict.filterBooksPlaceholder}
          aria-label={dict.filterBooksPlaceholder}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="hadith-empty-state" role="status">
          <p>{dict.noMatches}</p>
          <button
            type="button"
            className="hadith-btn hadith-btn--secondary"
            onClick={() => setFilterQuery("")}
          >
            {dict.clearSearch}
          </button>
        </div>
      ) : (
        <ul className="hadith-books-grid" role="list">
          {filteredBooks.map((b) => {
            const hadithCountText =
              typeof b.numberOfHadith === "number" && b.numberOfHadith > 0
                ? dict.hadithsCount.replace("{count}", String(b.numberOfHadith))
                : null;
            const bookLabel = `${dict.book} ${b.bookNumber}`;

            return (
              <li key={b.bookNumber}>
                <Link
                  href={`/${lang}/hadith/${collection.id}/book/${encodeURIComponent(b.bookNumber)}`}
                  className="hadith-book-card"
                  aria-label={`${bookLabel}: ${b.nameEnglish} - ${b.nameArabic}`}
                >
                  <div className="hadith-book-leading">
                    <span className="hadith-book-num">{b.bookNumber}</span>
                  </div>
                  <div className="hadith-book-body">
                    <div className="hadith-book-header">
                      <span className="hadith-book-title">{b.nameEnglish}</span>
                      <span className="hadith-book-arabic" lang="ar" dir="rtl">
                        {b.nameArabic}
                      </span>
                    </div>
                    {hadithCountText && (
                      <div className="hadith-book-meta">
                        <span>{hadithCountText}</span>
                      </div>
                    )}
                  </div>
                  <div className="hadith-book-arrow" aria-hidden="true">
                    <ChevronRight className="flip-rtl" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Attribution Footer */}
      <footer className="hadith-attribution">
        <p>
          {dict.attributionText}{" "}
          <a
            href="https://sunnah.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {dict.viewOnSunnah}
          </a>
        </p>
      </footer>
    </div>
  );
}
