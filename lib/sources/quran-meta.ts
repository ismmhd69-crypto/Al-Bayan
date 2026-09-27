// Facts about the Quran source that both server code and tests may use (no network, no secrets).

// Quran Foundation asks connected apps to show this wording with a link wherever its content appears.
export const ATTRIBUTION = {
  text: "Quran data provided by Quran Foundation",
  url: "https://quran.foundation",
} as const;

// Translations available on the test (prelive) keys. Arabic readers see the Arabic text itself.
export const TRANSLATIONS = {
  en: { id: 85, name: "M.A.S. Abdel Haleem" },
  de: { id: 208, name: "Abu Reda Muhammad ibn Ahmad" },
} as const;

// Number of verses in each surah, 1 to 114 (6,236 in total). Used to reject impossible references.
export const VERSES_PER_SURAH = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77,
  227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36,
  25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

export function isRealVerse(surah: number, verse: number): boolean {
  return Number.isInteger(surah) && Number.isInteger(verse) && surah >= 1 && surah <= 114 && verse >= 1 && verse <= VERSES_PER_SURAH[surah - 1];
}

export type Verse = {
  key: string; // "2:255"
  arabic: string; // Uthmani script, exactly as served
  arabicPlain: string; // simple script without marks, used only for search
  translations: { en: string | null; de: string | null }; // exactly as served, or null if not showable
  url: string;
};
