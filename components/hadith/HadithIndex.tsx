"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Compass, Search, ShieldCheck, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { HadithCollectionSummary } from "@/lib/hadith/types";
import { searchHadith, type HadithSearchResult } from "@/lib/hadith/search";
import { isWordQuery, useWordSearch } from "@/lib/search/use-word-search";
import type { HadithWordHit } from "@/lib/hadith/word-search";
import { Highlighted, WordSearchSection } from "@/components/search/WordSearchSection";

interface HadithIndexProps {
  lang: Locale;
  dict: Dictionary["hadith"];
  collections: HadithCollectionSummary[];
}

export function HadithIndex({ lang, dict, collections }: HadithIndexProps) {
  const router = useRouter();
  const searchInputId = useId();
  const resultsListId = useId();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // Search calculation
  const searchResults = useMemo(() => {
    return searchHadith(query, lang);
  }, [lang, query]);

  const directMatches = useMemo(() => {
    return searchResults.filter((r) => !r.isTypoSuggestion);
  }, [searchResults]);

  const typoSuggestions = useMemo(() => {
    return searchResults.filter((r) => r.isTypoSuggestion);
  }, [searchResults]);

  const collectionsMap = useMemo(() => {
    const map = new Map<string, HadithCollectionSummary>();
    for (const c of collections) map.set(c.id, c);
    return map;
  }, [collections]);

  const isSearching = query.trim().length > 0;
  const isChoiceState = directMatches.length > 0 && directMatches.every((r) => r.type === "choice");

  // Words typed are also searched in the hadith text (Arabic, or the English / German translation).
  const word = useWordSearch<HadithWordHit>("/api/hadith/search", lang, query);
  const wordActive = isWordQuery(query);
  const nothingFound = directMatches.length === 0 && (!wordActive || (word.status === "done" && word.items.length === 0));

  // Form submit handler
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComposingRef.current) return;
    if (activeIndex >= 0 && activeIndex < directMatches.length) {
      router.push(directMatches[activeIndex].targetHref);
    } else if (directMatches.length === 1) {
      router.push(directMatches[0].targetHref);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || isComposingRef.current || e.keyCode === 229) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (directMatches.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % directMatches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (directMatches.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? directMatches.length - 1 : prev - 1));
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

  const activeResultId =
    activeIndex >= 0 && activeIndex < directMatches.length
      ? directMatches[activeIndex].id
      : undefined;

  return (
    <div className="hadith-page">
      <header className="hadith-header">
        <h1 className="hadith-title">{dict.title}</h1>
        <p className="hadith-intro">{dict.intro}</p>
      </header>

      {/* Forgiving Search Bar */}
      <div className="hadith-search-wrapper">
        <form onSubmit={handleLookup} className="hadith-search-form" role="search">
          <Search className="hadith-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id={searchInputId}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearching && directMatches.length > 0}
            aria-controls={resultsListId}
            aria-activedescendant={activeResultId}
            className="hadith-search-input"
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
              className="hadith-search-clear"
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
          <button type="submit" className="hadith-search-btn">
            {dict.searchBtn}
          </button>
        </form>
      </div>

      {/* Typo Suggestion Banner ("Did you mean ...?") */}
      {isSearching && typoSuggestions.length > 0 && directMatches.length === 0 && (
        <div className="hadith-suggestion-banner" role="status">
          <Compass className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>
            {dict.didYouMean.replace("{suggestion}", "")}{" "}
            {typoSuggestions.map((suggestion, idx) => (
              <span key={suggestion.id}>
                {idx > 0 && ", "}
                <button
                  type="button"
                  className="hadith-suggestion-link"
                  onClick={() => handleApplySuggestion(suggestion.suggestedQuery || suggestion.title)}
                >
                  {suggestion.title}
                </button>
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Display: Collections Grid, Search Results, or Empty State */}
      {!isSearching ? (
        // Standard Collections Grid
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
      ) : nothingFound ? (
        // Empty State (no collection, reference or word matches)
        <div className="hadith-empty-state" role="status">
          <p>{wordActive ? dict.wordNone : dict.noMatches}</p>
          <button
            type="button"
            className="hadith-btn hadith-btn--secondary"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            {dict.clearSearch}
          </button>
        </div>
      ) : directMatches.length === 0 ? null : (
        // Search Results List (including Clear Choice for standalone numbers)
        <div id={resultsListId} role="listbox" aria-label={dict.title}>
          {isChoiceState && (
            <div className="hadith-choices-header">
              {dict.chooseCollection.replace("{number}", directMatches[0].reference || query.trim())}
            </div>
          )}

          <div className="hadith-collections-grid">
            {directMatches.map((match, mIdx) => {
              const isActive = activeIndex === mIdx;

              // Check if matching full collection
              if (match.type === "collection" && match.collectionId) {
                const c = collectionsMap.get(match.collectionId);
                const title = match.title;
                const desc = match.subtitle || (match.collectionId === "bukhari" ? dict.bukhariDesc : dict.muslimDesc);

                return (
                  <Link
                    key={match.id}
                    id={match.id}
                    role="option"
                    aria-selected={isActive}
                    href={match.targetHref}
                    className={`hadith-collection-card ${isActive ? "hadith-card--active" : ""}`}
                  >
                    <div className="hadith-collection-header">
                      <div>
                        <h2 className="hadith-collection-title-en">{title}</h2>
                        {c?.nameArabic && (
                          <div className="hadith-collection-title-ar" lang="ar" dir="rtl">
                            {c.nameArabic}
                          </div>
                        )}
                      </div>
                      <div className="hadith-collection-arrow" aria-hidden="true">
                        <ArrowRight className="flip-rtl" />
                      </div>
                    </div>
                    <p className="hadith-collection-desc">{desc}</p>
                  </Link>
                );
              }

              // Hadith reference or standalone number choice
              return (
                <Link
                  key={match.id}
                  id={match.id}
                  role="option"
                  aria-selected={isActive}
                  href={match.targetHref}
                  className={`hadith-collection-card ${isActive ? "hadith-card--active" : ""}`}
                >
                  <div className="hadith-collection-header">
                    <div>
                      <h2 className="hadith-collection-title-en">{match.title}</h2>
                      {match.subtitle && (
                        <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", marginBlockStart: "4px" }}>
                          {match.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="hadith-collection-arrow" aria-hidden="true">
                      <ArrowRight className="flip-rtl" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {isSearching && (
        <WordSearchSection
          labels={{ heading: dict.wordHeading, searching: dict.wordSearching, error: dict.wordError, retry: dict.wordRetry, more: dict.wordMore }}
          status={word.status}
          hasMore={word.hasMore}
          count={word.items.length}
          onMore={word.loadMore}
          onRetry={word.retry}
          note={word.items.some((h) => h.excerptLang !== "ar") ? dict.wordNote : undefined}
        >
          {word.items.map((hit) => (
            <li key={`${hit.collection}:${hit.number}`}>
              <Link href={`/${lang}/hadith/${hit.collection}/${hit.number}`} className="word-item">
                <span className="word-item-ref">
                  {hit.collection === "bukhari" ? dict.bukhari : dict.muslim}
                  <small>{dict.hadithNumber.replace("{number}", hit.number)}</small>
                </span>
                <p
                  className={hit.excerptLang === "ar" ? "word-item-ar" : "word-item-text"}
                  lang={hit.excerptLang}
                  dir={hit.excerptLang === "ar" ? "rtl" : "ltr"}
                >
                  <Highlighted text={hit.excerpt} />
                </p>
                {hit.chapter && <p className="word-item-chapter" lang="ar" dir="rtl">{hit.chapter}</p>}
              </Link>
            </li>
          ))}
        </WordSearchSection>
      )}

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
