"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { PaginatedVerses, SurahDetail, SurahSummary, Verse, VersePagination } from "@/lib/quran/types";
import { FormattedTranslation } from "./FormattedTranslation";
import { AudioPlaybackController, type ActivePlayback } from "@/lib/quran/playback";

interface SurahReaderProps {
  lang: Locale;
  dict: Dictionary["quran"];
  surah: SurahDetail;
  initialVerses: PaginatedVerses;
  prevSurah: SurahSummary | null;
  nextSurah: SurahSummary | null;
}

export function SurahReader({
  lang,
  dict,
  surah,
  initialVerses,
  prevSurah,
  nextSurah,
}: SurahReaderProps) {
  const [verses, setVerses] = useState<Verse[]>(initialVerses.verses);
  const [pagination, setPagination] = useState<VersePagination>(initialVerses.pagination);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [activePlayback, setActivePlayback] = useState<ActivePlayback | null>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set([initialVerses.pagination.currentPage]));
  const controllerRef = useRef<AudioPlaybackController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new AudioPlaybackController();
  }

  // Release audio resources when changing surah or unmounting
  useEffect(() => {
    return () => {
      // Invalidate old callbacks and release old audio resources without updating state on unmount
      controllerRef.current?.stopAndRelease();
      controllerRef.current = new AudioPlaybackController();
    };
  }, [surah.id]);

  // Audio Play/Pause handler
  const toggleAudio = useCallback((verse: Verse) => {
    controllerRef.current?.toggleVerse(verse, {
      onStatusChange: (playback) => setActivePlayback(playback),
      onError: (err) => console.warn("Audio error:", err),
    });
  }, []);

  // Helper to merge and sort verses by verseNumber (avoiding duplicates)
  const mergeVerses = useCallback((incoming: Verse[]) => {
    setVerses((current) => {
      const map = new Map<number, Verse>();
      for (const v of current) map.set(v.verseNumber, v);
      for (const v of incoming) map.set(v.verseNumber, v);
      return Array.from(map.values()).sort((a, b) => a.verseNumber - b.verseNumber);
    });
  }, []);

  // Fetch a specific page of verses
  const fetchPage = useCallback(
    async (pageToLoad: number): Promise<PaginatedVerses | null> => {
      try {
        const perPage = pagination.perPage || 30;
        const res = await fetch(
          `/api/quran/${surah.id}/verses?page=${pageToLoad}&per_page=${perPage}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load verses (HTTP ${res.status})`);
        }
        const data = (await res.json()) as PaginatedVerses;
        loadedPagesRef.current.add(pageToLoad);
        mergeVerses(data.verses);
        setPagination((prev) => ({
          ...prev,
          currentPage: Math.max(prev.currentPage, data.pagination.currentPage),
          nextPage: data.pagination.nextPage,
          totalPages: data.pagination.totalPages,
          totalRecords: data.pagination.totalRecords,
        }));
        return data;
      } catch (err) {
        console.error(`Error loading page ${pageToLoad}:`, err);
        throw err;
      }
    },
    [pagination.perPage, surah.id, mergeVerses]
  );

  // Load next page
  const handleLoadMore = async () => {
    if (!pagination.nextPage || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      await fetchPage(pagination.nextPage);
    } catch (err) {
      setLoadError(dict.errorLoading);
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll to verse element smoothly
  const scrollToAyah = useCallback((ayahNum: number) => {
    const el = document.getElementById(`ayah-${ayahNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  }, []);

  // Handle direct verse anchor links (e.g. #ayah-255)
  useEffect(() => {
    const checkHashAndScroll = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const match = hash.match(/^#ayah-(\d+)$/i);
      if (!match) return;

      const targetVerse = parseInt(match[1], 10);
      if (isNaN(targetVerse) || targetVerse < 1 || targetVerse > surah.versesCount) {
        return;
      }

      // Check if target verse is already in loaded verses
      const exists = verses.some((v) => v.verseNumber === targetVerse);
      if (exists) {
        setTimeout(() => scrollToAyah(targetVerse), 150);
        return;
      }

      // If not yet loaded, calculate required page and fetch it
      const perPage = pagination.perPage || 30;
      const targetPage = Math.ceil(targetVerse / perPage);

      if (!loadedPagesRef.current.has(targetPage)) {
        setLoadingMore(true);
        try {
          await fetchPage(targetPage);
          setTimeout(() => scrollToAyah(targetVerse), 200);
        } catch (e) {
          console.error("Failed to load page for verse link:", e);
        } finally {
          setLoadingMore(false);
        }
      }
    };

    checkHashAndScroll();
    window.addEventListener("hashchange", checkHashAndScroll);
    return () => window.removeEventListener("hashchange", checkHashAndScroll);
  }, [fetchPage, pagination.perPage, scrollToAyah, surah.versesCount, verses]);

  // Copy verse link
  const handleCopyLink = async (verseNumber: number) => {
    const url = `${window.location.origin}${window.location.pathname}#ayah-${verseNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAyah(verseNumber);
      setTimeout(() => setCopiedAyah(null), 2000);
    } catch (err) {
      console.warn("Clipboard write failed:", err);
    }
  };

  const placeText =
    surah.revelationPlace === "makkah"
      ? dict.revelationMakkah
      : surah.revelationPlace === "madinah"
      ? dict.revelationMadinah
      : null;

  const versesCountText = dict.versesCount.replace("{count}", String(surah.versesCount));

  return (
    <div className="quran-reader">
      <nav className="quran-nav-top" aria-label={dict.allSurahs}>
        <Link href={`/${lang}/quran`} className="quran-back-link">
          <ArrowLeft aria-hidden="true" className="flip-rtl" />
          <span>{dict.allSurahs}</span>
        </Link>
      </nav>

      <header className="quran-surah-header">
        <div className="quran-surah-num-pill">{dict.surahNumber.replace("{number}", String(surah.id))}</div>
        <h1 className="quran-surah-title-ar" lang="ar" dir="rtl">
          {surah.nameArabic}
        </h1>
        <h2 className="quran-surah-title-en">
          {surah.nameSimple}
          {surah.translatedName && <span className="quran-surah-trans"> ({surah.translatedName})</span>}
        </h2>
        <div className="quran-surah-meta">
          <span>{versesCountText}</span>
          {placeText && (
            <>
              <span className="quran-meta-dot" aria-hidden="true">•</span>
              <span>{placeText}</span>
            </>
          )}
          {surah.revelationOrder && (
            <>
              <span className="quran-meta-dot" aria-hidden="true">•</span>
              <span>{dict.revelationOrder.replace("{order}", String(surah.revelationOrder))}</span>
            </>
          )}
        </div>

        {/* Bismillah: Shown according to source metadata (never before Surah 1 or 9) */}
        {surah.bismillahPre && (
          <div className="quran-bismillah-wrap" aria-label="Bismillah">
            <div className="quran-bismillah" lang="ar" dir="rtl">
              {dict.bismillah}
            </div>
          </div>
        )}
      </header>

      {/* Verses list */}
      <section className="quran-verses-list" aria-label="Verses">
        {verses.map((v) => {
          const isCopied = copiedAyah === v.verseNumber;
          const isCurrentAudio = activePlayback?.verseNumber === v.verseNumber;
          const audioStatus = isCurrentAudio ? activePlayback.status : "idle";
          const hasAudio = Boolean(v.audioUrl);

          const audioTitle = !hasAudio
            ? dict.audioUnavailable
            : audioStatus === "playing"
            ? dict.pauseVerse.replace("{verse}", String(v.verseNumber))
            : audioStatus === "loading"
            ? dict.audioLoading
            : audioStatus === "error"
            ? dict.audioError
            : dict.playVerse.replace("{verse}", String(v.verseNumber));

          return (
            <article
              key={v.verseKey}
              id={`ayah-${v.verseNumber}`}
              className={`quran-verse-card ${audioStatus === "playing" ? "quran-verse-card--active" : ""}`}
              tabIndex={-1}
            >
              <div className="quran-verse-head">
                <a
                  href={`#ayah-${v.verseNumber}`}
                  className="quran-verse-badge"
                  aria-label={`${dict.ayah} ${v.verseNumber}`}
                >
                  <span className="quran-verse-num">{v.verseNumber}</span>
                </a>

                <div className="quran-verse-actions">
                  <button
                    type="button"
                    disabled={!hasAudio}
                    className={`quran-action-btn quran-play-btn ${audioStatus === "playing" ? "playing" : ""} ${!hasAudio ? "quran-play-btn--disabled opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (hasAudio) {
                        toggleAudio(v);
                      }
                    }}
                    title={audioTitle}
                    aria-label={audioTitle}
                  >
                    {audioStatus === "loading" ? (
                      <Loader2 aria-hidden="true" className="quran-action-icon quran-spin-icon" />
                    ) : audioStatus === "playing" ? (
                      <Pause aria-hidden="true" className="quran-action-icon text-accent" />
                    ) : audioStatus === "error" ? (
                      <AlertCircle aria-hidden="true" className="quran-action-icon text-error" />
                    ) : (
                      <Play aria-hidden="true" className="quran-action-icon" />
                    )}
                  </button>

                  <button
                    type="button"
                    className="quran-action-btn"
                    onClick={() => handleCopyLink(v.verseNumber)}
                    title={dict.copyLink}
                    aria-label={`${dict.copyLink} ${v.verseNumber}`}
                  >
                    {isCopied ? (
                      <>
                        <Check aria-hidden="true" className="quran-action-icon text-accent" />
                        <span className="quran-copied-label">{dict.linkCopied}</span>
                      </>
                    ) : (
                      <Copy aria-hidden="true" className="quran-action-icon" />
                    )}
                  </button>
                </div>
              </div>

              <div className="quran-verse-ar" lang="ar" dir="rtl" translate="no">
                {v.textUthmani}
              </div>

              {lang !== "ar" && (
                <div className="quran-verse-translation" lang="en" dir="ltr">
                  {v.translation ? (
                    <FormattedTranslation text={v.translation} />
                  ) : (
                    <span className="quran-verse-unavailable">{dict.translationUnavailable}</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Pagination / Load more control */}
      {pagination.nextPage && (
        <div className="quran-pagination-area">
          <div className="quran-showing-count">
            {dict.showingVerses
              .replace("{count}", String(verses.length))
              .replace("{total}", String(surah.versesCount))}
          </div>

          {loadError ? (
            <div className="quran-load-error">
              <p>{loadError}</p>
              <button
                type="button"
                className="quran-btn quran-btn--secondary"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                <RotateCcw aria-hidden="true" />
                <span>{dict.retry}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="quran-btn quran-btn--primary quran-load-more-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="quran-spin-icon" aria-hidden="true" />
                  <span>{dict.loading}</span>
                </>
              ) : (
                <span>{dict.loadMore}</span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Previous / Next Surah Navigation */}
      <nav className="quran-surah-pagination" aria-label="Surah navigation">
        {prevSurah ? (
          <Link
            href={`/${lang}/quran/${prevSurah.id}`}
            className="quran-surah-nav-link quran-surah-nav-prev"
            aria-label={`${dict.previousSurah}: ${prevSurah.nameSimple}`}
          >
            <ChevronLeft aria-hidden="true" className="flip-rtl" />
            <div className="quran-surah-nav-text">
              <span className="quran-surah-nav-dir">{dict.previousSurah}</span>
              <span className="quran-surah-nav-name">
                {prevSurah.id}. {prevSurah.nameSimple}
              </span>
            </div>
          </Link>
        ) : (
          <div className="quran-surah-nav-spacer" />
        )}

        <Link href={`/${lang}/quran`} className="quran-surah-nav-all">
          {dict.allSurahs}
        </Link>

        {nextSurah ? (
          <Link
            href={`/${lang}/quran/${nextSurah.id}`}
            className="quran-surah-nav-link quran-surah-nav-next"
            aria-label={`${dict.nextSurah}: ${nextSurah.nameSimple}`}
          >
            <div className="quran-surah-nav-text">
              <span className="quran-surah-nav-dir">{dict.nextSurah}</span>
              <span className="quran-surah-nav-name">
                {nextSurah.id}. {nextSurah.nameSimple}
              </span>
            </div>
            <ChevronRight aria-hidden="true" className="flip-rtl" />
          </Link>
        ) : (
          <div className="quran-surah-nav-spacer" />
        )}
      </nav>

      {/* Attribution footer */}
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
        <p className="quran-attribution-sub">{dict.attributionReciter}</p>
        {lang === "en" && <p className="quran-attribution-sub">{dict.attributionTranslator}</p>}
      </footer>
    </div>
  );
}

