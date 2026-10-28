"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Search, ShieldCheck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithCollectionSummary } from "@/lib/hadith/types";

interface HadithIndexProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  collections: HadithCollectionSummary[];
}

export function HadithIndex({ lang, dict, collections }: HadithIndexProps) {
  const router = useRouter();
  const [targetCollection, setTargetCollection] = useState<"bukhari" | "muslim">("bukhari");
  const [referenceQuery, setReferenceQuery] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = referenceQuery.trim().replace(/\s+/g, "");
    if (!cleaned) return;
    router.push(`/${lang}/hadith/${targetCollection}/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="hadith-page">
      <header className="hadith-header">
        <h1 className="hadith-title">{dict.title}</h1>
        <p className="hadith-intro">{dict.intro}</p>
      </header>

      {/* Quick Lookup Form */}
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

      {/* Collections Grid */}
      <section aria-label={dict.allCollections} className="hadith-collections-grid">
        {collections.map((c) => {
          const title = c.id === "bukhari" ? dict.bukhari : dict.muslim;
          const desc = c.id === "bukhari" ? dict.bukhariDesc : dict.muslimDesc;
          const booksText =
            typeof c.totalBooks === "number" && c.totalBooks > 0
              ? dict.booksCount.replace("{count}", String(c.totalBooks))
              : null;
          const hadithCountVal = c.totalAvailableHadith ?? c.totalHadith;
          const hadithsText =
            typeof hadithCountVal === "number" && hadithCountVal > 0
              ? dict.hadithsCount.replace("{count}", String(hadithCountVal))
              : null;

          return (
            <Link
              key={c.id}
              href={`/${lang}/hadith/${c.id}`}
              className="hadith-collection-card"
            >
              <div className="hadith-collection-header">
                <div>
                  <h2 className="hadith-collection-title-en">{title}</h2>
                  <div className="hadith-collection-title-ar" lang="ar" dir="rtl">
                    {c.nameArabic}
                  </div>
                </div>
                <div className="hadith-collection-arrow" aria-hidden="true">
                  <ArrowRight className="flip-rtl" />
                </div>
              </div>

              <p className="hadith-collection-desc">{desc}</p>

              {(booksText || hadithsText) && (
                <div className="hadith-collection-stats">
                  {booksText && (
                    <span className="hadith-stat-badge">
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      {booksText}
                    </span>
                  )}
                  {hadithsText && (
                    <span className="hadith-stat-badge">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                      {hadithsText}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </section>

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

