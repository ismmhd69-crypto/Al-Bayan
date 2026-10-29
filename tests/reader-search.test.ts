import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  isTypoMatch,
  levenshteinDistance,
  normalizeArabicText,
  normalizeDigits,
  normalizeLatinText,
  toCanonicalSlug,
} from "@/lib/search/normalization";
import {
  parseVerseReference,
  searchQuran,
  type QuranSearchResult,
} from "@/lib/quran/search";
import {
  normalizeHadithReference,
  parseHadithQuery,
  searchHadith,
} from "@/lib/hadith/search";
import { SurahIndex } from "@/components/quran/SurahIndex";
import { HadithIndex } from "@/components/hadith/HadithIndex";
import { getDictionary } from "@/lib/i18n";
import type { SurahSummary } from "@/lib/quran/types";
import type { HadithCollectionSummary } from "@/lib/hadith/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ lang: "en" }),
  notFound: () => {
    const err = new Error("NEXT_NOT_FOUND");
    (err as unknown as { digest: string }).digest = "NEXT_HTTP_ERROR_FALLBACK;404";
    throw err;
  },
}));

// Mock hadith service for route testing
vi.mock("@/lib/hadith/service", () => ({
  getCollection: vi.fn(),
  getHadithByReference: vi.fn(),
  getAdjacentHadiths: vi.fn(),
}));

// Mock chapters fixture for Quran tests
const mockChapters: SurahSummary[] = [
  {
    id: 1,
    nameSimple: "Al-Fatihah",
    nameComplex: "Al-Fāti\u1E25ah",
    nameArabic: "الفاتحة",
    versesCount: 7,
    revelationPlace: "makkah",
    revelationOrder: 5,
    bismillahPre: false,
    translatedName: "The Opener",
  },
  {
    id: 2,
    nameSimple: "Al-Baqarah",
    nameComplex: "Al-Baqarah",
    nameArabic: "البقرة",
    versesCount: 286,
    revelationPlace: "madinah",
    revelationOrder: 87,
    bismillahPre: true,
    translatedName: "The Cow",
  },
  {
    id: 3,
    nameSimple: "Ali 'Imran",
    nameComplex: "\u0100li 'Imr\u0101n",
    nameArabic: "آل عمران",
    versesCount: 200,
    revelationPlace: "madinah",
    revelationOrder: 89,
    bismillahPre: true,
    translatedName: "Family of Imran",
  },
  {
    id: 36,
    nameSimple: "Ya-Sin",
    nameComplex: "Y\u0101-S\u012Bn",
    nameArabic: "يس",
    versesCount: 83,
    revelationPlace: "makkah",
    revelationOrder: 41,
    bismillahPre: true,
    translatedName: "Yaseen",
  },
  {
    id: 114,
    nameSimple: "An-Nas",
    nameComplex: "An-N\u0101s",
    nameArabic: "الناس",
    versesCount: 6,
    revelationPlace: "makkah",
    revelationOrder: 21,
    bismillahPre: true,
    translatedName: "Mankind",
  },
];

// Mock collections fixture for Hadith tests
const mockCollections: HadithCollectionSummary[] = [
  {
    id: "bukhari",
    name: "bukhari",
    nameEnglish: "Sahih al-Bukhari",
    nameArabic: "صحيح البخاري",
    shortIntro: "Authentic Bukhari",
    totalBooks: 97,
    totalHadith: 7563,
  },
  {
    id: "muslim",
    name: "muslim",
    nameEnglish: "Sahih Muslim",
    nameArabic: "صحيح مسلم",
    shortIntro: "Authentic Muslim",
    totalBooks: 56,
    totalHadith: 7500,
  },
];

