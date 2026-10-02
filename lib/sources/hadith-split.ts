import { normalizeArabic } from "@/lib/ask/checks";
import { isContinuationHadith } from "./hadith-rules";
import { maskQuranTags, quranMarkupSpans } from "./hadith-markup";

// Display-only split of a stored Sunnah.com hadith into its chain of narrators and the quoted words.
// Pure functions with no network access (tests/hadith-split.test.ts).
//
// Mo's rules (2026-10-02): split only when it is certain, never guess, never change a character.
// Sunnah.com marks spoken words with U+200F, a straight double quote, U+200F. A text is split only
// when it has exactly one such pair and no other double quote (the quotes inside Sunnah.com's
// [quran sura="..."] tags do not count; a tag with its verse must sit wholly on one side of a quote mark). The pieces always rejoin to the
// original text (checked here and again on the page); otherwise the card shows the full text.
// Search, evidence selection, AI checks and quote verification never see the split.

export const QUOTE_MARK = "‏\"‏";

export type HadithSpeaker = "prophet" | "other";

/** chain + open + words + close + tail is exactly the stored text. */
export type HadithSplit = {
  chain: string;
  open: string;
  words: string;
  close: string;
  tail: string;
  speaker: HadithSpeaker;
};

export type HadithSplitReason =
  | "no_quote"
  | "several_quotes"
  | "stray_quote"
  | "continuation"
  | "refers_to_other_hadith"
  | "markup_crosses_quote"
  | "empty_chain"
  | "empty_words"
  | "not_exact";

export type HadithSplitResult = { split: HadithSplit; reason: null } | { split: null; reason: HadithSplitReason };

const ARABIC_LETTER = /[ء-ي]/;

const count = (text: string, part: string) => text.split(part).length - 1;

/** True when the pieces give back the original text, character for character. */
export function splitRejoins(split: Pick<HadithSplit, "chain" | "open" | "words" | "close" | "tail">, arabic: string): boolean {
  return split.chain + split.open + split.words + split.close + split.tail === arabic;
}

/** True when the text after the closing quote carries words (the narration goes on), not just punctuation. */
export const tailHasWords = (tail: string) => ARABIC_LETTER.test(tail);

// The lead-in, without diacritics, punctuation or the ﷺ sign, single spaces.
function leadIn(chain: string): string {
  return normalizeArabic(chain).replace(/[^ء-ي\s]/g, " ").replace(/\s+/g, " ").trim();
}

// A quote that is only an addition to, or the meaning of, another report ("وزاد", "بمعنى حديث ...")
// is a fragment: it is not shown as the hadith's words.
const REFERS_TO_OTHER = /(^| )(وزاد|زاد|بمعني حديث|بمثل حديث|بنحو حديث|نحو حديث|بمعناه|بنحوه|بمثله)( |$)/;

const NAME = "(?:النبي|رسول الله|نبي الله|ابو القاسم|ابا القاسم)";
const HONORIFIC = "(?: صلي الله عليه وسلم)?";
// "عن النبي ﷺ قال", "سمعت رسول الله ﷺ يقول", "أن رسول الله ﷺ قال", "كان النبي ﷺ يقول".
// The word before the name must make him the subject; "سأل النبي ﷺ فقال" (someone asked him) never matches.
const NAME_THEN_VERB = new RegExp(`(?:^| )(?:عن|سمعت|سمعنا|سمع|ان|فان|كان|يبلغ به) ${NAME}${HONORIFIC} (?:انه )?(?:قال|يقول)$`);
// "قال رسول الله ﷺ", "فقال النبي ﷺ", "وقال رسول الله ﷺ", "قال لنا رسول الله ﷺ", "قال أبو القاسم ﷺ".
const VERB_THEN_NAME = new RegExp(`(?:^| )(?:قال|فقال|وقال|يقول) (?:(?:لي|لنا|له|لها|لهم) )?${NAME}${HONORIFIC}$`);
// "... عن أبي هريرة عن النبي ﷺ" straight before the quote: the report is from him.
const FROM_NAME = new RegExp(`(?:^| )(?:عن|يبلغ به) ${NAME}${HONORIFIC}$`);

