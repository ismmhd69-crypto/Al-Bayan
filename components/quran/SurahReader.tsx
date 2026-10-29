"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Loader2, Pause, Play, RotateCcw, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { PaginatedVerses, SurahDetail, SurahSummary, Verse, VersePagination } from "@/lib/quran/types";
import { FormattedTranslation } from "./FormattedTranslation";
import type { ActivePlayback } from "@/lib/quran/playback";

type Recitation = { audioUrl: string; words: { position: number; text: string }[]; segments: [number, number, number][] };
type Playback = Omit<ActivePlayback, "status"> & { status: ActivePlayback["status"] | "paused" };
type SurahRecitation = { audioUrl: string; verses: { verseNumber: number; from: number; to: number; segments: [number, number, number][]; words: Recitation["words"] }[] };

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
  const [activePlayback, setActivePlayback] = useState<Playback | null>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set([initialVerses.pagination.currentPage]));

  // One player for single verses and the whole surah (Mo, 2026-10-29). Each verse's recitation comes
  // with Quran Foundation's word timings, so the word being recited is highlighted. In surah mode the
  // next verse starts when one ends, loading more verses and scrolling to it as needed.
  const [surahMode, setSurahMode] = useState(false);
  const [recited, setRecited] = useState<{ verse: number; words: Recitation["words"]; position: number | null } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef(0);
  const modeRef = useRef<"verse" | "surah">("verse");
  const currentRef = useRef<{ verse: number; recitation: Recitation } | null>(null);
  const surahFileRef = useRef<Promise<SurahRecitation | null> | null>(null);
  const surahTimesRef = useRef<SurahRecitation | null>(null);
  const recitationsRef = useRef(new Map<number, Promise<Recitation | null>>());
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const frameRef = useRef(0);
  const playVerseRef = useRef<(verse: number, mode: "verse" | "surah") => Promise<void>>(async () => {});

  const recitation = useCallback((verse: number) => {
    let found = recitationsRef.current.get(verse);
    if (!found) {
      found = fetch(`/api/quran/recitation/${surah.id}:${verse}`).then((r) => (r.ok ? (r.json() as Promise<Recitation>) : null)).catch(() => null);
      recitationsRef.current.set(verse, found);
    }
    return found;
  }, [surah.id]);

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

  const stopTicking = () => { cancelAnimationFrame(frameRef.current); frameRef.current = 0; };
  const tick = useCallback(() => {
    const audio = audioRef.current, timed = surahTimesRef.current;
    if (audio && timed && modeRef.current === "surah") {
      // One continuous file: find the verse, then the word, at the current time.
      const ms = audio.currentTime * 1000;
      const v = timed.verses.find((x) => ms >= x.from && ms < x.to);
      if (v) {
        if (currentRef.current?.verse !== v.verseNumber) {
          currentRef.current = { verse: v.verseNumber, recitation: { audioUrl: timed.audioUrl, words: v.words, segments: v.segments } };
          setActivePlayback((p) => (p ? { ...p, verseNumber: v.verseNumber } : p));
          setRecited(v.words.length ? { verse: v.verseNumber, words: v.words, position: null } : null);
          showVerseRef.current(v.verseNumber);
        }
        const position = v.segments.find(([, start, end]) => ms >= start && ms < end)?.[0];
        if (position !== undefined) setRecited((r) => (r && r.verse === v.verseNumber && r.position !== position ? { ...r, position } : r));
      }
      frameRef.current = requestAnimationFrame(tick);
      return;
    }
    const current = currentRef.current;
    if (!audio || !current) return;
    const ms = audio.currentTime * 1000;
    const position = current.recitation.segments.find(([, start, end]) => ms >= start && ms < end)?.[0];
    if (position !== undefined) setRecited((r) => (r && r.verse === current.verse && r.position !== position ? { ...r, position } : r));
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  // Keep the recited verse on screen, loading its page first when needed.
  const showVerseRef = useRef<(verse: number) => void>(() => {});
  showVerseRef.current = (verse: number) => {
    const scroll = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`ayah-${verse}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    };
    if (versesRef.current.some((v) => v.verseNumber === verse)) requestAnimationFrame(scroll);
    else void fetchPage(Math.ceil(verse / (pagination.perPage || 30))).then(() => setTimeout(scroll, 150), () => {});
  };

  // The whole surah as one file: no loading between verses (Mo, 2026-10-29).
  const playSurah = useCallback(async () => {
    const session = ++sessionRef.current;
    modeRef.current = "surah";
    setSurahMode(true);
    stopTicking();
    audioRef.current?.pause();
    setActivePlayback({ verseNumber: 1, status: "loading" });
    surahFileRef.current ??= fetch(`/api/quran/surah-recitation/${surah.id}`).then((r) => (r.ok ? (r.json() as Promise<SurahRecitation>) : null)).catch(() => null);
    const file = await surahFileRef.current;
    if (session !== sessionRef.current) return;
    if (!file?.audioUrl) { surahFileRef.current = null; void playVerse(1, "surah"); return; }
    surahTimesRef.current = file;
    currentRef.current = null;
    const audio = (audioRef.current ??= new Audio());
    audio.src = file.audioUrl;
    try { await audio.play(); } catch { if (session === sessionRef.current) setActivePlayback({ verseNumber: 1, status: "error" }); }
  }, [surah.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const playVerse = useCallback(async (verse: number, mode: "verse" | "surah") => {
    const session = ++sessionRef.current;
    surahTimesRef.current = null;
    modeRef.current = mode;
    setSurahMode(mode === "surah");
    stopTicking();
    audioRef.current?.pause();
    setActivePlayback({ verseNumber: verse, status: "loading" });
    if (mode === "surah" && !versesRef.current.some((v) => v.verseNumber === verse)) {
      try { await fetchPage(Math.ceil(verse / (pagination.perPage || 30))); } catch { /* Played without its card. */ }
    }
    const r = await recitation(verse);
    if (session !== sessionRef.current) return;
    if (!r?.audioUrl) { setActivePlayback({ verseNumber: verse, status: "error" }); return; }
    currentRef.current = { verse, recitation: r };
    const timed = r.words.length > 0 && r.segments.every(([p]) => r.words.some((w) => w.position === p));
    setRecited(timed ? { verse, words: r.words, position: null } : null);
    if (mode === "surah") {
      if (verse < surah.versesCount) void recitation(verse + 1);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => document.getElementById(`ayah-${verse}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }));
    }
    const audio = (audioRef.current ??= new Audio());
    audio.src = r.audioUrl;
    try { await audio.play(); } catch { if (session === sessionRef.current) setActivePlayback({ verseNumber: verse, status: "error" }); }
  }, [fetchPage, pagination.perPage, recitation, surah.versesCount]);
  playVerseRef.current = playVerse;

  // Audio events, attached once. Ending a verse in surah mode starts the next one.
  useEffect(() => {
    const audio = (audioRef.current ??= new Audio());
    const verse = () => currentRef.current?.verse ?? 0;
    const onPlaying = () => { setActivePlayback((p) => ({ verseNumber: verse() || p?.verseNumber || 1, status: "playing" })); stopTicking(); frameRef.current = requestAnimationFrame(tick); };
    const onPause = () => { stopTicking(); if (!audio.ended) setActivePlayback((p) => (p && p.status !== "loading" ? { ...p, status: "paused" } : p)); };
    const onEnded = () => {
      stopTicking();
      const n = verse();
      if (modeRef.current === "surah" && !surahTimesRef.current && n < surah.versesCount) { void playVerseRef.current(n + 1, "surah"); return; }
      surahTimesRef.current = null;
      setActivePlayback(null); setRecited(null); setSurahMode(false); currentRef.current = null;
    };
    const onError = () => { stopTicking(); if (audio.getAttribute("src")) setActivePlayback({ verseNumber: verse(), status: "error" }); };
    audio.addEventListener("playing", onPlaying); audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded); audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying); audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded); audio.removeEventListener("error", onError);
    };
  }, [surah.versesCount, tick]);

  // Release audio when changing surah or leaving the page.
  useEffect(() => () => {
    sessionRef.current++; stopTicking();
    audioRef.current?.pause(); audioRef.current?.removeAttribute("src");
    currentRef.current = null; recitationsRef.current.clear(); surahFileRef.current = null; surahTimesRef.current = null;
  }, [surah.id]);

  const toggleAudio = useCallback((verse: Verse) => {
    const audio = audioRef.current;
    if (activePlayback?.verseNumber === verse.verseNumber && audio) {
      if (activePlayback.status === "playing") { audio.pause(); return; }
      if (activePlayback.status === "paused") { void audio.play(); return; }
    }
    void playVerse(verse.verseNumber, "verse");
  }, [activePlayback, playVerse]);

  const toggleSurah = () => {
    const audio = audioRef.current;
    if (surahMode && activePlayback && audio) {
      if (activePlayback.status === "loading") { sessionRef.current++; setActivePlayback({ ...activePlayback, status: "paused" }); return; }
      if (activePlayback.status === "playing") { audio.pause(); return; }
      if (activePlayback.status === "paused") {
        if (audio.getAttribute("src") && (surahTimesRef.current || currentRef.current?.verse === activePlayback.verseNumber)) void audio.play();
        else void playSurah();
        return;
      }
    }
    void playSurah();
  };
  const surahStatus = surahMode ? activePlayback?.status ?? null : null;
  const stopSurah = () => {
    sessionRef.current++; stopTicking(); audioRef.current?.pause();
    setActivePlayback(null); setRecited(null); setSurahMode(false); currentRef.current = null; surahTimesRef.current = null;
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

        <button type="button" className={`quran-surah-play${surahStatus === "playing" ? " playing" : ""}`} onClick={toggleSurah}
          aria-pressed={surahStatus === "playing"}>
          {surahStatus === "loading" ? <Loader2 aria-hidden="true" className="quran-spin-icon" /> : surahStatus === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          <span>{surahStatus === "playing" || surahStatus === "loading" ? dict.pauseSurah : surahStatus === "paused" ? dict.resumeSurah : dict.playSurah}</span>
          {surahMode && activePlayback && <span className="quran-surah-play-verse">{dict.ayah} {activePlayback.verseNumber}</span>}
        </button>

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
                {recited?.verse === v.verseNumber
                  ? recited.words.map((w, i) => <span key={w.position}>{i > 0 && " "}<span className={`recited-word${w.position === recited.position ? " recited-word--now" : ""}`}>{w.text}</span></span>)
                  : v.textUthmani}
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

      {/* While a surah plays the page scrolls with it, so its controls also float above the tab bar. */}
      {surahMode && activePlayback && (
        <div className="quran-surah-float" role="group" aria-label={surah.nameSimple}>
          <button type="button" className="quran-surah-float-btn" onClick={toggleSurah}
            aria-label={surahStatus === "playing" || surahStatus === "loading" ? dict.pauseSurah : dict.resumeSurah}>
            {surahStatus === "loading" ? <Loader2 aria-hidden="true" className="quran-spin-icon" /> : surahStatus === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <span className="quran-surah-float-text">
            <strong lang={lang === "ar" ? "ar" : undefined}>{lang === "ar" ? surah.nameArabic : surah.nameSimple}</strong>
            <span>{dict.ayah} {activePlayback.verseNumber} / {surah.versesCount}</span>
          </span>
          <button type="button" className="quran-surah-float-close" onClick={stopSurah} aria-label={dict.stopSurah}>
            <X aria-hidden="true" />
          </button>
        </div>
      )}

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

