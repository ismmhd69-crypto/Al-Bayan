/**
 * Forgiving Hadith search service.
 * Supports:
 * - Collection names and aliases (Bukhari, Muslim, Sahih al-Bukhari, Sahih Muslim, Bukhary, Arabic variants)
 * - References with collection (e.g., "Muslim 8a", "muslim 8 a", "Sahih Muslim 1921b", "Bukhari 1", "البخاري ١")
 * - Number-alone queries presenting clear choices for both Bukhari and Muslim (never silently assuming Bukhari)
 * - Exact suffix preservation (never fuzzy-matching numbers or changing reference identity)
 * - Conservative typo suggestions for mistyped collection names
 */

import type { Locale } from "@/lib/i18n";
import type { HadithCollectionId } from "./types";
import {
  isTypoMatch,
  normalizeArabicText,
  normalizeDigits,
  normalizeLatinText,
  toCanonicalSlug,
} from "@/lib/search/normalization";

export type HadithSearchResultType = "collection" | "hadith" | "choice" | "suggestion";

export interface HadithSearchResult {
  id: string;
  type: HadithSearchResultType;
  collectionId?: HadithCollectionId;
  reference?: string;
  title: string;
  subtitle?: string;
  targetHref: string;
  rank: 1 | 2 | 3 | 4;
  isTypoSuggestion?: boolean;
  suggestedQuery?: string;
}

export interface CollectionDefinition {
  id: HadithCollectionId;
  nameEnglish: string;
  nameArabic: string;
  aliases: string[];
}

export const COLLECTIONS: CollectionDefinition[] = [
  {
    id: "bukhari",
    nameEnglish: "Sahih al-Bukhari",
    nameArabic: "صحيح البخاري",
    aliases: [
      "bukhari",
      "al-bukhari",
      "al bukhari",
      "albukhari",
      "sahih bukhari",
      "sahih al-bukhari",
      "sahih al bukhari",
      "sahih albukhari",
      "bukhary",
      "sahih bukhary",
      "البخاري",
      "بخاري",
      "صحيح البخاري",
      "صحيح بخاري",
    ],
  },
  {
    id: "muslim",
    nameEnglish: "Sahih Muslim",
    nameArabic: "صحيح مسلم",
    aliases: [
      "muslim",
      "moslem",
      "sahih muslim",
      "sahih-muslim",
      "sahih al-muslim",
      "al-muslim",
      "al muslim",
      "almuslim",
      "صحيح مسلم",
      "مسلم",
    ],
  },
];

/**
 * Normalizes a hadith reference string:
 * - Converts Arabic/Persian digits
 * - Translates common Arabic letter suffixes (أ->a, ب->b, etc.)
 * - Strips extra spaces between digits and suffixes (e.g., "8 a" -> "8a")
 */
export function normalizeHadithReference(rawRef: string): string | null {
  if (!rawRef) return null;

  let ref = normalizeDigits(rawRef).trim().toLowerCase();

  // Map Arabic suffix letters to latin equivalent
  ref = ref
    .replace(/\s*[\u0623\u0625\u0622\u0627]\s*$/i, "a") // أ, إ, آ, ا
    .replace(/\s*\u0628\s*$/i, "b")                       // ب
    .replace(/\s*\u062C\s*$/i, "c")                       // ج
    .replace(/\s*\u062F\s*$/i, "d")                       // د
    .replace(/\s*[\u0647\u0647\u0640]\s*$/i, "e");        // ه, هـ

  // Remove spaces between numbers and latin suffix (e.g. "8 a" -> "8a", "1921 b" -> "1921b")
  ref = ref.replace(/(\d+)\s*[-_]?\s*([a-z]+)$/i, "$1$2");

  // Validate format: 1 to 5 digits followed by optional 1-3 letters
  if (!/^\d{1,5}[a-z]{0,3}$/i.test(ref)) {
    return null;
  }

  return ref;
}

/**
 * Parses search query to identify collection name and/or reference.
 */