describe("1. Normalisation and Slug Building", () => {
  it("normalizes Eastern Arabic-Indic and Persian digits to ASCII 0-9", () => {
    expect(normalizeDigits("٢:٢٥٥")).toBe("2:255");
    expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(normalizeDigits("حديث ١٩٢١")).toBe("حديث 1921");
  });

  it("normalizes Arabic diacritics, tatweel and alef variants", () => {
    expect(normalizeArabicText("الْفَاتِحَةُ")).toBe("الفاتحه");
    expect(normalizeArabicText("آلِ عِمْرَانَ")).toBe("ال عمران");
    expect(normalizeArabicText("إِبْرَاهِيم")).toBe("ابراهيم");
    expect(normalizeArabicText("يـس")).toBe("يس"); // tatweel stripped
    expect(normalizeArabicText("الضُّحَىٰ")).toBe("الضحي"); // alif maqsura & daggar alif
  });

  it("normalizes Latin text, hyphens, and fancy apostrophe variants", () => {
    expect(normalizeLatinText("Ali ‘Imran")).toBe("ali 'imran");
    expect(normalizeLatinText("Ali `Imran")).toBe("ali 'imran");
    expect(normalizeLatinText("Ali ’Imran")).toBe("ali 'imran");
    expect(normalizeLatinText("Sahih-Muslim")).toBe("sahih-muslim");
    expect(normalizeLatinText("Sahih–Muslim")).toBe("sahih-muslim"); // en-dash
    expect(normalizeLatinText("Sahih—Muslim")).toBe("sahih-muslim"); // em-dash
  });

  it("produces identical canonical slugs for separated, hyphenated, joined and transliteration variants", () => {
    // “al fatiha”, “al-fatiha”, “alfatiha”, “fatihah” and “fatiha” must all map to the same slug
    const targetSlug = toCanonicalSlug("Al-Fatihah");
    expect(toCanonicalSlug("al fatiha")).toBe(targetSlug);
    expect(toCanonicalSlug("al-fatiha")).toBe(targetSlug);
    expect(toCanonicalSlug("alfatiha")).toBe(targetSlug);
    expect(toCanonicalSlug("fatihah")).toBe(targetSlug);
    expect(toCanonicalSlug("fatiha")).toBe(targetSlug);

    // Baqarah variants
    expect(toCanonicalSlug("baqara")).toBe(toCanonicalSlug("Al-Baqarah"));
    expect(toCanonicalSlug("albaqara")).toBe(toCanonicalSlug("Al-Baqarah"));
    expect(toCanonicalSlug("al baqarah")).toBe(toCanonicalSlug("Al-Baqarah"));

    // Muslim variants
    expect(toCanonicalSlug("sahih-muslim")).toBe("sahihmuslim");
    expect(toCanonicalSlug("sahih muslim")).toBe("sahihmuslim");
  });

  it("measures edit distance accurately and detects small realistic typos", () => {
    expect(levenshteinDistance("fatiha", "fatihaa")).toBe(1);
    expect(levenshteinDistance("muslim", "musilm")).toBe(1); // 1 transposition
    expect(levenshteinDistance("bukhari", "bukari")).toBe(1);

    // Typo match rules
    expect(isTypoMatch("al fatihaa", "Al-Fatihah")).toBe(true);
    expect(isTypoMatch("musilm", "muslim")).toBe(true);
    expect(isTypoMatch("bukari", "bukhari")).toBe(true);

    // Short inputs must not produce fuzzy matches
    expect(isTypoMatch("al", "Al-Fatihah")).toBe(false);
    expect(isTypoMatch("mus", "muslim")).toBe(false);

    // Exact matches are not typos
    expect(isTypoMatch("muslim", "muslim")).toBe(false);

    // Completely unrelated words must not match
    expect(isTypoMatch("banana", "Al-Fatihah")).toBe(false);
    expect(isTypoMatch("telephone", "muslim")).toBe(false);
  });
});

