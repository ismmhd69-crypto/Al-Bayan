// Display-only cleaner for Sunnah.com's Quran markup inside stored hadith texts and their translations:
//   [quran sura="6" aya_start="82" aya_end="82"]{‏ الَّذِينَ آمَنُوا ... ‏}‏
// becomes the verse in its braces followed by the reference: {‏ الَّذِينَ آمَنُوا ... ‏} (6:82).
// The stored text is never changed: search, evidence selection, AI checks, quote verification and the
// chain/words split all use the original text. Pure and browser-safe (tests/hadith-split.test.ts).

/** The tag itself. Only this exact form occurs in the library (1,357 tags in 956 hadith, 2026-10-02). */
export const QURAN_TAG = /\[quran sura="(\d{1,3})" aya_start="(\d{1,3})" aya_end="(\d{1,3})"\]/g;
// The tag, then (after optional U+200F marks or spaces) the verse in braces with no brace inside.
const TAG_WITH_VERSE = /\[quran sura="(\d{1,3})" aya_start="(\d{1,3})" aya_end="(\d{1,3})"\]([‏\s]*\{[^{}]*\})/g;

const reference = (sura: string, start: string, end: string) => (start === end ? `(${sura}:${start})` : `(${sura}:${start}-${end})`);

/** Text for display: tags removed, verse text kept as it is, reference added after it. */
export function cleanHadithMarkup(text: string): string {
  if (!text.includes("[quran")) return text;
  return text
    .replace(TAG_WITH_VERSE, (_, sura: string, start: string, end: string, verse: string) => `${verse} ${reference(sura, start, end)}`)
    // A tag without a well-formed verse after it: the reference stands where the tag was.
    .replace(QURAN_TAG, (_, sura: string, start: string, end: string) => `${reference(sura, start, end)} `);
}

/** Start and end (exclusive) of every tag together with its verse, in the original text. */
export function quranMarkupSpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const m of text.matchAll(TAG_WITH_VERSE)) spans.push([m.index!, m.index! + m[0].length]);
  for (const m of text.matchAll(QURAN_TAG)) {
    if (!spans.some(([a, b]) => m.index! >= a && m.index! < b)) spans.push([m.index!, m.index! + m[0].length]);
  }
  return spans;
}

/** The text with every tag blanked to spaces (same length), so quote marks inside tags are not counted. */
export function maskQuranTags(text: string): string {
  return text.replace(QURAN_TAG, (tag) => " ".repeat(tag.length));
}