export function parseHadithQuery(query: string): {
  collectionId: HadithCollectionId | null;
  reference: string | null;
  isTypoCollection: boolean;
  typoTargetCollection: HadithCollectionId | null;
  isPureCollectionQuery: boolean;
} {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      collectionId: null,
      reference: null,
      isTypoCollection: false,
      typoTargetCollection: null,
      isPureCollectionQuery: false,
    };
  }

  const normQuery = normalizeLatinText(trimmed);
  const qSlug = toCanonicalSlug(trimmed);

  // 1. Check if the query is solely a collection name
  for (const col of COLLECTIONS) {
    for (const alias of col.aliases) {
      if (
        alias.toLowerCase() === trimmed.toLowerCase() ||
        normalizeArabicText(alias) === normalizeArabicText(trimmed) ||
        toCanonicalSlug(alias) === qSlug
      ) {
        return {
          collectionId: col.id,
          reference: null,
          isTypoCollection: false,
          typoTargetCollection: null,
          isPureCollectionQuery: true,
        };
      }
    }
  }

  // 2. Check if query starts or ends with a collection name plus a reference
  for (const col of COLLECTIONS) {
    for (const alias of col.aliases) {
      const aSlug = toCanonicalSlug(alias);
      const aLatin = normalizeLatinText(alias);
      const aArabic = normalizeArabicText(alias);

      // Check if alias appears at the start (e.g. "Muslim 8a" or "صحيح البخاري 1")
      const startsLatin = normQuery.startsWith(aLatin + " ") || normQuery.startsWith(aLatin + "-");
      const startsArabic = normalizeArabicText(trimmed).startsWith(aArabic + " ");

      if (startsLatin || startsArabic) {
        const remainder = startsLatin
          ? normQuery.slice(aLatin.length).trim()
          : normalizeArabicText(trimmed).slice(aArabic.length).trim();
        const ref = normalizeHadithReference(remainder);
        if (ref) {
          return {
            collectionId: col.id,
            reference: ref,
            isTypoCollection: false,
            typoTargetCollection: null,
            isPureCollectionQuery: false,
          };
        }
      }
    }
  }

  // 3. Check for pure reference (number alone, e.g. "8a", "1", "1921b", "١")
  const pureRef = normalizeHadithReference(trimmed);
  if (pureRef) {
    return {
      collectionId: null,
      reference: pureRef,
      isTypoCollection: false,
      typoTargetCollection: null,
      isPureCollectionQuery: false,
    };
  }

  // 4. Check for typo in collection name with or without reference (e.g. "musilm 8a", "musilm 8 a", "bukari")
  // Extract trailing reference, supporting both single token ("8a") and spaced suffix ("8 a", "1921 b")
  let potentialRef: string | null = null;
  let colPart: string = trimmed;

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    // Check if the last two parts form a reference (e.g. "8 a" or "1921 b")
    const twoPartCandidate = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    const normalizedTwoPart = normalizeHadithReference(twoPartCandidate);
    if (normalizedTwoPart) {
      potentialRef = normalizedTwoPart;
      colPart = parts.slice(0, -2).join(" ");
    }
  }

  if (!potentialRef && parts.length >= 2) {
    // Check if the single last part is a reference (e.g. "8a" or "1")
    const onePartCandidate = parts[parts.length - 1];
    const normalizedOnePart = normalizeHadithReference(onePartCandidate);
    if (normalizedOnePart) {
      potentialRef = normalizedOnePart;
      colPart = parts.slice(0, -1).join(" ");
    }
  }

  if (potentialRef && colPart) {
    const colSlug = toCanonicalSlug(colPart);
    for (const col of COLLECTIONS) {
      for (const alias of col.aliases) {
        if (isTypoMatch(colSlug, toCanonicalSlug(alias))) {
          return {
            collectionId: null,
            reference: potentialRef,
            isTypoCollection: true,
            typoTargetCollection: col.id,
            isPureCollectionQuery: false,
          };
        }
      }
    }
  } else {
    // Single word typo of collection alone (e.g. "musilm", "bukari")
    for (const col of COLLECTIONS) {
      for (const alias of col.aliases) {
        if (isTypoMatch(qSlug, toCanonicalSlug(alias))) {
          return {
            collectionId: null,
            reference: null,
            isTypoCollection: true,
            typoTargetCollection: col.id,
            isPureCollectionQuery: true,
          };
        }
      }
    }
  }

  return {
    collectionId: null,
    reference: null,
    isTypoCollection: false,
    typoTargetCollection: null,
    isPureCollectionQuery: false,
  };
}

/**
 * Searches Hadith collections and references with forgiving normalization,
 * clear choices for standalone numbers, and conservative typo suggestions.
 */
