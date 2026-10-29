"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Compass, Search, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SurahSummary } from "@/lib/quran/types";
import { searchQuran, type QuranSearchResult } from "@/lib/quran/search";

interface SurahIndexProps {
  lang: Locale;
  dict: Dictionary["quran"];
  chapters: SurahSummary[];
}

export function SurahIndex({ lang, dict, chapters }: SurahIndexProps) {
  const router = useRouter();
  const searchInputId = useId();
  const resultsListId = useId();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // Search results calculation
  const searchResults = useMemo(() => {
    return searchQuran(query, chapters, lang);
  }, [chapters, lang, query]);

  // Separate non-typo matches from typo suggestions
  const directMatches = useMemo(() => {
    return searchResults.filter((r) => !r.isTypoSuggestion);
  }, [searchResults]);

  const typoSuggestions = useMemo(() => {
    return searchResults.filter((r) => r.isTypoSuggestion);
  }, [searchResults]);

  // Chapters map for quick lookup when rendering surah cards
  const chaptersMap = useMemo(() => {
    const map = new Map<number, SurahSummary>();
    for (const c of chapters) map.set(c.id, c);
    return map;
  }, [chapters]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Avoid interrupting during active IME composition (e.g. typing Arabic)
    if (e.nativeEvent.isComposing || isComposingRef.current || e.keyCode === 229) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (directMatches.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % directMatches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (directMatches.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? directMatches.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < directMatches.length) {
        e.preventDefault();
        router.push(directMatches[activeIndex].targetHref);
      } else if (directMatches.length === 1) {
        e.preventDefault();
        router.push(directMatches[0].targetHref);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setActiveIndex(-1);
    }
  };

  const handleApplySuggestion = (suggested: string) => {
    setQuery(suggested);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const isSearching = query.trim().length > 0;
  const activeResultId =
    activeIndex >= 0 && activeIndex < directMatches.length
      ? directMatches[activeIndex].id
      : undefined;

  return (
    <div className="quran-index">
      {/* Search Input Bar */}
      <div className="quran-search-wrapper">
        <div className="quran-search-box" role="search">
          <Search className="quran-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id={searchInputId}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearching && directMatches.length > 0}
            aria-controls={resultsListId}
            aria-activedescendant={activeResultId}
            className="quran-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            placeholder={dict.searchPlaceholder}
            aria-label={dict.searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              className="quran-search-clear"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              aria-label={dict.clearSearch}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Typo Suggestion Banner ("Did you mean ...?") */}
      {isSearching && typoSuggestions.length > 0 && directMatches.length === 0 && (
        <div className="quran-suggestion-banner" role="status">
          <Compass className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>
            {dict.didYouMean.replace("{suggestion}", "")}{" "}
            {typoSuggestions.map((suggestion, idx) => (
              <span key={suggestion.id}>
                {idx > 0 && ", "}
                <button
                  type="button"
                  className="quran-suggestion-link"
                  onClick={() => handleApplySuggestion(suggestion.suggestedQuery || suggestion.title)}
                >
                  {suggestion.title}
                </button>
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Content Display: Full List, Search Results, or Empty State */}
      {!isSearching ? (
        // Initial Full Surah Grid (114 Surahs)
        <ul className="quran-grid" role="list">
          {chapters.map((c) => {
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
      ) : directMatches.length === 0 ? (
        // Empty State (no direct matches)
        <div className="quran-empty-state" role="status">
          <p>{dict.noMatches}</p>
          <button
            type="button"
            className="quran-btn quran-btn--secondary"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            {dict.clearSearch}
          </button>
        </div>
      ) : (
        // Search Results List
        <div id={resultsListId} role="listbox" aria-label={dict.allSurahs}>
          {/* Verse matches shown with prominent jump card */}
          {directMatches.some((r) => r.type === "verse") && (
            <div style={{ marginBlockEnd: "20px" }}>
              {directMatches
                .filter((r) => r.type === "verse")
                .map((verseResult, vIdx) => {
                  const isActive = activeIndex === vIdx;
                  return (
                    <Link
                      key={verseResult.id}
                      id={verseResult.id}
                      role="option"
                      aria-selected={isActive}
                      href={verseResult.targetHref}
                      className={`quran-card quran-card--verse ${isActive ? "quran-card--active" : ""}`}
                      style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="quran-verse-badge">
                          <BookOpen className="w-3.5 h-3.5" style={{ marginInlineEnd: "4px" }} aria-hidden="true" />
                          <span>{dict.ayah} {verseResult.verseNumber}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {verseResult.title}
                          </div>
                          {verseResult.subtitle && (
                            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                              {verseResult.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="flip-rtl w-5 h-5 text-accent" aria-hidden="true" />
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Surah Matches */}
          <ul className="quran-grid" role="list">
            {directMatches
              .filter((r) => r.type === "surah")
              .map((match) => {
                const c = chaptersMap.get(match.surahId);
                if (!c) return null;
                const matchIndex = directMatches.indexOf(match);
                const isActive = activeIndex === matchIndex;

                const versesText = dict.versesCount.replace("{count}", String(c.versesCount));
                const placeText =
                  c.revelationPlace === "makkah"
                    ? dict.revelationMakkah
                    : c.revelationPlace === "madinah"
                      ? dict.revelationMadinah
                      : null;

                return (
                  <li key={match.id}>
                    <Link
                      id={match.id}
                      role="option"
                      aria-selected={isActive}
                      href={match.targetHref}
                      className={`quran-card ${isActive ? "quran-card--active" : ""}`}
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
        </div>
      )}

      {/* Attribution Footer */}
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
