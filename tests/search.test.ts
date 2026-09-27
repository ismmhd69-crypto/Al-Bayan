// Search tests with made-up verses (not Quran text).
import { describe, expect, it } from "vitest";
import { searchVerses, type SearchDoc } from "@/lib/ask/search";

const docs: SearchDoc[] = [
  { key: "9:1", arabicPlain: "كتب عليكم الصيام في الشهر", en: "Fasting is prescribed for you in the month", de: "Das Fasten ist euch im Monat vorgeschrieben" },
  { key: "9:2", arabicPlain: "واصبروا على الصيام والصلاة", en: "Be patient in fasting and prayer", de: "Seid geduldig im Fasten und Gebet" },
  { key: "9:3", arabicPlain: "والتجارة في البحر", en: "Trade upon the sea and its ships", de: "Handel auf dem Meer" },
  { key: "9:4", arabicPlain: "والشهر الحرام بالشهر الحرام", en: "The sacred month for the sacred month", de: "Der heilige Monat" },
];

describe("searchVerses", () => {
  it("finds verses that match several search words", () => {
    const r = searchVerses(docs, ["fasting", "prescribed", "month"]);
    expect(r[0]).toBe("9:1");
    expect(r).not.toContain("9:3");
  });

  it("does not return a verse on one stray word", () => {
    // "month" alone appears in 9:1 and 9:4 but is not enough on its own.
    expect(searchVerses(docs, ["month", "banana"])).toEqual([]);
  });

  it("works with Arabic words, prefixes and diacritics", () => {
    const r = searchVerses(docs, ["الصِّيام", "والصلاة", "صبر"]);
    expect(r[0]).toBe("9:2");
  });

  it("returns nothing for an empty or meaningless query", () => {
    expect(searchVerses(docs, [])).toEqual([]);
    expect(searchVerses(docs, ["God", "Allah"])).toEqual([]);
  });
});
