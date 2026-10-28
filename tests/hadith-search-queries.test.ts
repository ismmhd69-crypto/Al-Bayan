import { expect, it } from "vitest";
import { hadithSearchQueries, hadithTopicWords } from "@/lib/sources/hadith-rules";

// Search wording only (no database). Phrasings seen in live runs on 2026-10-29 for one question.
it("ignores connecting words and words naming the text type, and reads attached articles as the topic word", () => {
  const words = hadithTopicWords(["أحاديث الجمع للمطر", "جمع النبي بين الصلاتين"]);
  expect(words).toContain("المطر");
  for (const filler of ["بين", "احاديث", "للمطر"]) expect(words).not.toContain(filler);
});
it("adds a two-topic-word query so a hadith in its own wording can still be found", () => {
  const queries = hadithSearchQueries(["الجمع بين الصلاتين للمطر حكم", "المطر عذر الجمع بين الصلاتين"]);
  expect(queries.some(q => q.split(" or ").includes("جمع مطر"))).toBe(true);
  // Two forms of one word are never paired with each other.
  expect(queries.some(q => q.split(" or ").includes("الجمع جمع"))).toBe(false);
});
