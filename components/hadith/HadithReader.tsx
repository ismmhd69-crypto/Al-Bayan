"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithCollectionSummary, HadithDetail } from "@/lib/hadith/types";
import { HadithDisplayText } from "./HadithDisplayText";

interface HadithReaderProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  collection: HadithCollectionSummary;
  hadith: HadithDetail;
  prevRef?: string | null;
  nextRef?: string | null;
  paginationSlot?: React.ReactNode;
}

export function HadithReader({
  lang,
  dict,
  collection,
  hadith,
  prevRef,
  nextRef,
  paginationSlot,
}: HadithReaderProps) {
  const [copied, setCopied] = useState(false);

  const collectionTitle = collection.id === "bukhari" ? dict.bukhari : dict.muslim;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="hadith-page hadith-single-reader">
      {/* Top Breadcrumb Navigation */}
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
        <Link
          href={`/${lang}/hadith/${collection.id}/book/${hadith.bookNumber}`}
          className="hadith-back-link"
        >
          <span>
            {dict.book} {hadith.bookNumber}
          </span>
        </Link>
        <span className="hadith-nav-sep" aria-hidden="true">/</span>
        <span className="hadith-nav-current">
          #{hadith.displayNumber}
        </span>
      </nav>

      {/* Main Hadith Card */}
      <article className="hadith-single-card" id={`hadith-${hadith.displayNumber}`}>
        <header className="hadith-card-head" style={{ marginBlockEnd: "20px" }}>
          <div className="hadith-meta-badges">
            <span className="hadith-ref-badge" style={{ fontSize: "var(--fs-sm)", padding: "6px 12px" }}>
              {`${collectionTitle} #${hadith.displayNumber}`}
            </span>

            {hadith.grades.map((g, idx) => (
              <span key={idx} className="hadith-grade-badge">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {`${g.grade}${g.gradedBy ? ` (${g.gradedBy})` : ""}`}
              </span>
            ))}
          </div>

          <div className="hadith-card-actions">
            <button
              type="button"
              className="hadith-action-btn"
              onClick={handleCopyLink}
              title={dict.copyLink}
              aria-label={dict.copyLink}
            >
              {copied ? (
                <Check className="text-accent" aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </button>

            <a
              href={hadith.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hadith-action-btn"
              title={dict.viewOnSunnah}
              aria-label={dict.viewOnSunnah}
            >
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </header>

        {/* Chapter / Context Details */}
        {(hadith.chapterTitleArabic || hadith.chapterTitleEnglish || hadith.bookNameEnglish || hadith.bookNameArabic) && (
          <div
            style={{
              marginBlockEnd: "16px",
              padding: "10px 14px",
              background: "var(--surface-2)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--line)",
              fontSize: "var(--fs-sm)",
              color: "var(--ink-2)",
            }}
          >
            {(hadith.bookNameEnglish || hadith.bookNameArabic) && (
              <div style={{ fontWeight: 600, color: "var(--ink)", marginBlockEnd: "4px" }}>
                {dict.book} {hadith.bookNumber}: <HadithDisplayText text={lang === "ar" ? hadith.bookNameArabic || hadith.bookNameEnglish || "" : hadith.bookNameEnglish || hadith.bookNameArabic || ""} />
              </div>
            )}
            {(hadith.chapterTitleArabic || hadith.chapterTitleEnglish) && (
              <div style={{ fontStyle: "italic", fontSize: "var(--fs-xs)" }}>
                {dict.chapter}: <HadithDisplayText text={lang === "ar" ? hadith.chapterTitleArabic || hadith.chapterTitleEnglish || "" : hadith.chapterTitleEnglish || hadith.chapterTitleArabic || ""} />
              </div>
            )}
          </div>
        )}

        {/* Arabic Original Text */}
        <div
          className="hadith-text-ar"
          lang="ar"
          dir="rtl"
          translate="no"
          style={{ fontSize: "1.35rem", padding: "16px 20px" }}
        >
          <HadithDisplayText text={hadith.arabicText} />
        </div>

        {/* Translation block for non-Arabic interfaces */}
        {lang !== "ar" && (
          <div className="hadith-text-en" lang="en" dir="ltr" style={{ marginBlockStart: "20px" }}>
            {lang === "en" && hadith.englishText ? (
              <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: "1.0625rem", lineHeight: "1.75" }}>
                <HadithDisplayText text={hadith.englishText} />
              </p>
            ) : (
              <span className="hadith-text-unavailable">
                {dict.translationUnavailable}
              </span>
            )}
          </div>
        )}
      </article>

      {/* Prev / Next Hadith Navigation */}
      {paginationSlot ? (
        paginationSlot
      ) : (
        <nav className="hadith-pagination" aria-label="Hadith navigation">
          {prevRef ? (
            <Link
              href={`/${lang}/hadith/${collection.id}/${prevRef}`}
              className="hadith-page-btn"
              aria-label={`${dict.previousHadith} (${prevRef})`}
            >
              <ChevronLeft className="flip-rtl" aria-hidden="true" />
              <span>{`${dict.previousHadith} (#${prevRef})`}</span>
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

          {nextRef ? (
            <Link
              href={`/${lang}/hadith/${collection.id}/${nextRef}`}
              className="hadith-page-btn"
              aria-label={`${dict.nextHadith} (${nextRef})`}
            >
              <span>{`${dict.nextHadith} (#${nextRef})`}</span>
              <ChevronRight className="flip-rtl" aria-hidden="true" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}

      {/* Attribution Footer */}
      <footer className="hadith-attribution">
        <p>
          {dict.attributionText}{" "}
          <a
            href={hadith.url}
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
