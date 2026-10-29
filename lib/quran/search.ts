/**
 * Forgiving Quran search service.
 * Supports:
 * - Arabic surah names and alef/tashkeel variants
 * - English transliterations, translated names and explicit aliases
 * - Surah numbers and Arabic/Persian digits
 * - Exact verse references (e.g., "2:255", "2 : 255", "٢:٢٥٥")
 * - Well-known passage references (e.g., "Ayat al-Kursi")
 * - Ranked results: exact -> normalized exact -> prefix/word -> conservative typo suggestions
 */

import { VERSES_PER_SURAH } from "@/lib/sources/quran-meta";
import type { SurahSummary } from "./types";
import {
  isTypoMatch,
  normalizeArabicText,
  normalizeDigits,
  normalizeLatinText,
  toCanonicalSlug,
} from "@/lib/search/normalization";
import { SURAH_ALIASES, WELL_KNOWN_PASSAGES } from "./surah-aliases";
import type { Locale } from "@/lib/i18n";

export type QuranSearchResultType = "surah" | "verse" | "suggestion";

export interface QuranSearchResult {
  id: string;
  type: QuranSearchResultType;
  surahId: number;
  verseNumber?: number;
  title: string;
  subtitle?: string;
  targetHref: string;
  rank: 1 | 2 | 3 | 4;
  isTypoSuggestion?: boolean;
  suggestedQuery?: string;
}

/** Parses verse reference formats like "2:255", "2 : 255", "٢:٢٥٥", "سورة 2:255". */
export function parseVerseReference(rawQuery: string): { surah: number; verse: number } | null {
  if (!rawQuery) return null;
  const cleaned = normalizeDigits(rawQuery)
    .replace(/^(?:surah|ayah|سورة|آية)\s+/i, "")
    .trim();

  // Match surah:verse with optional whitespace around colon
  const match = cleaned.match(/^(\d{1,3})\s*[:\s]\s*(\d{1,3})$/);
  if (!match) return null;

  const surah = parseInt(match[1], 10);
  const verse = parseInt(match[2], 10);

  if (isNaN(surah) || isNaN(verse)) return null;
  if (surah < 1 || surah > 114) return null;

  // Validate verse against actual bounds for that surah
  const maxVerses = VERSES_PER_SURAH[surah - 1];
  if (verse < 1 || verse > maxVerses) return null;

  return { surah, verse };
}

/**
 * Searches Quran chapters and verses with forgiving normalization,
 * exact verse bounds validation, and conservative typo suggestions.
 */