describe("2. Quran Search", () => {
  const dict = getDictionary("en");

  it("finds Al-Fatihah from various everyday spellings and formatting", () => {
    const queries = ["al fatiha", "al-fatiha", "alfatiha", "fatihah", "fatiha", "الفاتحة", "فاتحه"];
    for (const q of queries) {
      const results = searchQuran(q, mockChapters, "en");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].surahId).toBe(1);
      expect(results[0].type).toBe("surah");
    }
  });

  it("suggests Al-Fatihah on small realistic typo without automatic navigation", () => {
    const results = searchQuran("al fatihaa", mockChapters, "en");
    expect(results.length).toBeGreaterThan(0);
    // Should contain a typo suggestion for Al-Fatihah
    const suggestion = results.find((r) => r.isTypoSuggestion && r.surahId === 1);
    expect(suggestion).toBeDefined();
    expect(suggestion?.rank).toBe(4);
    expect(suggestion?.subtitle).toContain("Did you mean Surah Al-Fatihah?");
  });

  it("parses and validates exact verse references against real bounds", () => {
    // 2:255 (Ayat al-Kursi) is valid (Surah 2 has 286 verses)
    expect(parseVerseReference("2:255")).toEqual({ surah: 2, verse: 255 });
    expect(parseVerseReference("2 : 255")).toEqual({ surah: 2, verse: 255 });
    expect(parseVerseReference("٢:٢٥٥")).toEqual({ surah: 2, verse: 255 });
    expect(parseVerseReference("سورة 2:255")).toEqual({ surah: 2, verse: 255 });

    // Boundary: Last verse of Surah 114 is 6
    expect(parseVerseReference("114:6")).toEqual({ surah: 114, verse: 6 });
    // Invalid verse: 114:7 does not exist
    expect(parseVerseReference("114:7")).toBeNull();
    // Invalid verse: 2:300 does not exist (Surah 2 has 286)
    expect(parseVerseReference("2:300")).toBeNull();
    // Invalid surah: 115:1 does not exist
    expect(parseVerseReference("115:1")).toBeNull();
  });

  it("produces direct verse jump results pointing to exact verse anchor", () => {
    const results = searchQuran("٢:٢٥٥", mockChapters, "en");
    expect(results.length).toBe(1);
    expect(results[0].type).toBe("verse");
    expect(results[0].surahId).toBe(2);
    expect(results[0].verseNumber).toBe(255);
    expect(results[0].targetHref).toBe("/en/quran/2#ayah-255");
    expect(results[0].rank).toBe(1);
  });

  it("resolves well-known passage aliases like Ayat al-Kursi directly to verse 2:255", () => {
    const results = searchQuran("ayat al-kursi", mockChapters, "en");
    expect(results.length).toBeGreaterThan(0);
    const verseMatch = results.find((r) => r.type === "verse" && r.surahId === 2 && r.verseNumber === 255);
    expect(verseMatch).toBeDefined();
    expect(verseMatch?.targetHref).toBe("/en/quran/2#ayah-255");
  });

  it("ranks exact surah number match first", () => {
    const results = searchQuran("2", mockChapters, "en");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].surahId).toBe(2);
    expect(results[0].rank).toBe(1);
  });

  it("does not produce matches for unrelated words", () => {
    const results = searchQuran("randomgibberishxyz", mockChapters, "en");
    expect(results.length).toBe(0);
  });

  // Table-driven Quran surah search queries
  const quranTable = [
    { query: "al fatiha", expectedSurahId: 1 },
    { query: "al-fatiha", expectedSurahId: 1 },
    { query: "alfatiha", expectedSurahId: 1 },
    { query: "fatihah", expectedSurahId: 1 },
    { query: "fatiha", expectedSurahId: 1 },
    { query: "baqara", expectedSurahId: 2 },
    { query: "baqarah", expectedSurahId: 2 },
    { query: "the cow", expectedSurahId: 2 },
    { query: "yasin", expectedSurahId: 36 },
    { query: "ya-sin", expectedSurahId: 36 },
    { query: "yaseen", expectedSurahId: 36 },
    { query: "ali 'imran", expectedSurahId: 3 },
    { query: "aal imran", expectedSurahId: 3 },
    { query: "an-nas", expectedSurahId: 114 },
    { query: "mankind", expectedSurahId: 114 },
  ];

  for (const { query, expectedSurahId } of quranTable) {
    it(`resolves "${query}" to Surah ${expectedSurahId}`, () => {
      const results = searchQuran(query, mockChapters, "en");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].surahId).toBe(expectedSurahId);
    });
  }
});

