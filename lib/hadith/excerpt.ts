import { normalizeArabic } from "@/lib/ask/checks";

const BEFORE = 80;
const AFTER = 130;
const FALLBACK = 180;

/**
 * A short excerpt of the ORIGINAL Arabic hadith around the first matched word, with matched words wrapped
 * in ⟦ ⟧. The search runs on normalised text (no diacritics), but what the visitor reads is the stored
 * original, letter for letter: normalisation is used only to find the places, then mapped back.
 * When no word is found in the text itself (the match was in the chapter heading), the excerpt is its
 * beginning without highlighting.
 */
export function originalExcerpt(original: string, query: string): string {
  const words = [...new Set(normalizeArabic(query).match(/[ء-ي]+/g) ?? [])].filter((w) => w.length >= 2);

  // Normalised text, and for each of its letters the position of the original letter it came from.
  let normal = "";
  const origin: number[] = [];
  for (let i = 0; i < original.length; i++) {
    const n = normalizeArabic(original[i]);
    for (const ch of n) { normal += ch; origin.push(i); }
  }

  const matches: [number, number][] = [];
  if (words.length > 0) {
    const pattern = new RegExp(`(?<![ء-ي])(?:${words.join("|")})(?![ء-ي])`, "g");
    for (const m of normal.matchAll(pattern)) {
      const start = origin[m.index!];
      let end = origin[m.index! + m[0].length - 1] + 1;
      while (end < original.length && normalizeArabic(original[end]) === "") end++; // keep the last letter's diacritics
      matches.push([start, end]);
    }
  }

  if (matches.length === 0) {
    const head = original.slice(0, FALLBACK);
    return original.length > FALLBACK ? `${head.slice(0, head.lastIndexOf(" ") > 40 ? head.lastIndexOf(" ") : FALLBACK)}…` : head;
  }

  let from = Math.max(0, matches[0][0] - BEFORE);
  let to = Math.min(original.length, matches[0][0] + AFTER);
  if (from > 0) { const space = original.indexOf(" ", from); if (space !== -1 && space < matches[0][0]) from = space + 1; }
  if (to < original.length) { const space = original.lastIndexOf(" ", to); if (space > matches[0][1]) to = space; }

  let out = from > 0 ? "…" : "";
  let at = from;
  for (const [s, e] of matches) {
    if (e <= from || s >= to) continue;
    const start = Math.max(s, from), end = Math.min(e, to);
    out += original.slice(at, start) + "⟦" + original.slice(start, end) + "⟧";
    at = end;
  }
  out += original.slice(at, to);
  return to < original.length ? `${out}…` : out;
}
