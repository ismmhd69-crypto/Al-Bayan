"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SurahSummary } from "@/lib/quran/types";

interface SurahIndexProps {
  lang: Locale;
  dict: Dictionary["quran"];
  chapters: SurahSummary[];
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

export function SurahIndex({ lang, dict, chapters }: SurahIndexProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;

    const num = parseInt(q, 10);
    const hasNum = !isNaN(num);
    const normQ = normalizeArabic(q);

    return chapters.filter((c) => {
      if (hasNum && (c.id === num || String(c.id).startsWith(q))) {
        return true;
      }
      if (c.nameSimple.toLowerCase().includes(q)) return true;
      if (c.nameComplex.toLowerCase().includes(q)) return true;
      if (c.translatedName.toLowerCase().includes(q)) return true;

      const normArabic = normalizeArabic(c.nameArabic);
      if (normArabic.includes(normQ) || normArabic.includes(normalizeArabic(q))) return true;

      return false;
    });
  }, [chapters, query]);

  return (
    <div className="quran-index">
      <div className="quran-search-wrapper">
        <div className="quran-search-box">
          <Search className="quran-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="quran-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            aria-label={dict.searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              className="quran-search-clear"
              onClick={() => setQuery("")}
              aria-label={dict.clearSearch}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="quran-empty-state">
          <p>{dict.noMatches}</p>
          <button
            type="button"
            className="quran-btn quran-btn--secondary"
            onClick={() => setQuery("")}
          >
            {dict.clearSearch}
          </button>
        </div>
      ) : (
        <ul className="quran-grid" role="list">
          {filtered.map((c) => {
            const versesText = dict.versesCount.replace("{count}", String(c.versesCount));
            const placeText =
              c.revelationPlace === "makkah"
                ? dict.revelationMakkah
                : c.revelationPlace === "madinah"
                ? dict.revelationMadinah
                : null;

            return (
              <li key={c.id}>
                <Link
                  href={`/${lang}/quran/${c.id}`}
                  className="quran-card"
                  aria-label={`${c.id}. ${c.nameSimple} - ${c.nameArabic}`}
                >
                  <div className="quran-card-leading">
                    <span className="quran-card-num">{c.id}</span>
                  </div>
                  <div className="quran-card-body">
                    <div className="quran-card-header">
                      <span className="quran-card-title">{c.nameSimple}</span>
                      <span className="quran-card-arabic" lang="ar" dir="rtl">
                        {c.nameArabic}
                      </span>
                    </div>
                    <div className="quran-card-sub">{c.translatedName}</div>
                    <div className="quran-card-meta">
                      <span>{versesText}</span>
                      {placeText && (
                        <>
                          <span className="quran-meta-dot" aria-hidden="true">•</span>
                          <span>{placeText}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="quran-attribution">
        <p>
          <a
            href="https://quran.foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="quran-attribution-link"
          >
            {dict.attributionProvider}
          </a>
        </p>
        {lang === "en" && <p className="quran-attribution-sub">{dict.attributionTranslator}</p>}
      </footer>
    </div>
  );
}