describe("3. Hadith Search", () => {
  it("normalizes hadith references and preserves letter suffixes", () => {
    expect(normalizeHadithReference("8a")).toBe("8a");
    expect(normalizeHadithReference("8 a")).toBe("8a");
    expect(normalizeHadithReference("8-a")).toBe("8a");
    expect(normalizeHadithReference("1921b")).toBe("1921b");
    expect(normalizeHadithReference("1921 b")).toBe("1921b");
    expect(normalizeHadithReference("٨ أ")).toBe("8a");
    expect(normalizeHadithReference("١")).toBe("1");
    // Invalid format
    expect(normalizeHadithReference("invalid-ref-123456789")).toBeNull();
  });

  it("resolves collection-name queries to collection results, not numbers", () => {
    const muslimQueries = ["muslim", "sahih muslim", "sahih-muslim", "صحيح مسلم", "مسلم"];
    for (const q of muslimQueries) {
      const results = searchHadith(q, "en");
      expect(results.length).toBe(1);
      expect(results[0].type).toBe("collection");
      expect(results[0].collectionId).toBe("muslim");
      expect(results[0].targetHref).toBe("/en/hadith/muslim");
    }

    const bukhariQueries = ["bukhari", "sahih al-bukhari", "sahih bukhari", "bukhary", "البخاري", "بخاري"];
    for (const q of bukhariQueries) {
      const results = searchHadith(q, "en");
      expect(results.length).toBe(1);
      expect(results[0].type).toBe("collection");
      expect(results[0].collectionId).toBe("bukhari");
      expect(results[0].targetHref).toBe("/en/hadith/bukhari");
    }
  });

  it("resolves collection + reference queries directly to the target hadith", () => {
    const res1 = searchHadith("Muslim 8a", "en");
    expect(res1.length).toBe(1);
    expect(res1[0].type).toBe("hadith");
    expect(res1[0].collectionId).toBe("muslim");
    expect(res1[0].reference).toBe("8a");
    expect(res1[0].targetHref).toBe("/en/hadith/muslim/8a");

    const res2 = searchHadith("muslim 8 a", "en");
    expect(res2.length).toBe(1);
    expect(res2[0].reference).toBe("8a");

    const res3 = searchHadith("Bukhari 1", "en");
    expect(res3.length).toBe(1);
    expect(res3[0].type).toBe("hadith");
    expect(res3[0].collectionId).toBe("bukhari");
    expect(res3[0].reference).toBe("1");
    expect(res3[0].targetHref).toBe("/en/hadith/bukhari/1");

    const res4 = searchHadith("البخاري ١", "ar");
    expect(res4.length).toBe(1);
    expect(res4[0].collectionId).toBe("bukhari");
    expect(res4[0].reference).toBe("1");
  });

  it("presents clear choices for a number alone and NEVER silently assumes Bukhari", () => {
    const results = searchHadith("8a", "en");
    expect(results.length).toBe(2);
    // Both Bukhari and Muslim must be presented as choices
    const bukhariChoice = results.find((r) => r.collectionId === "bukhari");
    const muslimChoice = results.find((r) => r.collectionId === "muslim");

    expect(bukhariChoice).toBeDefined();
    expect(bukhariChoice?.type).toBe("choice");
    expect(bukhariChoice?.targetHref).toBe("/en/hadith/bukhari/8a");

    expect(muslimChoice).toBeDefined();
    expect(muslimChoice?.type).toBe("choice");
    expect(muslimChoice?.targetHref).toBe("/en/hadith/muslim/8a");
  });

  it("handles collection typos with suggestions without silently redirecting to another hadith", () => {
    const results = searchHadith("musilm 8a", "en");
    expect(results.length).toBe(1);
    expect(results[0].type).toBe("suggestion");
    expect(results[0].isTypoSuggestion).toBe(true);
    expect(results[0].reference).toBe("8a");
    expect(results[0].subtitle).toContain("Did you mean Sahih Muslim 8a?");

    const resultsSpaced = searchHadith("musilm 8 a", "en");
    expect(resultsSpaced.length).toBe(1);
    expect(resultsSpaced[0].type).toBe("suggestion");
    expect(resultsSpaced[0].isTypoSuggestion).toBe(true);
    expect(resultsSpaced[0].reference).toBe("8a");
    expect(resultsSpaced[0].subtitle).toContain("Did you mean Sahih Muslim 8a?");
  });

  // Table-driven hadith search queries
  const hadithTable = [
    { query: "Muslim 8a", expectedCol: "muslim", expectedRef: "8a" },
    { query: "muslim 8 a", expectedCol: "muslim", expectedRef: "8a" },
    { query: "Sahih Muslim 1921b", expectedCol: "muslim", expectedRef: "1921b" },
    { query: "Bukhari 1", expectedCol: "bukhari", expectedRef: "1" },
    { query: "bukhary 1", expectedCol: "bukhari", expectedRef: "1" },
    { query: "البخاري ١", expectedCol: "bukhari", expectedRef: "1" },
  ];

  for (const { query, expectedCol, expectedRef } of hadithTable) {
    it(`resolves "${query}" to ${expectedCol} ${expectedRef}`, () => {
      const results = searchHadith(query, "en");
      expect(results.length).toBe(1);
      expect(results[0].collectionId).toBe(expectedCol);
      expect(results[0].reference).toBe(expectedRef);
    });
  }
});

