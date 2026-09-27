import type { Verse } from "@/lib/sources/quran";

// Keyword search over the verses we are allowed to use. The AI never picks verses
// from memory; it only sees what this search returns.

// For matching only: strip Arabic diacritics and unify letter variants. Stored text is never changed.
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

const ARABIC_PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال", "و", "ف", "ب", "ل"];
const ARABIC_SUFFIXES = ["هما", "كم", "هم", "هن", "نا", "ها", "ون", "ين", "ات", "ان", "ه", "ي", "ك"];

function arabicStem(word: string): string {
  let w = word;
  for (const p of ARABIC_PREFIXES) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  for (const s of ARABIC_SUFFIXES) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  return w;
}

// Crude but language-neutral: compare the first 5 letters of Latin words.
const latinStem = (w: string) => w.slice(0, 5);

function tokens(text: string, arabic: boolean): string[] {
  const t = arabic ? normalizeArabic(text) : text.toLowerCase();
  return (t.match(arabic ? /[ء-ي]+/g : /[a-zäöüß]+/g) ?? [])
    .filter((w) => w.length >= 3)
    .map(arabic ? arabicStem : latinStem);
}

type Doc = { verse: Verse; terms: Set<string> };

let index: { verses: Verse[]; docs: Doc[]; df: Map<string, number> } | null = null;

function buildIndex(verses: Verse[]) {
  if (index?.verses === verses) return index;
  const docs = verses.map((verse) => ({
    verse,
    terms: new Set([
      ...tokens(verse.arabicPlain, true),
      ...tokens(verse.translations.en, false),
      ...tokens(verse.translations.de, false),
    ]),
  }));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.terms) df.set(t, (df.get(t) ?? 0) + 1);
  index = { verses, docs, df };
  return index;
}

export function searchVerses(verses: Verse[], keywords: string[], limit = 12): Verse[] {
  const { docs, df } = buildIndex(verses);
  const query = new Set(keywords.flatMap((k) => [...tokens(k, true), ...tokens(k, false)]));
  if (query.size === 0) return [];

  const scored = docs
    .map((d) => {
      let score = 0;
      // Rarer words count more (inverse document frequency).
      for (const q of query) if (d.terms.has(q)) score += Math.log(1 + docs.length / (df.get(q) ?? 1));
      return { verse: d.verse, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.verse);
}
