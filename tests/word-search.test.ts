import { describe, expect, it, vi } from "vitest";
import { quranSearchPath } from "@/lib/sources/quran-search";
import { cleanQuery, readPage } from "@/lib/search/limit";
import { isWordQuery } from "@/lib/search/use-word-search";

vi.mock("server-only", () => ({}));

describe("word search", () => {
  it("asks Quran Foundation for the requested page and keeps page one as the default", () => {
    expect(new URLSearchParams(quranSearchPath("mercy", [85, 208], 10, 3).split("?")[1]).get("page")).toBe("3");
    expect(new URLSearchParams(quranSearchPath("mercy", [85, 208], 10).split("?")[1]).get("page")).toBe("1");
  });

  it("cleans the query and rejects empty or symbol-only input", () => {
    expect(cleanQuery("  patience \n  and  prayer ")).toBe("patience and prayer");
    expect(cleanQuery("a")).toBeNull();
    expect(cleanQuery("!!!")).toBeNull();
    expect(cleanQuery(null)).toBeNull();
    expect(cleanQuery("x".repeat(500))?.length).toBe(100);
    expect(cleanQuery("الصبر")).toBe("الصبر");
  });

  it("keeps page numbers between 1 and 20", () => {
    expect(readPage(null)).toBe(1);
    expect(readPage("0")).toBe(1);
    expect(readPage("abc")).toBe(1);
    expect(readPage("5")).toBe(5);
    expect(readPage("999")).toBe(20);
  });

  it("leaves plain references to the page's own lookup", () => {
    expect(isWordQuery("2:255")).toBe(false);
    expect(isWordQuery("12")).toBe(false);
    expect(isWordQuery("ab")).toBe(false);
    expect(isWordQuery("bukhari 1")).toBe(true);
    expect(isWordQuery("patience")).toBe(true);
    expect(isWordQuery("الصبر")).toBe(true);
  });
});

describe("hadith word search mapping", () => {
  it("picks Arabic for Arabic script and the page language otherwise", async () => {
    const { corpusFor } = await import("@/lib/hadith/word-search");
    expect(corpusFor("الصبر", "en")).toBe("ar");
    expect(corpusFor("patience", "ar")).toBe("en");
    expect(corpusFor("Geduld", "de")).toBe("de");
    expect(corpusFor("patience", "en")).toBe("en");
  });

  it("maps a stored row to a reader address and drops anything else", async () => {
    const { toHit } = await import("@/lib/hadith/word-search");
    const hit = toHit({
      hit_url: "https://sunnah.com/muslim:278e",
      hit_reference: "Sahih Muslim, hadith 278e, book 2, باب كَرَاهَةِ غَمْسِ",
      hit_excerpt: "the ⟦patience⟧  of\nbelievers",
    }, "en");
    expect(hit).toEqual({
      collection: "muslim",
      number: "278e",
      book: "2",
      chapter: "باب كَرَاهَةِ غَمْسِ",
      excerpt: "the ⟦patience⟧ of believers",
      excerptLang: "en",
    });
    expect(toHit({ hit_url: "https://sunnah.com/nasai:5", hit_reference: "x", hit_excerpt: "text" }, "en")).toBeNull();
    expect(toHit({ hit_url: "https://sunnah.com/bukhari:1", hit_reference: "Sahih al-Bukhari, hadith 1, book 1", hit_excerpt: "  " }, "en")).toBeNull();
    expect(toHit({ hit_url: "https://sunnah.com/bukhari:1", hit_reference: "Sahih al-Bukhari, hadith 1, book 1", hit_excerpt: "text" }, "ar")?.chapter).toBeNull();
  });
});

describe("Arabic excerpt from the original text", () => {
  const original = "حَدَّثَنَا مُحَمَّدٌ قَالَ: مَنْ يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ، وَمَا أُعْطِيَ أَحَدٌ عَطَاءً خَيْرًا وَأَوْسَعَ مِنَ الصَّبْرِ";

  it("keeps the original letters and diacritics and marks the matched word", async () => {
    const { originalExcerpt } = await import("@/lib/hadith/excerpt");
    const out = originalExcerpt(original, "الصبر");
    expect(out).toContain("⟦الصَّبْرِ⟧");
    expect(original).toContain(out.replace(/[⟦⟧…]/g, ""));
  });

  it("does not match inside a longer word", async () => {
    const { originalExcerpt } = await import("@/lib/hadith/excerpt");
    expect(originalExcerpt(original, "صبر")).not.toContain("⟦");
  });

  it("falls back to the beginning when the word is not in the text", async () => {
    const { originalExcerpt } = await import("@/lib/hadith/excerpt");
    const out = originalExcerpt(original, "الزكاة");
    expect(out).not.toContain("⟦");
    expect(original.startsWith(out.replace(/…$/, ""))).toBe(true);
  });

  it("cuts long text to a window around the match", async () => {
    const { originalExcerpt } = await import("@/lib/hadith/excerpt");
    const long = `${"كلمة ".repeat(80)}الصَّبْرِ ${"أخرى ".repeat(80)}`;
    const out = originalExcerpt(long, "الصبر");
    expect(out.startsWith("…")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThan(260);
    expect(out).toContain("⟦الصَّبْرِ⟧");
  });
});

describe("hadith address with an uppercase suffix", () => {
  it("is kept and lowercased the way the reader expects", async () => {
    const { toHit } = await import("@/lib/hadith/word-search");
    expect(toHit({ hit_url: "https://sunnah.com/muslim:157L", hit_reference: "Sahih Muslim, hadith 157 L, book 1", hit_excerpt: "text" }, "ar")?.number).toBe("157l");
  });
});