describe("4. Search UI Rendering and Accessibility", () => {
  const quranDict = getDictionary("en").quran;
  const hadithDict = getDictionary("en").hadith;

  it("renders SurahIndex with empty state when query does not match", () => {
    const html = renderToString(
      React.createElement(SurahIndex, {
        lang: "en",
        dict: quranDict,
        chapters: mockChapters,
      })
    );
    expect(html).toContain("quran-index");
    expect(html).toContain("Al-Fatihah");
    expect(html).toContain("Al-Baqarah");
  });

  it("renders HadithIndex with clear collections grid", () => {
    const html = renderToString(
      React.createElement(HadithIndex, {
        lang: "en",
        dict: hadithDict,
        collections: mockCollections,
      })
    );
    expect(html).toContain("hadith-page");
    expect(html).toContain("Sahih al-Bukhari");
    expect(html).toContain("Sahih Muslim");
  });
});

describe("5. Route Error and Not-Found Behaviour", () => {
  it("renders localized not-found state on missing hadith record instead of internal error", async () => {
    const hadithService = await import("@/lib/hadith/service");
    vi.mocked(hadithService.getCollection).mockResolvedValue({
      id: "bukhari",
      name: "bukhari",
      nameEnglish: "Sahih al-Bukhari",
      nameArabic: "صحيح البخاري",
      shortIntro: "Authentic Bukhari",
    });
    vi.mocked(hadithService.getHadithByReference).mockResolvedValue(null);
    vi.mocked(hadithService.getAdjacentHadiths).mockResolvedValue({ prev: null, next: null });

    const { default: HadithPage } = await import("@/app/[lang]/hadith/[collection]/[reference]/page");

    const element = await HadithPage({
      params: Promise.resolve({
        lang: "en",
        collection: "bukhari",
        reference: "999999",
      }),
    });

    const html = renderToString(element);
    // Must show localized not-found state
    expect(html).toContain("Hadith not found");
    expect(html).toContain("The requested Hadith could not be found in this collection");
    // Must NEVER show NEXT_HTTP_ERROR_FALLBACK or internal error codes
    expect(html).not.toContain("NEXT_HTTP_ERROR_FALLBACK");
    expect(html).not.toContain("NEXT_NOT_FOUND");
  });

  it("renders HadithErrorState with retry button on genuine provider failures", async () => {
    const hadithService = await import("@/lib/hadith/service");
    vi.mocked(hadithService.getCollection).mockResolvedValue({
      id: "bukhari",
      name: "bukhari",
      nameEnglish: "Sahih al-Bukhari",
      nameArabic: "صحيح البخاري",
      shortIntro: "Authentic Bukhari",
    });
    vi.mocked(hadithService.getHadithByReference).mockRejectedValue(
      new Error("Sunnah.com API returned 500 Internal Server Error")
    );
    vi.mocked(hadithService.getAdjacentHadiths).mockResolvedValue({ prev: null, next: null });

    const { default: HadithPage } = await import("@/app/[lang]/hadith/[collection]/[reference]/page");

    const element = await HadithPage({
      params: Promise.resolve({
        lang: "en",
        collection: "bukhari",
        reference: "1",
      }),
    });

    const html = renderToString(element);
    // Must show error state with retry button
    expect(html).toContain("Unable to load Hadith data");
    expect(html).toContain("Retry");
    expect(html).not.toContain("NEXT_HTTP_ERROR_FALLBACK");
  });
});