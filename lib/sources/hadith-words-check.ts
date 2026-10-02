import { asciiUmlauts } from "@/lib/ask/checks";
import { splitHadith } from "./hadith-split";

// Checks one translated item of the words-only translation job before it may be imported
// (scripts/import-hadith-words.ts). Pure, so it is tested (tests/hadith-split.test.ts).

export type HadithWordsTranslated = { id: string; words: string; en?: string; de?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_CHARS = 4000;

/** Problems with one item, given the hadith's current stored text (null when the row is missing). Empty = fine. */
export function hadithWordsProblems(item: HadithWordsTranslated, storedText: string | null): string[] {
  const problems: string[] = [];
  if (!UUID.test(item.id)) return ["bad id"];
  if (storedText === null) return ["hadith not found"];
  const split = splitHadith(storedText);
  // The words must still be exactly the words of today's certain split (the text may have been refreshed).
  if (!split) problems.push("split no longer certain");
  else if (split.words.trim() !== item.words) problems.push("words changed since export");
  for (const lang of ["en", "de"] as const) {
    const text = item[lang];
    if (text === undefined) continue;
    if (typeof text !== "string" || !text.trim()) problems.push(`${lang}: empty`);
    else if (text.length > MAX_CHARS) problems.push(`${lang}: too long`);
    else if (/[<>]/.test(text)) problems.push(`${lang}: markup`);
    else if (/[ء-ي]/.test(text)) problems.push(`${lang}: Arabic letters in the translation`);
    else if (/^\s*["“„'«]|["”“'»]\s*$/.test(text)) problems.push(`${lang}: wrapped in quotation marks`);
    else if (lang === "de" && asciiUmlauts(text)) problems.push("de: ae/oe/ue instead of real umlauts");
  }
  if (item.en === undefined && item.de === undefined) problems.push("no translation");
  return problems;
}
