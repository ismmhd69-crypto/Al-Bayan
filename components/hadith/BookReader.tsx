"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithBookSummary, HadithCollectionSummary, PaginatedHadiths } from "@/lib/hadith/types";
import { HadithDisplayText } from "./HadithDisplayText";
import { hadithTextForAttribute } from "@/lib/hadith/display";

interface BookReaderProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  collection: HadithCollectionSummary;
  book: HadithBookSummary;
  initialData: PaginatedHadiths;
}

export function BookReader({
  lang,
  dict,
  collection,
  book,
  initialData,
}: BookReaderProps) {
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const collectionTitle = collection.id === "bukhari" ? dict.bukhari : dict.muslim;

  const handleCopyLink = async (displayNum: string) => {
    try {
      const url = `${window.location.origin}/${lang}/hadith/${collection.id}/${displayNum}`;
      await navigator.clipboard.writeText(url);
      setCopiedRef(displayNum);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch {
      // ignore
    }
  };

  const isRtl = lang === "ar";
  const mainBookTitle = isRtl ? book.nameArabic : book.nameEnglish;
  const subBookTitle = isRtl ? book.nameEnglish : book.nameArabic;

  const pageInfoText = dict.pageOf
    .replace("{page}", String(initialData.page))
    .replace("{totalPages}", String(initialData.totalPages || 1));

  return (
    <div className="hadith-page">
      {/* Top Breadcrumb */}
      <nav className="hadith-nav-top" aria-label="Breadcrumb">
        <Link href={`/${lang}/hadith`} className="hadith-back-link">
          <ArrowLeft className="flip-rtl" aria-hidden="true" />
          <span>{dict.backToHadith}</span>
        </Link>
        <span className="hadith-nav-sep" aria-hidden="true">/</span>
        <Link href={`/${lang}/hadith/${collection.id}`} className="hadith-back-link">
          <span>{collectionTitle}</span>
        </Link>
        <span className="hadith-nav-sep" aria-hidden="true">/</span>
        <span className="hadith-nav-current">
          {dict.book} {book.bookNumber}: <HadithDisplayText text={mainBookTitle} />
        </span>
      </nav>

      {/* Book Heading */}
      <header className="hadith-header" style={{ marginBlockEnd: "24px" }}>
        <div className="hadith-stat-badge" style={{ marginInline: "auto", marginBlockEnd: "8px" }}>
          {dict.book} {book.bookNumber}
        </div>
        <h1 className="hadith-title" lang={isRtl ? "ar" : undefined} dir={isRtl ? "rtl" : undefined}>
          <HadithDisplayText text={mainBookTitle} />
        </h1>
        {subBookTitle && (
          <div
            className="hadith-collection-title-ar"
            lang={isRtl ? "en" : "ar"}
            dir={isRtl ? "ltr" : "rtl"}
            style={{ marginBlockStart: "6px", fontSize: "1.15rem" }}
          >
            <HadithDisplayText text={subBookTitle} />
          </div>
        )}
        <p className="hadith-intro">
          {dict.showingHadiths
            .replace("{count}", String(initialData.hadiths.length))
            .replace("{total}", String(initialData.total))}
        </p>
      </header>

      {/* Hadith Items List */}
      <section className="hadith-items-list" aria-label="Hadiths">
        {initialData.hadiths.map((h) => {
          const isCopied = copiedRef === h.displayNumber;
          const openLabel = dict.openHadith.replace("{number}", h.displayNumber);

          return (
            <article
              key={h.id}
              id={`hadith-${h.displayNumber}`}
              className="hadith-card"
            >
              <div className="hadith-card-head">
                <div className="hadith-meta-badges">
                  <Link
                    href={`/${lang}/hadith/${collection.id}/${h.displayNumber}`}
                    className="hadith-ref-badge"
                    title={`Hadith ${h.displayNumber}`}
                  >
                    {`#${h.displayNumber}`}
                  </Link>

                  {/* Render verified grades only, never fabricate a grade badge */}
                  {h.grades.map((g, idx) => (
                    <span key={idx} className="hadith-grade-badge">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      {g.gradedBy ? `${g.grade} (${g.gradedBy})` : g.grade}
                    </span>
                  ))}

                  {(h.chapterTitleEnglish || h.chapterTitleArabic) && (
                    <span
                      className="hadith-chapter-title"
                      title={hadithTextForAttribute(h.chapterTitleEnglish || h.chapterTitleArabic || "")}
                    >
                      {lang === "ar"
                        ? <HadithDisplayText text={h.chapterTitleArabic || h.chapterTitleEnglish || ""} />
                        : <HadithDisplayText text={h.chapterTitleEnglish || h.chapterTitleArabic || ""} />}
                    </span>
                  )}
                </div>

                <div className="hadith-card-actions">
                  <button
                    type="button"
                    className="hadith-action-btn"
                    onClick={() => handleCopyLink(h.displayNumber)}
                    title={dict.copyLink}
                    aria-label={`${dict.copyLink} ${h.displayNumber}`}
                  >
                    {isCopied ? (
                      <Check className="text-accent" aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>

                  <Link
                    href={`/${lang}/hadith/${collection.id}/${h.displayNumber}`}
                    className="hadith-action-btn"
                    title={openLabel}
                    aria-label={openLabel}
                  >
                    <ExternalLink aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Arabic text */}
              <div className="hadith-text-ar" lang="ar" dir="rtl" translate="no">
                <HadithDisplayText text={h.arabicText} />
              </div>

              {/* Translation block for non-Arabic interfaces */}
              {lang !== "ar" && (
                <div className="hadith-text-en" lang="en" dir="ltr">
                  {lang === "en" && h.englishText ? (
                    <p style={{ margin: 0, whiteSpace: "pre-line" }}><HadithDisplayText text={h.englishText} /></p>
                  ) : (
                    <span className="hadith-text-unavailable">
                      {dict.translationUnavailable}
                    </span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Pagination Bar */}
      <nav className="hadith-pagination" aria-label="Pagination">
        {initialData.hasPrev ? (
          <Link
            href={`/${lang}/hadith/${collection.id}/book/${book.bookNumber}?page=${initialData.page - 1}`}
            className="hadith-page-btn"
            aria-label={dict.previousPage}
          >
            <ChevronLeft className="flip-rtl" aria-hidden="true" />
            <span>{dict.previousPage}</span>
          </Link>
        ) : (
          <div />
        )}

        <span className="hadith-page-info">{pageInfoText}</span>

        {initialData.hasNext ? (
          <Link
            href={`/${lang}/hadith/${collection.id}/book/${book.bookNumber}?page=${initialData.page + 1}`}
            className="hadith-page-btn"
            aria-label={dict.nextPage}
          >
            <span>{dict.nextPage}</span>
            <ChevronRight className="flip-rtl" aria-hidden="true" />
          </Link>
        ) : (
          <div />
        )}
      </nav>

      {/* Attribution Footer */}
      <footer className="hadith-attribution">
        <p>
          {dict.attributionText}{" "}
          <a
            href={initialData.hadiths[0]?.url || `https://sunnah.com/${collection.id}`}
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
