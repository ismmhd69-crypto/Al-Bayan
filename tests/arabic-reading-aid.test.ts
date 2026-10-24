import { expect, it } from "vitest";
import { arabicReadingAid } from "@/lib/ask/arabic-reading-aid";
import { readingAidReviewRequest } from "@/lib/ask/reading-aid-review";

it("removes ordinary reading marks without dropping hamza or Quran small letters", () => {
  expect(arabicReadingAid("فَٱبْتَغُوا۟ عِندَ ٱللَّهِ ٱلرِّزْقَ")).toBe("فابتغوا عند الله الرزق");
  expect(arabicReadingAid("لُقْمَـٰنَ لِنَفْسِهِۦ لَهُۥ ءَاتَيْنَا إِنَّ")).toBe("لقمٰن لنفسهۦ لهۥ ءاتينا إن");
  expect(arabicReadingAid("أ إ آ ؤ ئ ء لا لم ليس إلا")).toBe("أ إ آ ؤ ئ ء لا لم ليس إلا");
});

it("keeps exact originals and citation scope; the aid cannot add a neighbouring source", () => {
  const originals = [{ id: "own", arabic: "فَٱبْتَغُوا۟ عِندَ ٱللَّهِ ٱلرِّزْقَ" }, { id: "other", arabic: "unavailable" }];
  const before = JSON.stringify(originals), abort = new AbortController();
  const request = readingAidReviewRequest({ text: "A proposed claim", refs: ["own"] }, { passages: originals }, abort.signal);
  const input = JSON.parse(request.prompt);
  expect(request.signal).toBe(abort.signal);
  expect(input.claims[0].originals).toEqual([{ source_id: "own", arabic: originals[0].arabic, machine_reading_aid: "فابتغوا عند الله الرزق" }]);
  expect(JSON.stringify(originals)).toBe(before);
  expect(input.claims[0]).not.toHaveProperty("restrictive_context");
  expect(request.system).toContain("sole original authority");
});
