import { normalizeArabic } from "./checks";

// Keyword search over the verses we are allowed to use. The AI never picks verses
// from memory; it only sees what this search returns. Pure code, tested in tests/search.test.ts.

export type SearchDoc = { key: string; arabicPlain: string; en: string; de: string };

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

// Words too common to mean anything on their own.
const STOP = new Set(["allah", "god", "gott", "people", "those", "which", "their", "there", "these", "allen", "diese", "welch", "haben", "werde", "الله", "الذي", "الذين", "كان"]);

function tokens(text: string): string[] {
  const ar = (normalizeArabic(text).match(/[ء-ي]+/g) ?? []).filter((w) => w.length >= 3).map(arabicStem);
  const lat = (text.toLowerCase().match(/[a-zäöüß]+/g) ?? []).filter((w) => w.length >= 4).map(latinStem);
  return [...ar, ...lat].filter((t) => !STOP.has(t));
}

type Indexed = { key: string; terms: Set<string> };

let cache: { docs: SearchDoc[]; index: Indexed[]; df: Map<string, number> } | null = null;

function indexOf(docs: SearchDoc[]) {
  if (cache?.docs === docs) return cache;
  const index = docs.map((d) => ({ key: d.key, terms: new Set(tokens(`${d.arabicPlain} ${d.en} ${d.de}`)) }));
  const df = new Map<string, number>();
  for (const d of index) for (const t of d.terms) df.set(t, (df.get(t) ?? 0) + 1);
  cache = { docs, index, df };
  return cache;
}

export const SEARCH_RULES = {
  // A verse must match at least this many different search words, so one stray word is not enough.
  minDistinctMatches: 2,
  limit: 8,
};

export function searchVerses(docs: SearchDoc[], keywords: string[]): string[] {
  const { index, df } = indexOf(docs);
  const query = new Set(keywords.flatMap(tokens));
  if (query.size === 0) return [];

  return index
    .map((d) => {
      let score = 0;
      let matched = 0;
      for (const q of query) {
        if (!d.terms.has(q)) continue;
        matched++;
        // Rarer words count more (inverse document frequency).
        score += Math.log(1 + index.length / (df.get(q) ?? 1));
      }
      return { key: d.key, score, matched };
    })
    .filter((x) => x.matched >= SEARCH_RULES.minDistinctMatches)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_RULES.limit)
    .map((x) => x.key);
}
