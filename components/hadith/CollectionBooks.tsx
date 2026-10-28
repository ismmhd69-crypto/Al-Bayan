"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Search, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithBookSummary, HadithCollectionSummary } from "@/lib/hadith/types";

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
    const cleaned = referenceQuery.trim().replace(/\s+/g, "");
    if (!cleaned) return;
    router.push(`/${lang}/hadith/${collection.id}/${encodeURIComponent(cleaned)}`);
  };

  const filteredBooks = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      return (
        b.bookNumber.includes(q) ||
        b.nameEnglish.toLowerCase().includes(q) ||
        b.nameArabic.includes(q)
      );
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
            type="text"
            className="hadith-search-input"
            value={referenceQuery}
            onChange={(e) => setReferenceQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            aria-label={dict.searchPlaceholder}
          />
          <button type="submit" className="hadith-search-btn">
            {dict.searchBtn}
          </button>
        </form>
      </div>

      {/* Filter Books */}
      <div style={{ marginBlockEnd: "20px" }}>
        <input
          type="text"
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
        />
      </div>

      {/* Books Grid */}
      <ul className="hadith-books-grid" role="list">
        {filteredBooks.map((b) => {
          return (
            <li key={b.bookNumber}>
              <Link
                href={`/${lang}/hadith/${collection.id}/book/${b.bookNumber}`}
                className="hadith-book-card"
              >
                <span className="hadith-book-num">{b.bookNumber}</span>
                <div className="hadith-book-info">
                  <span className="hadith-book-name-ar" lang="ar" dir="rtl">
                    {b.nameArabic}
                  </span>
                  <span className="hadith-book-name-en">
                    {b.nameEnglish}
                  </span>
                </div>
                <span className="hadith-book-count">
                  {typeof b.numberOfHadith === "number" && b.numberOfHadith > 0 ? `${b.numberOfHadith} h.` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <footer className="hadith-attribution">
        <p>
          {dict.attributionText}{" "}
          <a
            href={`https://sunnah.com/${collection.id}`}
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