export function searchHadith(query: string, lang: Locale): HadithSearchResult[] {
  const qTrimmed = query.trim();
  if (!qTrimmed) return [];

  const parsed = parseHadithQuery(qTrimmed);
  const results: HadithSearchResult[] = [];

  // Case A: Pure collection query (e.g. "muslim", "sahih al-bukhari", "صحيح مسلم")
  if (parsed.isPureCollectionQuery && parsed.collectionId) {
    const col = COLLECTIONS.find((c) => c.id === parsed.collectionId)!;
    const title = lang === "ar" ? col.nameArabic : col.nameEnglish;
    const subtitle =
      lang === "ar" ? `تصفح كتب وأحاديث ${col.nameArabic}` : `Browse all books and hadiths of ${col.nameEnglish}`;

    results.push({
      id: `col-${col.id}`,
      type: "collection",
      collectionId: col.id,
      title,
      subtitle,
      targetHref: `/${lang}/hadith/${col.id}`,
      rank: 1,
    });
    return results;
  }

  // Case B: Collection + Reference (e.g. "Muslim 8a", "Bukhari 1", "البخاري ١")
  if (parsed.collectionId && parsed.reference) {
    const col = COLLECTIONS.find((c) => c.id === parsed.collectionId)!;
    const colTitle = lang === "ar" ? col.nameArabic : col.nameEnglish;
    const title =
      lang === "ar"
        ? `${colTitle}: الحديث ${parsed.reference}`
        : `${colTitle}: Hadith ${parsed.reference}`;

    const subtitle =
      lang === "ar"
        ? `فتح الحديث ${parsed.reference} مباشرة في ${colTitle}`
        : `Open Hadith ${parsed.reference} directly in ${colTitle}`;

    results.push({
      id: `hadith-${col.id}-${parsed.reference}`,
      type: "hadith",
      collectionId: col.id,
      reference: parsed.reference,
      title,
      subtitle,
      targetHref: `/${lang}/hadith/${col.id}/${encodeURIComponent(parsed.reference)}`,
      rank: 1,
    });
    return results;
  }

  // Case C: Standalone reference (number alone, e.g. "8a", "1", "١")
  // Show explicit choices for BOTH Bukhari and Muslim. Never assume Bukhari!
  if (!parsed.collectionId && parsed.reference && !parsed.isTypoCollection) {
    for (const col of COLLECTIONS) {
      const colTitle = lang === "ar" ? col.nameArabic : col.nameEnglish;
      const title =
        lang === "ar"
          ? `${colTitle}: الحديث ${parsed.reference}`
          : `${colTitle}: Hadith ${parsed.reference}`;

      const subtitle =
        lang === "ar"
          ? `عرض الحديث ${parsed.reference} في ${colTitle}`
          : `View Hadith ${parsed.reference} in ${colTitle}`;

      results.push({
        id: `choice-${col.id}-${parsed.reference}`,
        type: "choice",
        collectionId: col.id,
        reference: parsed.reference,
        title,
        subtitle,
        targetHref: `/${lang}/hadith/${col.id}/${encodeURIComponent(parsed.reference)}`,
        rank: 2,
      });
    }
    return results;
  }

  // Case D: Typo in collection name with reference (e.g. "musilm 8a")
  if (parsed.isTypoCollection && parsed.typoTargetCollection && parsed.reference) {
    const col = COLLECTIONS.find((c) => c.id === parsed.typoTargetCollection)!;
    const colTitle = lang === "ar" ? col.nameArabic : col.nameEnglish;
    const suggested = `${col.nameEnglish} ${parsed.reference}`;

    results.push({
      id: `suggestion-${col.id}-${parsed.reference}`,
      type: "suggestion",
      collectionId: col.id,
      reference: parsed.reference,
      title: `${colTitle}: Hadith ${parsed.reference}`,
      subtitle:
        lang === "ar"
          ? `هل تقصد ${colTitle}: الحديث ${parsed.reference}؟`
          : `Did you mean ${suggested}?`,
      targetHref: `/${lang}/hadith/${col.id}/${encodeURIComponent(parsed.reference)}`,
      rank: 4,
      isTypoSuggestion: true,
      suggestedQuery: suggested,
    });
    return results;
  }

  // Case E: Typo in collection name alone (e.g. "musilm", "bukari")
  if (parsed.isTypoCollection && parsed.typoTargetCollection && !parsed.reference) {
    const col = COLLECTIONS.find((c) => c.id === parsed.typoTargetCollection)!;
    const colTitle = lang === "ar" ? col.nameArabic : col.nameEnglish;

    results.push({
      id: `suggestion-${col.id}`,
      type: "suggestion",
      collectionId: col.id,
      title: colTitle,
      subtitle:
        lang === "ar"
          ? `هل تقصد مجموعة ${colTitle}؟`
          : `Did you mean ${col.nameEnglish}?`,
      targetHref: `/${lang}/hadith/${col.id}`,
      rank: 4,
      isTypoSuggestion: true,
      suggestedQuery: col.nameEnglish,
    });
    return results;
  }

  return results;
}

