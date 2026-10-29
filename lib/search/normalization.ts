/**
 * Search normalization utilities for Quran and Hadith readers.
 * Normalization is applied solely for comparison during search,
 * preserving all original source texts and references intact.
 */

/** Converts Arabic-Indic and Eastern Arabic/Persian digits to standard ASCII digits. */
export function normalizeDigits(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

/**
 * Normalizes Arabic text for forgiving search comparisons:
 * - Converts Arabic/Persian digits
 * - Removes diacritics (tashkeel) and tatweel
 * - Normalizes alef variants (إ, أ, آ, ٱ -> ا)
 * - Normalizes alif maqsura (ى -> ي)
 * - Normalizes ta marbuta (ة -> ه)
 * - Normalizes hamza seats (ؤ -> و, ئ -> ي)
 * - Collapses whitespace
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return normalizeDigits(text)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // tashkeel & tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/[^\u0621-\u064Aa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Normalizes Latin / English text for forgiving search comparisons:
 * - Lowercases
 * - Unifies curly/modifier apostrophes
 * - Unifies hyphens and dashes
 * - Collapses whitespace
 */
export function normalizeLatinText(text: string): string {
  if (!text) return "";
  return normalizeDigits(text)
    .toLowerCase()
    .replace(/['’‘`ʻʽ]/g, "'")
    .replace(/[-‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common prefixes in transliterated Arabic names (e.g., Al-, An-, Ash-).
 */
const LATIN_PREFIXES = [
  "al-", "al ", "el-", "el ",
  "an-", "an ", "ar-", "ar ",
  "as-", "as ", "ash-", "ash ",
  "at-", "at ", "az-", "az ",
  "ad-", "ad ", "adh-", "adh ",
];

/**
 * Produces a stripped canonical slug for forgiving name comparisons.
 * Treats joined, hyphenated and separated forms equally:
 * e.g. "al-fatiha", "al fatiha", "alfatiha", "fatiha", "fatihah" -> "fatiha"
 */
export function toCanonicalSlug(text: string): string {
  if (!text) return "";
  let s = normalizeDigits(text).toLowerCase();

  // Handle Arabic script
  if (/[\u0600-\u06FF]/.test(s)) {
    s = normalizeArabicText(s).replace(/\s+/g, "");
    if (s.startsWith("ال") && s.length > 2) {
      s = s.slice(2);
    }
    return s;
  }

  // Handle Latin script
  s = normalizeLatinText(s);

  // Strip prefix with hyphen or space
  for (const prefix of LATIN_PREFIXES) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length);
      break;
    }
  }

  // Strip all non-alphanumeric characters (spaces, hyphens, apostrophes)
  s = s.replace(/[^a-z0-9]/g, "");

  // Strip joined "al" prefix if remaining length is sufficient
  if (s.startsWith("al") && s.length > 4) {
    s = s.slice(2);
  } else if (s.startsWith("el") && s.length > 4) {
    s = s.slice(2);
  }

  // Normalize transliterated ta marbuta ending ("fatihah" -> "fatiha", "baqarah" -> "baqara")
  if (s.endsWith("ah") && s.length > 3) {
    s = s.slice(0, -1);
  }

  return s;
}

/**
 * Calculates standard Damerau-Levenshtein distance between two strings,
 * supporting insertions, deletions, substitutions, and transpositions of adjacent characters.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition check (Damerau)
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[a.length][b.length];
}

/**
 * Conservative typo matcher based on query length:
 * - Query length < 4: no typo tolerance (0 edits allowed)
 * - Query length 4 to 6: max 1 edit
 * - Query length > 6: max 2 edits
 * Returns true only when distance is greater than 0 and within tolerance.
 */
export function isTypoMatch(query: string, candidate: string): boolean {
  const qSlug = toCanonicalSlug(query);
  const cSlug = toCanonicalSlug(candidate);

  if (!qSlug || !cSlug) return false;
  if (qSlug === cSlug) return false; // Exact match, not a typo

  const len = qSlug.length;
  if (len < 4) return false;

  const maxDist = len <= 6 ? 1 : 2;
  const dist = levenshteinDistance(qSlug, cSlug);

  return dist > 0 && dist <= maxDist;
}