export function searchQuran(
  query: string,
  chapters: SurahSummary[],
  lang: Locale
): QuranSearchResult[] {
  const qTrimmed = query.trim();
  if (!qTrimmed) return [];

  const qDigitsNorm = normalizeDigits(qTrimmed);
  const qArabicNorm = normalizeArabicText(qTrimmed);
  const qLatinNorm = normalizeLatinText(qTrimmed);
  const qSlug = toCanonicalSlug(qTrimmed);

  const results: QuranSearchResult[] = [];
  const seenSurahIds = new Set<number>();

  // 1. Check for exact verse reference (e.g. "2:255", "٢:٢٥٥")
  const verseRef = parseVerseReference(qTrimmed);
  if (verseRef) {
    const chapter = chapters.find((c) => c.id === verseRef.surah);
    const surahName = chapter
      ? lang === "ar"
        ? chapter.nameArabic
        : chapter.nameSimple
      : `Surah ${verseRef.surah}`;

    const title =
      lang === "ar"
        ? `سورة ${surahName} (${verseRef.surah}:${verseRef.verse})`
        : `Surah ${surahName} (${verseRef.surah}:${verseRef.verse})`;

    const subtitle =
      lang === "ar"
        ? `انتقل مباشرة إلى الآية ${verseRef.verse}`
        : `Jump directly to verse ${verseRef.verse}`;

    results.push({
      id: `verse-${verseRef.surah}-${verseRef.verse}`,
      type: "verse",
      surahId: verseRef.surah,
      verseNumber: verseRef.verse,
      title,
      subtitle,
      targetHref: `/${lang}/quran/${verseRef.surah}#ayah-${verseRef.verse}`,
      rank: 1,
    });
  }

  // 2. Check for well-known passage aliases (e.g. "Ayat al-Kursi")
  for (const passage of WELL_KNOWN_PASSAGES) {
    const isPassageMatch = passage.aliases.some((alias) => {
      const aSlug = toCanonicalSlug(alias);
      return qSlug === aSlug || normalizeLatinText(alias) === qLatinNorm || normalizeArabicText(alias) === qArabicNorm;
    });

    if (isPassageMatch) {
      const chapter = chapters.find((c) => c.id === passage.surah);
      const surahName = chapter
        ? lang === "ar"
          ? chapter.nameArabic
          : chapter.nameSimple
        : `Surah ${passage.surah}`;

      const title =
        lang === "ar"
          ? `${passage.name} (سورة ${surahName}: ${passage.verse})`
          : `${passage.name} (Surah ${surahName} ${passage.surah}:${passage.verse})`;

      results.push({
        id: `passage-${passage.surah}-${passage.verse}`,
        type: "verse",
        surahId: passage.surah,
        verseNumber: passage.verse,
        title,
        subtitle: lang === "ar" ? `الآية ${passage.verse}` : `Verse ${passage.verse}`,
        targetHref: `/${lang}/quran/${passage.surah}#ayah-${passage.verse}`,
        rank: 1,
      });
    }
  }

  // 3. Exact surah number (e.g. "2" or "٢")
  const numOnly = parseInt(qDigitsNorm, 10);
  if (!isNaN(numOnly) && String(numOnly) === qDigitsNorm && numOnly >= 1 && numOnly <= 114) {
    const chapter = chapters.find((c) => c.id === numOnly);
    if (chapter) {
      seenSurahIds.add(chapter.id);
      results.push({
        id: `surah-${chapter.id}`,
        type: "surah",
        surahId: chapter.id,
        title: lang === "ar" ? `سورة ${chapter.nameArabic}` : `Surah ${chapter.nameSimple}`,
        subtitle: lang === "ar" ? `السورة رقم ${chapter.id} (${chapter.versesCount} آية)` : `Surah ${chapter.id} · ${chapter.translatedName} (${chapter.versesCount} verses)`,
        targetHref: `/${lang}/quran/${chapter.id}`,
        rank: 1,
      });
    }
  }

  // 4. Match surahs by exact name, normalized name, alias, prefix, or typo
  const typoSuggestions: QuranSearchResult[] = [];

  for (const chapter of chapters) {
    if (seenSurahIds.has(chapter.id)) continue;

    const aliases = SURAH_ALIASES[chapter.id] ?? [];
    const namesToTest = [
      chapter.nameSimple,
      chapter.nameComplex,
      chapter.nameArabic,
      chapter.translatedName,
      ...aliases,
    ];

    let bestRank: 1 | 2 | 3 | null = null;

    for (const name of namesToTest) {
      // Rank 1: Case-insensitive / whitespace-trimmed exact match
      if (
        name.toLowerCase() === qTrimmed.toLowerCase() ||
        normalizeArabicText(name) === qArabicNorm
      ) {
        bestRank = 1;
        break;
      }

      // Rank 2: Canonical slug match (e.g. "al fatiha" === "Al-Fatihah", "fatiha" === "fatihah")
      const nSlug = toCanonicalSlug(name);
      if (qSlug && nSlug && qSlug === nSlug) {
        bestRank = bestRank ? (Math.min(bestRank, 2) as 1 | 2) : 2;
        break;
      }

      // Rank 3: Prefix or word match
      const nLatin = normalizeLatinText(name);
      const nArabic = normalizeArabicText(name);
      if (
        (qLatinNorm.length >= 2 && (nLatin.startsWith(qLatinNorm) || nLatin.split(/\s+/).some((w) => w.startsWith(qLatinNorm)))) ||
        (qArabicNorm.length >= 2 && (nArabic.startsWith(qArabicNorm) || nArabic.split(/\s+/).some((w) => w.startsWith(qArabicNorm)))) ||
        (qSlug.length >= 3 && nSlug.startsWith(qSlug))
      ) {
        bestRank = bestRank ? (Math.min(bestRank, 3) as 1 | 2 | 3) : 3;
      }
    }

    if (bestRank !== null) {
      seenSurahIds.add(chapter.id);
      results.push({
        id: `surah-${chapter.id}`,
        type: "surah",
        surahId: chapter.id,
        title: lang === "ar" ? `سورة ${chapter.nameArabic}` : `Surah ${chapter.nameSimple}`,
        subtitle:
          lang === "ar"
            ? `السورة رقم ${chapter.id} (${chapter.versesCount} آية)`
            : `Surah ${chapter.id} · ${chapter.translatedName} (${chapter.versesCount} verses)`,
        targetHref: `/${lang}/quran/${chapter.id}`,
        rank: bestRank,
      });
      continue;
    }

    // Rank 4: Conservative typo suggestion (only if query length >= 4)
    if (qSlug.length >= 4) {
      let isTypo = false;
      for (const name of namesToTest) {
        if (isTypoMatch(qSlug, toCanonicalSlug(name))) {
          isTypo = true;
          break;
        }
      }

      if (isTypo) {
        const canonicalName = lang === "ar" ? chapter.nameArabic : chapter.nameSimple;
        typoSuggestions.push({
          id: `suggestion-${chapter.id}`,
          type: "suggestion",
          surahId: chapter.id,
          title: lang === "ar" ? `سورة ${chapter.nameArabic}` : `Surah ${chapter.nameSimple}`,
          subtitle:
            lang === "ar"
              ? `هل تقصد سورة ${chapter.nameArabic}؟`
              : `Did you mean Surah ${chapter.nameSimple}?`,
          targetHref: `/${lang}/quran/${chapter.id}`,
          rank: 4,
          isTypoSuggestion: true,
          suggestedQuery: canonicalName,
        });
      }
    }
  }

  // Sort matched results by rank, then surah number
  results.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.surahId - b.surahId;
  });

  // Append typo suggestions at the end (conservative, capped at 3)
  if (typoSuggestions.length > 0) {
    typoSuggestions.sort((a, b) => a.surahId - b.surahId);
    results.push(...typoSuggestions.slice(0, 3));
  }

  return results;
}