/** "prophet" only when the words right before the quote clearly name the Prophet as the speaker. */
export function speakerOf(chain: string): HadithSpeaker {
  const lead = leadIn(chain);
  return NAME_THEN_VERB.test(lead) || VERB_THEN_NAME.test(lead) || FROM_NAME.test(lead) ? "prophet" : "other";
}

export function analyseHadithSplit(arabic: string): HadithSplitResult {
  // Counted and located on a copy with the Quran tags blanked (same length); the pieces come from the original.
  const masked = maskQuranTags(arabic);
  const quotes = count(masked, "\"");
  const marked = count(masked, QUOTE_MARK);
  if (quotes === 0) return { split: null, reason: "no_quote" };
  if (marked !== quotes) return { split: null, reason: "stray_quote" };
  if (marked > 2) return { split: null, reason: "several_quotes" };
  if (marked !== 2) return { split: null, reason: "stray_quote" };
  if (isContinuationHadith(arabic)) return { split: null, reason: "continuation" };

  const start = masked.indexOf(QUOTE_MARK);
  const end = masked.indexOf(QUOTE_MARK, start + QUOTE_MARK.length);
  const crosses = (at: number) => quranMarkupSpans(arabic).some(([a, b]) => at + QUOTE_MARK.length > a && at < b);
  if (crosses(start) || crosses(end)) return { split: null, reason: "markup_crosses_quote" };
  const split: HadithSplit = {
    chain: arabic.slice(0, start),
    open: QUOTE_MARK,
    words: arabic.slice(start + QUOTE_MARK.length, end),
    close: QUOTE_MARK,
    tail: arabic.slice(end + QUOTE_MARK.length),
    speaker: "other",
  };
  if (!ARABIC_LETTER.test(split.chain)) return { split: null, reason: "empty_chain" };
  if (!ARABIC_LETTER.test(split.words)) return { split: null, reason: "empty_words" };
  if (REFERS_TO_OTHER.test(leadIn(split.chain))) return { split: null, reason: "refers_to_other_hadith" };
  if (!splitRejoins(split, arabic)) return { split: null, reason: "not_exact" };
  return { split: { ...split, speaker: speakerOf(split.chain) }, reason: null };
}

/** The split for display, or null when it is not certain (the card then shows the full text). */
export function splitHadith(arabic: string): HadithSplit | null {
  return analyseHadithSplit(arabic).split;
}

/** Kill switch: HADITH_SPLIT=off shows every hadith as the full-text card. On by default. */
export function hadithSplitEnabled(value: string | undefined = process.env.HADITH_SPLIT): boolean {
  return (value ?? "").trim().toLowerCase() !== "off";
}

/**
 * Where a transmitter's or compiler's trailing comment starts (the optional `tail_start` of the marking
 * job's mark files), or null when the value is not usable. Valid only when it has Arabic letters, occurs
 * exactly once in the text, starts at a word boundary, and starts at or after `wordsEnd` (the end of the
 * highlighted words), so the comment can never be shown inside the "The Prophet ﷺ said" box.
 * Not wired into Ask by this job: the marks are AI-assisted and this job's splits are rule based only.
 */
export function tailStartIndex(arabic: string, tailStart: string | null | undefined, wordsEnd: number): number | null {
  if (typeof tailStart !== "string" || !ARABIC_LETTER.test(tailStart)) return null;
  if (count(arabic, tailStart) !== 1) return null;
  const at = arabic.indexOf(tailStart);
  if (at < wordsEnd || at >= arabic.length) return null;
  if (at > 0 && /[ء-يٱ]/.test(arabic[at - 1])) return null;
  return at;
}

/** The tail split for display: its leading punctuation (shown right after the words) and the rest. */
export function tailParts(tail: string): { lead: string; rest: string } {
  const lead = tail.match(/^[^ء-ي]*/)![0];
  return { lead, rest: tail.slice(lead.length) };
}
