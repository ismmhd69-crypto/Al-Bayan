// Tests for scholar quote rules and the library search phrases. Made-up texts.
import { describe, expect, it } from "vitest";
import { scholarQuoteAllowed, searchQueryLevels, toSearchQuery, type ScholarQuote } from "@/lib/sources/scholar-rules";

const quote: ScholarQuote = {
  id: "S11111111-1111-1111-1111-111111111111",
  scholarId: "ibn-baz",
  scholarName: { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  title: "حكم تجريبي",
  reference: "مجموع فتاوى تجريبي (1/ 1)",
  arabic: "هذا نص تجريبي قصير من كلام الشيخ.",
  url: "https://binbaz.org.sa/fatwas/1/test",
};

describe("scholarQuoteAllowed", () => {
  it("accepts an approved scholar's short quote from his official site", () => {
    expect(scholarQuoteAllowed(quote)).toBe(true);
    expect(scholarQuoteAllowed({ ...quote, url: "https://www.binbaz.org.sa/fatwas/1/x" })).toBe(true);
    expect(scholarQuoteAllowed({ ...quote, url: "https://alifta.gov.sa/fatwa/1" })).toBe(true); // Permanent Committee
  });
  it("rejects other scholars, other sites, long or empty quotes and bad links", () => {
    expect(scholarQuoteAllowed({ ...quote, scholarId: "someone-else" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, url: "https://example.com/fatwa" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, url: "http://binbaz.org.sa/fatwas/1" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, scholarId: "ibn-uthaymeen" })).toBe(false); // wrong site for him
    expect(scholarQuoteAllowed({ ...quote, arabic: "ن".repeat(601) })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, arabic: "   " })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, arabic: "English only text" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, id: "S1" })).toBe(false);
  });
});

describe("toSearchQuery", () => {
  it("joins phrases with 'or', drops small words and the article, unifies letters", () => {
    expect(toSearchQuery(["الحكمة من الصِّيام", "فضل صيام رمضان"])).toBe("حكمه صيام or فضل صيام رمضان");
  });
  it("returns an empty query when nothing meaningful is left", () => {
    expect(toSearchQuery(["من في", "hello"])).toBe("");
    expect(toSearchQuery([])).toBe("");
  });
});

describe("searchQueryLevels", () => {
  it("goes from the full phrases to shorter ones, dropping question-frame words", () => {
    const levels = searchQueryLevels(["حكم التوسل بالنبي الأحاديث", "التوسل بجاه النبي أدلة الجواز"]);
    expect(levels[0]).toBe("حكم توسل نبي احاديث or توسل بجاه نبي ادله جواز");
    expect(levels).toContain("توسل نبي or توسل بجاه");
    // Never a single word on its own.
    for (const q of levels) for (const part of q.split(" or ")) expect(part.split(" ").length).toBeGreaterThanOrEqual(2);
  });

  it("returns nothing for phrases without usable words", () => {
    expect(searchQueryLevels(["ما هو", "?"])).toEqual([]);
  });
});
