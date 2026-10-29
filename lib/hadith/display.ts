import { cleanHadithMarkup } from "@/lib/sources/hadith-markup";

/**
 * Converts known Sunnah.com display markup without changing the saved source text.
 * Only supported tags are handled. Unknown angle-bracket text is kept for review.
 */
export function cleanHadithDisplayText(source: string): string {
  const text = source
    .replace(/&gt;br&gt;/gi, "\n")
    .replace(/<\/?p(?:\s[^<>]*?)?\s*\/?>/gi, "\n")
    .replace(/<br\b[^<>]*\/?>/gi, "\n")
    // These wrappers carry no text needed by the reader. Their child text and references stay intact.
    .replace(/<\/?(?:a|span)\b[^<>]*>/gi, "")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return cleanHadithMarkup(text);
}

/** A plain-text form for titles and labels that are not rendered with inline formatting. */
export function cleanHadithTitle(source: string): string {
  return hadithTextForAttribute(cleanHadithDisplayText(source));
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  quot: '"',
};

/** Decodes common named and numeric entities inside a React text node. */
export function decodeHadithEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, name: string) => {
    if (name[0] !== "#") return NAMED_ENTITIES[name.toLowerCase()] ?? entity;

    const codePoint = name[1]?.toLowerCase() === "x"
      ? Number.parseInt(name.slice(2), 16)
      : Number.parseInt(name.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      return entity;
    }
    return String.fromCodePoint(codePoint);
  });
}

/** Plain-text variant for attributes such as browser tooltips. */
export function hadithTextForAttribute(text: string): string {
  return decodeHadithEntities(text.replace(/<\/?(?:i|em|b|strong)\b[^<>]*>/gi, ""));
}
