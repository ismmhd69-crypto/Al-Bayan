import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  compareHadithReferences,
  formatDisplayReference,
  isEligibleGrade,
  isEligibleHadith,
  parseRawHadithItem,
  normalizeReferenceForLookup,
  validateReferenceInput,
} from "@/lib/hadith/service";
import { cleanHadithDisplayText } from "@/lib/hadith/display";
import { HadithDisplayText } from "@/components/hadith/HadithDisplayText";
import { HadithIndex } from "@/components/hadith/HadithIndex";
import { CollectionBooks } from "@/components/hadith/CollectionBooks";
import { BookReader } from "@/components/hadith/BookReader";
import { HadithReader } from "@/components/hadith/HadithReader";
import { HadithErrorState } from "@/components/hadith/HadithErrorState";
import { getDictionary } from "@/lib/i18n";
import type {
  HadithBookSummary,
  HadithCollectionSummary,
  HadithDetail,
  PaginatedHadiths,
} from "@/lib/hadith/types";

// Mock Next.js navigation and server-only
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  notFound: vi.fn(),
  useParams: () => ({ lang: "en" }),
}));

describe("Hadith Reader Service and Components (Codex Source Review Repairs)", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.SUNNAH_API_KEY = "test-mock-sunnah-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe("safe display cleanup for saved Sunnah content", () => {
    const collection: HadithCollectionSummary = {
      id: "muslim",
      name: "muslim",
      nameArabic: "صحيح مسلم",
      nameEnglish: "Sahih Muslim",
      shortIntro: "",
      totalBooks: 1,
      totalHadith: 1,
      totalAvailableHadith: 1,
    };

    function savedMuslimEightA(): HadithDetail {
      const snapshot = JSON.parse(readFileSync(new URL("../data/sunnah/muslim-1-1.json", import.meta.url), "utf8")) as {
        data: Record<string, unknown>[];
      };
      const item = snapshot.data.find((row) => row.hadithNumber === "8 a");
      if (!item) throw new Error("Saved Sunnah snapshot is missing Sahih Muslim 8a");
      const hadith = parseRawHadithItem(item, "muslim", "8a");
      if (!hadith) throw new Error("Saved Sahih Muslim 8a did not parse");
      return hadith;
    }

    it("renders the confirmed Muslim 8a wording and its emphasis without literal tags", () => {
      const hadith = {
        ...savedMuslimEightA(),
        chapterTitleEnglish: "The <i>Faith</i> chapter",
        bookNameEnglish: "Book of <strong>Faith</strong>",
      };
      const html = renderToString(
        React.createElement(HadithReader, {
          lang: "en",
          dict: getDictionary("en").hadith,
          collection,
          hadith,
          prevRef: null,
          nextRef: null,
        }),
      );

      expect(hadith.englishText).toContain("<i>taqdir</i> (Divine Decree)");
      expect(html).toContain("<em>taqdir</em> (Divine Decree)");
      expect(html).toContain("<em>Faith</em> chapter");
      expect(html).toContain("<strong>Faith</strong>");
      expect(html).not.toContain("&lt;i&gt;taqdir&lt;/i&gt;");
    });

    it("renders book titles, chapter headings, paragraph breaks, and entity text safely", () => {
      const hadith = {
        ...savedMuslimEightA(),
        chapterTitleEnglish: "Chapter <i>Faith</i>",
        englishText: "first paragraph\n\nsecond &amp; final",
      };
      const data: PaginatedHadiths = {
        hadiths: [hadith],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      };
      const html = renderToString(
        React.createElement(BookReader, {
          lang: "en",
          dict: getDictionary("en").hadith,
          collection,
          book: {
            bookNumber: "1",
            nameEnglish: "Book of <i>Faith</i>",
            nameArabic: "كتاب الإيمان",
          },
          initialData: data,
        }),
      );

      expect(html).toContain("<em>Faith</em>");
      expect(html).toContain("first paragraph\n\nsecond &amp; final");
      expect(html).not.toContain("&amp;amp;");
      expect(html).not.toContain("&lt;i&gt;");
    });

    it("converts confirmed escaped break markup while leaving text as safe React text", () => {
      const text = cleanHadithDisplayText("first line&gt;br&gt;second line");
      const html = renderToString(React.createElement(HadithDisplayText, { text }));

      expect(text).toBe("first line\nsecond line");
      expect(html).toContain("first line\nsecond line");
    });

    it("keeps paragraph spacing and linked reference wording without exposing known wrappers", () => {
      const paragraphs = cleanHadithDisplayText("<p>First paragraph.</p><p>Second paragraph.</p>");
      const reference = cleanHadithDisplayText(
        'See <a href="https://sunnah.com/bukhari:1">Hadith 1</a> and <span style="text-align: center;">this phrase</span>.',
      );

      expect(paragraphs).toBe("First paragraph.\n\nSecond paragraph.");
      expect(reference).toBe("See Hadith 1 and this phrase.");
    });
  });

  // -------------------------------------------------------------
  // 1. Natural Reference Sorting, Normalization & Input Validation
  // -------------------------------------------------------------
  describe("1. Reference sorting, normalization & input validation", () => {
    it("sorts references naturally rather than alphabetically", () => {
      const unsorted = ["10", "1", "2", "8 b", "8 a", "1921b", "1921a", "1922"];
      const sorted = [...unsorted].sort(compareHadithReferences);

      expect(sorted).toEqual([
        "1",
        "2",
        "8 a",
        "8 b",
        "10",
        "1921a",
        "1921b",
        "1922",
      ]);
    });

    it("formats display references cleanly without spaces", () => {
      expect(formatDisplayReference("8 a")).toBe("8a");
      expect(formatDisplayReference(" 1921 b ")).toBe("1921b");
      expect(formatDisplayReference("1")).toBe("1");
    });

    it("normalizes reference suffixes for API lookup candidates", () => {
      expect(normalizeReferenceForLookup("8a")).toEqual(["8 a", "8a"]);
      expect(normalizeReferenceForLookup("8 a")).toEqual(["8 a", "8a"]);
      expect(normalizeReferenceForLookup("1921b")).toEqual(["1921 b", "1921b"]);
      expect(normalizeReferenceForLookup("1")).toEqual(["1"]);
      expect(normalizeReferenceForLookup(" 5725 ")).toEqual(["5725"]);
    });

    it("validates reference inputs and rejects malicious or malformed paths", () => {
      expect(validateReferenceInput("1")).toBe(true);
      expect(validateReferenceInput("8a")).toBe(true);
      expect(validateReferenceInput("8 a")).toBe(true);
      expect(validateReferenceInput("1921b")).toBe(true);

      // Malicious or malformed inputs must be rejected
      expect(validateReferenceInput("")).toBe(false);
      expect(validateReferenceInput("   ")).toBe(false);
      expect(validateReferenceInput("../etc/passwd")).toBe(false);
      expect(validateReferenceInput("<script>")).toBe(false);
      expect(validateReferenceInput("1; DROP TABLE hadith;")).toBe(false);
      expect(validateReferenceInput("a".repeat(35))).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 2. Removal of Invented Grades and Tightened Eligibility (Defect 2)
  // -------------------------------------------------------------
  describe("2. Removal of invented grades and tightened eligibility", () => {
    it("does not fabricate Darussalam attribution when provider returns no grade", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/collections/bukhari/hadiths/1")) {
          return new Response(
            JSON.stringify({
              collection: "bukhari",
              bookNumber: "1",
              hadithNumber: "1",
              hadith: [
                {
                  lang: "ar",
                  body: "<p>إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</p>",
                },
                {
                  lang: "en",
                  body: "<p>The reward of deeds depends upon the intentions.</p>",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(JSON.stringify({ data: [] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");
      const hadith = await getHadithByReference("bukhari", "1");

      expect(hadith).not.toBeNull();
      // Must be empty array, NOT fabricated Darussalam attribution
      expect(hadith?.grades).toEqual([]);
      expect(hadith?.grades).not.toContainEqual(
        expect.objectContaining({ gradedBy: "Darussalam" })
      );
    });

    it("parses verified provider grades accurately without inventing a grader", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/collections/bukhari/hadiths/1")) {
          return new Response(
            JSON.stringify({
              collection: "bukhari",
              bookNumber: "1",
              hadithNumber: "1",
              grades: [
                { grade: "Sahih", graded_by: null },
              ],
              hadith: [
                {
                  lang: "ar",
                  body: "<p>إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</p>",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(JSON.stringify({ data: [] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");
      const hadith = await getHadithByReference("bukhari", "1");

      expect(hadith?.grades).toEqual([
        { grade: "Sahih", gradedBy: null },
      ]);
    });

    it("accepts supported provider labels while rejecting arbitrary parenthetical qualifications", () => {
      // Explicit supported provider labels
      expect(isEligibleGrade("Sahih")).toBe(true);
      expect(isEligibleGrade("Hasan")).toBe(true);
      expect(isEligibleGrade("Sahih (Darussalam)")).toBe(true);
      expect(isEligibleGrade("Hasan (Darussalam)")).toBe(true);
      expect(isEligibleGrade("Sahih (Al-Albani)")).toBe(true);
      expect(isEligibleGrade("Sahih (Zubair Ali Zai)")).toBe(true);
      expect(isEligibleGrade("Sahih - Muttafaqun 'Alayh")).toBe(true);
      expect(isEligibleGrade("Muttafaqun 'Alayh")).toBe(true);
      expect(isEligibleGrade("صحيح")).toBe(true);
      expect(isEligibleGrade("حسن")).toBe(true);

      // Regression: arbitrary parenthetical text must be rejected
      expect(isEligibleGrade("Sahih (disputed)")).toBe(false);
      expect(isEligibleGrade("Hasan (unknown)")).toBe(false);
      expect(isEligibleGrade("Sahih (unverified)")).toBe(false);
      expect(isEligibleGrade("Sahih (weak isnad)")).toBe(false);
      expect(isEligibleGrade("Sahih (conditional)")).toBe(false);

      // Misleading prefix match must NOT pass
      expect(isEligibleGrade("Sahih li-ghayrihi with qualification")).toBe(false);
      expect(isEligibleGrade("Sahih but da'if")).toBe(false);
      expect(isEligibleGrade("Hasan but weak")).toBe(false);
      expect(isEligibleGrade("Sahih - contradicted by external report")).toBe(false);
      expect(isEligibleGrade("Da'if")).toBe(false);
      expect(isEligibleGrade("Weak")).toBe(false);
      expect(isEligibleGrade("Mawdu")).toBe(false);
      expect(isEligibleGrade("Fabricated")).toBe(false);
      expect(isEligibleGrade("ضعيف")).toBe(false);
      expect(isEligibleGrade("منكر")).toBe(false);
      expect(isEligibleGrade("شاذ")).toBe(false);
      expect(isEligibleGrade("لا يصح")).toBe(false);
    });

    it("rejects long Bukhari chapter heading records without arbitrary length cutoffs", () => {
      // Long chapter heading (> 80 characters) with multiple quotes from tabi'in
      const longHeading = {
        collection: "bukhari",
        bookNumber: "1",
        hadithNumber: "0",
        hadith: [
          {
            lang: "ar",
            body: "<p>باب قول النبي صلى الله عليه وسلم بني الإسلام على خمس ودعاؤكم إيمانكم وتفسير قول الله عز وجل وما كان الله ليضيع إيمانكم</p>",
          },
        ],
      };

      // Even though body is ~135 characters, it must be recognized as a heading and excluded
      expect(isEligibleHadith(longHeading, "bukhari")).toBe(false);
    });

    it("enforces eligibility: excludes Muslim introduction records", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/collections/muslim/hadiths/intro-1")) {
          return new Response(
            JSON.stringify({
              collection: "muslim",
              bookNumber: "introduction",
              hadithNumber: "intro-1",
              hadith: [
                {
                  lang: "ar",
                  body: "<p>مقدمة صحيح مسلم</p>",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");
      const hadith = await getHadithByReference("muslim", "intro-1");

      expect(hadith).toBeNull();
    });

    it("excludes introduction book from Muslim collection books list", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/collections/muslim/books")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  bookNumber: "introduction",
                  book: [{ lang: "en", name: "Introduction" }, { lang: "ar", name: "المقدمة" }],
                  numberOfHadith: 92,
                },
                {
                  bookNumber: "1",
                  book: [{ lang: "en", name: "Faith" }, { lang: "ar", name: "كتاب الإيمان" }],
                  numberOfHadith: 436,
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");
      const books = await getCollectionBooks("muslim");

      expect(books).toHaveLength(1);
      expect(books[0].bookNumber).toBe("1");
      expect(books[0].nameEnglish).toBe("Faith");
    });
  });

  // -------------------------------------------------------------
  // 3. Navigation across Paginated Books (Defect 1 Repairs)
  // -------------------------------------------------------------
  describe("3. Pagination-aware navigation across books", () => {
    it("navigates within a multi-page book beyond the first 100 hadiths", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        // Page 1: 1..100
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 100 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "2",
                hadithNumber: String(i + 1),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 1}</p>` }],
              })),
              total: 150,
              limit: 100,
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Page 2: 101..150
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=2")) {
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 50 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "2",
                hadithNumber: String(i + 101),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 101}</p>` }],
              })),
              total: 150,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      const hadith120: HadithDetail = {
        id: "bukhari:120",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "120",
        displayNumber: "120",
        arabicText: "نص",
        englishText: "text",
        grades: [],
        url: "https://sunnah.com/bukhari:120",
      };

      const adjacent = await getAdjacentHadiths("bukhari", hadith120);
      expect(adjacent.prev).toBe("119");
      expect(adjacent.next).toBe("121");
    });

    it("navigates seamlessly across page boundaries within the same book", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 100 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "2",
                hadithNumber: String(i + 1),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 1}</p>` }],
              })),
              total: 150,
              limit: 100,
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=2")) {
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 50 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "2",
                hadithNumber: String(i + 101),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 101}</p>` }],
              })),
              total: 150,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      // Test record 100 (last item on page 1): next must be 101 on page 2, NOT a book boundary!
      const hadith100: HadithDetail = {
        id: "bukhari:100",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "100",
        displayNumber: "100",
        arabicText: "نص",
        englishText: "text",
        grades: [],
        url: "https://sunnah.com/bukhari:100",
      };

      const adj100 = await getAdjacentHadiths("bukhari", hadith100);
      expect(adj100.prev).toBe("99");
      expect(adj100.next).toBe("101");

      // Test record 101 (first item on page 2): prev must be 100 on page 1
      const hadith101: HadithDetail = {
        id: "bukhari:101",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "101",
        displayNumber: "101",
        arabicText: "نص",
        englishText: "text",
        grades: [],
        url: "https://sunnah.com/bukhari:101",
      };

      const adj101 = await getAdjacentHadiths("bukhari", hadith101);
      expect(adj101.prev).toBe("100");
      expect(adj101.next).toBe("102");
    });

    it("resolves the actual final record of a previous book with more than six pages in one request", async () => {
      const fetchedPages: number[] = [];
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        // Current book: Book 2 starts at hadith 1001
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  collection: "bukhari",
                  bookNumber: "2",
                  hadithNumber: "1001",
                  hadith: [{ lang: "ar", body: "<p>حديث 1001</p>" }],
                },
              ],
              total: 1,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Book 1 Page 1: total = 1000 hadiths, limit = 100 -> totalPages = 10
        if (urlStr.includes("/books/1/hadiths") && /[?&]page=1(?=&|$)/.test(urlStr)) {
          fetchedPages.push(1);
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 100 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "1",
                hadithNumber: String(i + 1),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 1}</p>` }],
              })),
              total: 1000,
              limit: 100,
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Book 1 Page 10 (actual final page): hadiths 901..1000
        if (urlStr.includes("/books/1/hadiths") && urlStr.includes("page=10")) {
          fetchedPages.push(10);
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 100 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "1",
                hadithNumber: String(i + 901),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 901}</p>` }],
              })),
              total: 1000,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Books catalogue
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(
            JSON.stringify({
              data: [
                { bookNumber: "1", book: [] },
                { bookNumber: "2", book: [] },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      const hadith1001: HadithDetail = {
        id: "bukhari:1001",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "1001",
        displayNumber: "1001",
        arabicText: "نص",
        englishText: null,
        grades: [],
        url: "https://sunnah.com/bukhari:1001",
      };

      const adjacent = await getAdjacentHadiths("bukhari", hadith1001);

      // Must fetch page 10 directly and resolve hadith 1000
      expect(adjacent.prev).toBe("1000");
      expect(fetchedPages).toContain(10);
      expect(fetchedPages).not.toContain(6);
    });

    it("returns prev: null when the final page of a previous book contains no eligible records", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  collection: "bukhari",
                  bookNumber: "2",
                  hadithNumber: "151",
                  hadith: [{ lang: "ar", body: "<p>حديث 151</p>" }],
                },
              ],
              total: 1,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Book 1 Page 1: has records, indicates 2 pages
        if (urlStr.includes("/books/1/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  collection: "bukhari",
                  bookNumber: "1",
                  hadithNumber: "1",
                  hadith: [{ lang: "ar", body: "<p>حديث 1</p>" }],
                },
              ],
              total: 150,
              limit: 100,
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Book 1 Page 2: empty (or only ineligible records)
        if (urlStr.includes("/books/1/hadiths") && urlStr.includes("page=2")) {
          return new Response(
            JSON.stringify({
              data: [],
              total: 150,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(
            JSON.stringify({
              data: [
                { bookNumber: "1", book: [] },
                { bookNumber: "2", book: [] },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      const hadith151: HadithDetail = {
        id: "bukhari:151",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "151",
        displayNumber: "151",
        arabicText: "نص",
        englishText: null,
        grades: [],
        url: "https://sunnah.com/bukhari:151",
      };

      const adjacent = await getAdjacentHadiths("bukhari", hadith151);

      // Must be null (never fall back to page 1's last reference)
      expect(adjacent.prev).toBeNull();
    });

    it("interprets pagination metadata using provider's effective page size when smaller than requested", async () => {
      const fetchedPages: number[] = [];
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/books/2/hadiths") && urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  collection: "bukhari",
                  bookNumber: "2",
                  hadithNumber: "201",
                  hadith: [{ lang: "ar", body: "<p>حديث 201</p>" }],
                },
              ],
              total: 1,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Provider ignores limit 100 and returns effective limit 25 with total 200 -> totalPages = 8
        if (urlStr.includes("/books/1/hadiths") && urlStr.includes("page=1")) {
          fetchedPages.push(1);
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 25 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "1",
                hadithNumber: String(i + 1),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 1}</p>` }],
              })),
              total: 200,
              limit: 25,
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Final page is page 8 (200 / 25 = 8)
        if (urlStr.includes("/books/1/hadiths") && urlStr.includes("page=8")) {
          fetchedPages.push(8);
          return new Response(
            JSON.stringify({
              data: Array.from({ length: 25 }, (_, i) => ({
                collection: "bukhari",
                bookNumber: "1",
                hadithNumber: String(i + 176),
                hadith: [{ lang: "ar", body: `<p>حديث ${i + 176}</p>` }],
              })),
              total: 200,
              limit: 25,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(
            JSON.stringify({
              data: [
                { bookNumber: "1", book: [] },
                { bookNumber: "2", book: [] },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      const hadith201: HadithDetail = {
        id: "bukhari:201",
        collection: "bukhari",
        bookNumber: "2",
        hadithNumber: "201",
        displayNumber: "201",
        arabicText: "نص",
        englishText: null,
        grades: [],
        url: "https://sunnah.com/bukhari:201",
      };

      const adjacent = await getAdjacentHadiths("bukhari", hadith201);

      // Must fetch page 8 using effective limit 25 and return hadith 200
      expect(adjacent.prev).toBe("200");
      expect(fetchedPages).toContain(8);
    });

    it("omits navigation links when neighbours cannot be established within the bound", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/books/1/hadiths")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  collection: "bukhari",
                  bookNumber: "1",
                  hadithNumber: "1",
                  hadith: [{ lang: "ar", body: "<p>حديث 1</p>" }],
                },
              ],
              total: 1,
              limit: 100,
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [] }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getAdjacentHadiths } = await import("@/lib/hadith/service");

      const hadith1: HadithDetail = {
        id: "bukhari:1",
        collection: "bukhari",
        bookNumber: "1",
        hadithNumber: "1",
        displayNumber: "1",
        arabicText: "نص",
        englishText: null,
        grades: [],
        url: "https://sunnah.com/bukhari:1",
      };

      const adjacent = await getAdjacentHadiths("bukhari", hadith1);
      expect(adjacent.prev).toBeNull();
      expect(adjacent.next).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 4. Distinction Between 404 and Service Failures
  // -------------------------------------------------------------
  describe("4. Error propagation vs genuine 404", () => {
    it("returns null on genuine 404 after checking candidate spellings", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response("Not Found", { status: 404 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");
      const hadith = await getHadithByReference("bukhari", "8a");
      expect(hadith).toBeNull();
      // Genuine 404 tried both "8 a" and "8a" before concluding not found
      expect(callCount).toBe(2);
    });

    it("throws immediately on 403 forbidden without retrying candidate spellings", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response("Forbidden", { status: 403 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");

      await expect(getHadithByReference("bukhari", "8a")).rejects.toThrow(
        "Sunnah.com API authentication failed (403)"
      );
      expect(callCount).toBe(1);
    });

    it("throws immediately on 401 unauthorized without retrying candidates", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response("Unauthorized", { status: 401 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");

      await expect(getHadithByReference("bukhari", "8a")).rejects.toThrow(
        "Sunnah.com API authentication failed (401)"
      );
      expect(callCount).toBe(1);
    });

    it("throws immediately on 429 rate limit without retrying candidates", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response("Rate limited", { status: 429 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");

      await expect(getHadithByReference("bukhari", "1")).rejects.toThrow(
        "Sunnah.com API rate limit exceeded (429)"
      );
      expect(callCount).toBe(1);
    });

    it("throws immediately on 500 server error without retrying candidates", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        return new Response("Internal Server Error", { status: 500 });
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");

      await expect(getHadithByReference("bukhari", "8a")).rejects.toThrow(
        "Sunnah.com API server error (500)"
      );
      expect(callCount).toBe(1);
    });

    it("throws immediately on network timeout", async () => {
      globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal | undefined;
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        if (signal) {
          Object.defineProperty(signal, "aborted", { value: true });
        }
        throw error;
      });

      const { getHadithByReference } = await import("@/lib/hadith/service");

      await expect(getHadithByReference("bukhari", "1")).rejects.toThrow(
        "Sunnah.com API request timed out"
      );
    });
  });

  // -------------------------------------------------------------
  // 5. Catalogue Pagination Integrity (Defect 3 Repairs)
  // -------------------------------------------------------------
  describe("5. Incomplete book catalogue and pagination integrity", () => {
    it("throws an error when a subsequent catalogue page fails, never returning partial as complete", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [{ lang: "en", name: "Book 1" }] }],
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("page=2")) {
          return new Response("Internal Error", { status: 500 });
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");

      await expect(getCollectionBooks("bukhari")).rejects.toThrow(
        "Sunnah.com API server error (500)"
      );
    });

    it("rejects self-cycles and throws an error", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("page=1")) {
          // Page 1 points to page 1
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [] }],
              next: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");

      await expect(getCollectionBooks("bukhari")).rejects.toThrow(
        "Self-cycle detected for bukhari books: page 1 links to itself"
      );
    });

    it("rejects multi-page cycles and throws an error", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [] }],
              next: 2,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (urlStr.includes("page=2")) {
          // Page 2 links back to visited page 1
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "2", book: [] }],
              next: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");

      await expect(getCollectionBooks("bukhari")).rejects.toThrow(
        "Pagination cycle detected for bukhari books: page 2 links to already visited page 1"
      );
    });

    it("rejects invalid next-page values and throws an error", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [] }],
              next: "invalid_next_page" as unknown as number,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");

      await expect(getCollectionBooks("bukhari")).rejects.toThrow(
        "Invalid next-page value 'invalid_next_page' for bukhari books on page 1"
      );
    });

    it("rejects next-page jumps beyond numeric page bounds rather than silently returning partial results", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("page=1")) {
          return new Response(
            JSON.stringify({
              data: [{ bookNumber: "1", book: [] }],
              next: 99, // Jumps far beyond max allowed page number (15)
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");

      await expect(getCollectionBooks("bukhari")).rejects.toThrow(
        "Next page 99 exceeds maximum allowed page number (15) for bukhari books"
      );
    });

    it("deduplicates book entries by bookNumber", async () => {
      globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes("/collections/bukhari/books")) {
          return new Response(
            JSON.stringify({
              data: [
                { bookNumber: "1", book: [{ lang: "en", name: "Revelation" }] },
                { bookNumber: "1", book: [{ lang: "en", name: "Revelation duplicate" }] },
                { bookNumber: "2", book: [{ lang: "en", name: "Belief" }] },
              ],
              next: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const { getCollectionBooks } = await import("@/lib/hadith/service");
      const books = await getCollectionBooks("bukhari");

      expect(books).toHaveLength(2);
      expect(books.map((b) => b.bookNumber)).toEqual(["1", "2"]);
    });
  });

  // -------------------------------------------------------------
  // 6. UI Component Rendering, Localization & Error State
  // -------------------------------------------------------------
  describe("6. UI rendering, error states and localization", () => {
    const enDict = getDictionary("en").hadith;
    const arDict = getDictionary("ar").hadith;
    const deDict = getDictionary("de").hadith;

    const mockCollection: HadithCollectionSummary = {
      id: "bukhari",
      name: "bukhari",
      nameArabic: "صحيح البخاري",
      nameEnglish: "Sahih al-Bukhari",
      shortIntro: "The most authentic collection of Hadith.",
      totalBooks: 97,
      totalHadith: 7291,
      totalAvailableHadith: 7277,
    };

    const mockBook: HadithBookSummary = {
      bookNumber: "1",
      nameEnglish: "Revelation",
      nameArabic: "كتاب بدء الوحى",
      hadithStartNumber: 1,
      hadithEndNumber: 7,
      numberOfHadith: 7,
    };

    const mockHadithWithoutGrade: HadithDetail = {
      id: "bukhari:1",
      collection: "bukhari",
      bookNumber: "1",
      hadithNumber: "1",
      displayNumber: "1",
      arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
      englishText: "The reward of deeds depends upon the intentions.",
      chapterTitleEnglish: "How the Divine Revelation started",
      chapterTitleArabic: "كيف كان بدء الوحي",
      grades: [],
      url: "https://sunnah.com/bukhari:1",
      bookNameEnglish: "Revelation",
      bookNameArabic: "كتاب بدء الوحى",
    };

    it("renders HadithErrorState in English with working retry button and localized message", () => {
      const html = renderToString(
        React.createElement(HadithErrorState, {
          lang: "en",
          dict: enDict,
          errorMessage: "Failed to connect to provider",
        })
      );

      expect(html).toContain(enDict.errorLoading);
      expect(html).toContain(enDict.retry);
      expect(html).toContain(enDict.backToHadith);
      expect(html).toContain("Failed to connect to provider");
    });

    it("renders HadithErrorState in Arabic with working retry button and localized message", () => {
      const html = renderToString(
        React.createElement(HadithErrorState, {
          lang: "ar",
          dict: arDict,
          errorMessage: "تعذر الاتصال بالخدمة",
        })
      );

      expect(html).toContain(arDict.errorLoading);
      expect(html).toContain(arDict.retry);
      expect(html).toContain(arDict.backToHadith);
      expect(html).toContain("تعذر الاتصال بالخدمة");
    });

    it("does not render any grade badge or icon when hadith has no verified grades", () => {
      const htmlReader = renderToString(
        React.createElement(HadithReader, {
          lang: "en",
          dict: enDict,
          collection: mockCollection,
          hadith: mockHadithWithoutGrade,
          prevRef: null,
          nextRef: "2",
        })
      );

      expect(htmlReader).not.toContain("hadith-grade-badge");
      expect(htmlReader).not.toContain("Darussalam");

      const htmlBook = renderToString(
        React.createElement(BookReader, {
          lang: "en",
          dict: enDict,
          collection: mockCollection,
          book: mockBook,
          initialData: {
            hadiths: [mockHadithWithoutGrade],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            nextPage: null,
            prevPage: null,
          },
        })
      );

      expect(htmlBook).not.toContain("hadith-grade-badge");
      expect(htmlBook).not.toContain("Darussalam");
    });

    it("renders verified grade cleanly when present without empty parentheses", () => {
      const hadithWithVerifiedGrade: HadithDetail = {
        ...mockHadithWithoutGrade,
        grades: [{ grade: "Sahih", gradedBy: null }],
      };

      const html = renderToString(
        React.createElement(HadithReader, {
          lang: "en",
          dict: enDict,
          collection: mockCollection,
          hadith: hadithWithVerifiedGrade,
          prevRef: null,
          nextRef: null,
        })
      );

      expect(html).toContain("hadith-grade-badge");
      expect(html).toContain("Sahih");
      expect(html).not.toContain("()");
      expect(html).not.toContain("(null)");
    });

    it("renders Arabic book titles and localized navigation in Arabic mode", () => {
      const htmlBookAr = renderToString(
        React.createElement(BookReader, {
          lang: "ar",
          dict: arDict,
          collection: mockCollection,
          book: mockBook,
          initialData: {
            hadiths: [mockHadithWithoutGrade],
            total: 10,
            page: 2,
            limit: 5,
            totalPages: 2,
            hasNext: false,
            hasPrev: true,
            nextPage: null,
            prevPage: 1,
          },
        })
      );

      expect(htmlBookAr).toContain("كتاب بدء الوحى");
      expect(htmlBookAr).toContain(arDict.previousPage);
      expect(htmlBookAr).toContain("2");
    });

    it("renders honest translation unavailable notice on German interface", () => {
      const htmlDe = renderToString(
        React.createElement(HadithReader, {
          lang: "de",
          dict: deDict,
          collection: mockCollection,
          hadith: mockHadithWithoutGrade,
          prevRef: null,
          nextRef: null,
        })
      );

      expect(htmlDe).toContain(deDict.translationUnavailable);
      expect(htmlDe).toContain("إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ");
    });

    it("renders HadithIndex with verified counts or honest absence without turning missing counts to 0", () => {
      const colWithoutCounts: HadithCollectionSummary = {
        ...mockCollection,
        totalBooks: null,
        totalHadith: null,
        totalAvailableHadith: null,
      };

      const html = renderToString(
        React.createElement(HadithIndex, {
          lang: "en",
          dict: enDict,
          collections: [colWithoutCounts],
        })
      );

      expect(html).not.toContain("0 Books");
      expect(html).not.toContain("0 Hadiths");
    });
  });
});
