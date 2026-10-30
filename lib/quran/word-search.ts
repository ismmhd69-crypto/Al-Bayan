import "server-only";
import { getVerse, searchQuranWords } from "@/lib/sources/quran";
import type { Locale } from "@/lib/i18n";

export const QURAN_WORD_PAGE = 10;

export interface QuranWordHit {
  key: string; // "2:255"
  surah: number;
  verse: number;
  arabic: string;
  /** The translation in the page language (English or German); null on the Arabic page or when absent. */
  translation: string | null;
}

/** Verses whose Arabic or translated words match, with the exact text Quran Foundation serves. */
export async function searchQuranText(query: string, lang: Locale, page: number, signal?: AbortSignal): Promise<{ hits: QuranWordHit[]; hasMore: boolean }> {
  const { keys, hasMore } = await searchQuranWords(query, page, QURAN_WORD_PAGE, signal);
  const verses = await Promise.allSettled(keys.map((key) => getVerse(key)));
  const hits = verses.flatMap((r, i): QuranWordHit[] => {
    if (r.status !== "fulfilled" || !r.value) return [];
    const [surah, verse] = keys[i].split(":").map(Number);
    const translation = lang === "ar" ? null : r.value.translations[lang === "de" ? "de" : "en"];
    return [{ key: keys[i], surah, verse, arabic: r.value.arabic, translation }];
  });
  // Every verse failing to load is a failure, not an empty result.
  if (keys.length > 0 && hits.length === 0) throw new Error("Quran verses could not be loaded");
  return { hits, hasMore };
}
