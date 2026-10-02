import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/hadith-split-texts.json";
import {
  analyseHadithSplit,
  hadithSplitEnabled,
  QUOTE_MARK,
  speakerOf,
  splitHadith,
  splitRejoins,
  tailHasWords,
  tailStartIndex,
  tailParts,
} from "@/lib/sources/hadith-split";
import { normalizeArabic } from "@/lib/ask/checks";
import { hadithWordsProblems } from "@/lib/sources/hadith-words-check";
import { cleanHadithMarkup } from "@/lib/sources/hadith-markup";

// Compare Arabic without diacritics and marks (typed test strings may order diacritics differently).
const plain = (s: string) => normalizeArabic(s).replace(/[^ء-ي\s]/g, "").replace(/\s+/g, " ").trim();

// Real Sunnah.com texts from public.sources (read-only copy, 2026-10-02).
const text = (ref: string) => {
  const row = (fixtures as { url: string; text: string }[]).find((f) => f.url === `https://sunnah.com/${ref}`);
  if (!row) throw new Error(`missing fixture ${ref}`);
  return row.text;
};

describe("splitHadith: real hadith", () => {
  it("Bukhari 13: chain, the Prophet's words, final period", () => {
    const s = splitHadith(text("bukhari:13"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).toBe(plain("لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ"));
    expect(plain(s.chain).startsWith(plain("حَدَّثَنَا مُسَدَّدٌ"))).toBe(true);
    expect(plain(s.chain).endsWith("قال")).toBe(true);
    expect(s.tail).toBe("‏.‏");
    expect(tailHasWords(s.tail)).toBe(false);
  });

  it("Bukhari 1: سمعت رسول الله ﷺ يقول", () => {
    const s = splitHadith(text("bukhari:1"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).toContain(plain("إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ"));
  });

  it("Bukhari 6637: أبو القاسم ﷺ is the Prophet", () => {
    const s = splitHadith(text("bukhari:6637"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).toContain(plain("وَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ"));
  });

  it("Bukhari 3119: عن النبي ﷺ قال", () => {
    const s = splitHadith(text("bukhari:3119"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).toContain(plain("الْخَيْلُ مَعْقُودٌ"));
  });

  it("Muslim 1829d (several chains, ح, an addition 'like the hadith of Nafi'): not split", () => {
    expect(analyseHadithSplit(text("muslim:1829d"))).toEqual({ split: null, reason: "refers_to_other_hadith" });
  });

  it("Muslim 303c: Companion's story, but the quote follows فقال رسول الله ﷺ", () => {
    const s = splitHadith(text("muslim:303c"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).toBe(plain("تَوَضَّأْ وَانْضَحْ فَرْجَكَ"));
  });

  it("Bukhari 2971: 'he asked the Messenger ﷺ and said' gets the neutral label", () => {
    expect(splitHadith(text("bukhari:2971"))!.speaker).toBe("other");
  });

  it("Bukhari 5862: speaker not named right before the quote, narration goes on after it", () => {
    const s = splitHadith(text("bukhari:5862"))!;
    expect(s.speaker).toBe("other");
    expect(tailHasWords(s.tail)).toBe(true);
    expect(plain(s.tail)).toContain(plain("فَأَعْطَاهُ إِيَّاهُ"));
  });

  it("Bukhari 5887: the narrator's note after the quote stays in the tail, never in the words", () => {
    const s = splitHadith(text("bukhari:5887"))!;
    expect(s.speaker).toBe("prophet");
    expect(plain(s.words)).not.toContain(plain("أَبُو عَبْدِ اللَّهِ"));
    expect(plain(s.tail)).toContain(plain("قَالَ أَبُو عَبْدِ اللَّهِ"));
  });

  it("no quote (a narration of what happened): not split", () => {
    expect(analyseHadithSplit(text("bukhari:1000")).reason).toBe("no_quote");
  });

  it("several quotes (a dialogue): not split", () => {
    expect(analyseHadithSplit(text("bukhari:101")).reason).toBe("several_quotes");
  });

  it("quote marks outside the Sunnah.com pattern: not split", () => {
    expect(analyseHadithSplit(text("bukhari:2300")).reason).toBe("stray_quote");
  });

  it("quotes inside [quran sura=\"84\"] tags are not counted: Bukhari 103 is a dialogue", () => {
    expect(analyseHadithSplit(text("bukhari:103")).reason).toBe("several_quotes");
  });

  it("texts cut off in the source (quote never closed): not split", () => {
    expect(analyseHadithSplit(text("muslim:124a")).reason).toBe("stray_quote");
    expect(analyseHadithSplit(text("bukhari:4832")).reason).toBe("stray_quote");
  });

  it("every fixture: a split rejoins to the original text exactly", () => {
    for (const f of fixtures as { url: string; text: string }[]) {
      const s = splitHadith(f.text);
      if (s) expect(s.chain + s.open + s.words + s.close + s.tail).toBe(f.text);
    }
  });
});

describe("splitHadith: edge cases", () => {
  const chain = "حَدَّثَنَا فُلاَنٌ، عَنْ أَنَسٍ، عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ";
  const words = " إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ ";
  const ok = `${chain}${QUOTE_MARK}${words}${QUOTE_MARK}‏.‏`;

  it("a clean synthetic text splits", () => {
    expect(splitHadith(ok)).toMatchObject({ chain, words, speaker: "prophet" });
  });

  it("empty quote: not split", () => {
    expect(analyseHadithSplit(`${chain}${QUOTE_MARK}  ${QUOTE_MARK}`).reason).toBe("empty_words");
  });

  it("nothing before the quote: not split", () => {
    const long = `${words}وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا `;
    expect(analyseHadithSplit(`‏ ${QUOTE_MARK}${long}${QUOTE_MARK}`).reason).toBe("empty_chain");
  });

  it("only one quote mark: not split", () => {
    expect(analyseHadithSplit(`${chain}${QUOTE_MARK}${words}`).reason).toBe("stray_quote");
  });

  it("quote without the U+200F marks, or with a mark on one side only: not split", () => {
    expect(analyseHadithSplit(`${chain}"${words}"`).reason).toBe("stray_quote");
    expect(analyseHadithSplit(`${chain}‏"${words}"‏`).reason).toBe("stray_quote");
    expect(analyseHadithSplit(`${chain}${QUOTE_MARK}${words}‏"`).reason).toBe("stray_quote");
  });

  it("U+200F marks elsewhere in the text do not matter", () => {
    const odd = `حَدَّثَنَا‏ فُلاَنٌ‏.‏ عَنِ النَّبِيِّ صلى الله عليه وسلم‏ قَالَ ${QUOTE_MARK}${words}‏${QUOTE_MARK}‏`;
    const s = splitHadith(odd)!;
    expect(splitRejoins(s, odd)).toBe(true);
    expect(s.speaker).toBe("prophet");
  });

  it("continuation report: not split", () => {
    expect(analyseHadithSplit(`حَدَّثَنَا فُلاَنٌ قَالَ ${QUOTE_MARK} نَعَمْ ${QUOTE_MARK} بِمِثْلِهِ`).reason).toBe("continuation");
  });

  it("splitRejoins catches any changed character", () => {
    const s = splitHadith(ok)!;
    expect(splitRejoins(s, ok)).toBe(true);
    expect(splitRejoins({ ...s, words: s.words.replace("الأَعْمَالُ", "الاعمال") }, ok)).toBe(false);
    expect(splitRejoins(s, `${ok} `)).toBe(false);
  });
});

describe("speakerOf", () => {
  const cases: [string, "prophet" | "other"][] = [
    ["عَنْ أَبِي هُرَيْرَةَ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ", "prophet"],
    ["عَنْ أَنَسٍ، أَنَّ النَّبِيَّ ﷺ قَالَ ", "prophet"],
    ["سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ ", "prophet"],
    ["قَالَ أَبُو الْقَاسِمِ صلى الله عليه وسلم ", "prophet"],
    ["فَقَالَ لَهَا رَسُولُ اللَّهِ صلى الله عليه وسلم ", "prophet"],
    ["عَنْ أَبِي هُرَيْرَةَ، عَنِ النَّبِيِّ صلى الله عليه وسلم ", "prophet"],
    // Someone else speaks, or the speaker is not named right before the quote.
    ["عَنِ النَّبِيِّ صلى الله عليه وسلم عَنْ أَنَسٍ قَالَ ", "other"],
    ["أَنَّ رَجُلاً سَأَلَ النَّبِيَّ صلى الله عليه وسلم فَقَالَ ", "other"],
    ["قُلْتُ يَا رَسُولَ اللَّهِ ", "other"],
    ["قَالَ عَلِيُّ بْنُ أَبِي طَالِبٍ ", "other"],
    ["فَقَالَ ", "other"],
    ["قَالَ رَجُلٌ لِلنَّبِيِّ صلى الله عليه وسلم ", "other"],
    ["وَالنَّبِيُّ صلى الله عليه وسلم يَسْمَعُ فَقَالَ أَبُو بَكْرٍ ", "other"],
  ];
  for (const [chain, speaker] of cases) {
    it(`${speaker}: ${chain.trim()}`, () => expect(speakerOf(chain)).toBe(speaker));
  }
});

describe("HADITH_SPLIT kill switch", () => {
  it("on unless set to off", () => {
    expect(hadithSplitEnabled(undefined)).toBe(true);
    expect(hadithSplitEnabled("")).toBe(true);
    expect(hadithSplitEnabled("on")).toBe(true);
    expect(hadithSplitEnabled("off")).toBe(false);
    expect(hadithSplitEnabled(" OFF ")).toBe(false);
  });
});

describe("words-only translation import checks (Phase 2)", () => {
  const stored = text("bukhari:13");
  const words = splitHadith(stored)!.words.trim();
  const id = "11111111-2222-4333-8444-555555555555";
  it("accepts a clean item", () => {
    expect(hadithWordsProblems({ id, words, en: "None of you truly believes until he loves for his brother what he loves for himself.", de: "Keiner von euch glaubt wirklich, bis er für seinen Bruder liebt, was er für sich selbst liebt." }, stored)).toEqual([]);
  });
  it("rejects changed words, missing rows, uncertain splits and bad text", () => {
    expect(hadithWordsProblems({ id, words: "x", en: "ok" }, stored)).toContain("words changed since export");
    expect(hadithWordsProblems({ id, words, en: "ok" }, null)).toEqual(["hadith not found"]);
    expect(hadithWordsProblems({ id: "nope", words, en: "ok" }, stored)).toEqual(["bad id"]);
    expect(hadithWordsProblems({ id, words, en: "ok" }, text("bukhari:101"))).toContain("split no longer certain");
    expect(hadithWordsProblems({ id, words, de: "Keiner von euch glaubt, bis er fuer seinen Bruder liebt" }, stored)).toContain("de: ae/oe/ue instead of real umlauts");
    expect(hadithWordsProblems({ id, words, en: " " }, stored)).toContain("en: empty");
    expect(hadithWordsProblems({ id, words, en: "لا يؤمن" }, stored)).toContain("en: Arabic letters in the translation");
    expect(hadithWordsProblems({ id, words, en: "\"None of you believes\"" }, stored)).toContain("en: wrapped in quotation marks");
    expect(hadithWordsProblems({ id, words }, stored)).toContain("no translation");
  });
});

describe("tail_start (trailing comment after the words)", () => {
  const t = text("bukhari:5887");
  const s = splitHadith(t)!;
  const wordsEnd = s.chain.length + s.open.length + s.words.length;
  const comment = t.slice(t.indexOf("قَالَ أَبُو عَبْدِ"), t.indexOf("قَالَ أَبُو عَبْدِ") + 20);
  it("valid when unique, after the words and at a word boundary", () => {
    expect(tailStartIndex(t, comment, wordsEnd)).toBe(t.indexOf(comment));
  });
  it("rejected inside the words, when repeated, missing, empty or mid-word", () => {
    expect(tailStartIndex(t, s.words.trim().slice(0, 12), wordsEnd)).toBeNull(); // inside the box
    expect(tailStartIndex(t, "بِثَمَانٍ", wordsEnd)).toBeNull(); // occurs more than once
    expect(tailStartIndex(t, "لا يوجد هذا", wordsEnd)).toBeNull();
    expect(tailStartIndex(t, "", wordsEnd)).toBeNull();
    expect(tailStartIndex(t, undefined, wordsEnd)).toBeNull();
    expect(tailStartIndex(t, comment.slice(1), wordsEnd)).toBeNull(); // not at a word start
  });
});

describe("Quran markup cleaner (display only)", () => {
  const examples: [string, string][] = [
    ["muslim:124a", "(6:82)"], ["bukhari:6215", "(3:190)"], ["bukhari:5266", "(33:21)"], ["bukhari:4832", "(47:22)"], ["bukhari:5", "(75:16)"],
  ];
  for (const [ref, label] of examples) {
    it(`${ref}: tag removed, verse kept in its braces, reference ${label} added`, () => {
      const stored = text(ref);
      const before = stored.slice();
      const shown = cleanHadithMarkup(stored);
      expect(shown).not.toContain("[quran");
      expect(shown).not.toContain("aya_start");
      expect(shown).toContain(label);
      expect(stored).toBe(before); // the stored text is never changed
      // Only the tags change: removing them (and the added references) gives the same letters back.
      const letters = (s: string) => s.replace(/\[quran[^\]]*\]/g, "").replace(/\(\d+:\d+(-\d+)?\) ?/g, "").replace(/\s+/g, "");
      expect(letters(shown)).toBe(letters(stored));
    });
  }
  it("Bukhari 5: the reference follows the closing brace of the verse", () => {
    expect(cleanHadithMarkup(text("bukhari:5"))).toMatch(/لِتَعْجَلَ بِهِ‏\} \(75:16\)/);
  });
  it("a range, a tag without braces, translations and plain text", () => {
    expect(cleanHadithMarkup('he recited [quran sura="2" aya_start="1" aya_end="5"]{Alif Lam Mim}.')).toBe("he recited {Alif Lam Mim} (2:1-5).");
    expect(cleanHadithMarkup('قرأ [quran sura="2" aya_start="1" aya_end="1"] ثم')).toBe("قرأ (2:1)  ثم");
    expect(cleanHadithMarkup("لا شيء هنا")).toBe("لا شيء هنا");
  });
  it("a tagged hadith still splits on its original text; each piece is cleaned only for display", () => {
    const stored = text("bukhari:1210");
    const s = splitHadith(stored)!;
    expect(splitRejoins(s, stored)).toBe(true);
    expect([s.chain, s.words, s.tail].join("")).toContain("[quran");
    for (const piece of [s.chain, s.words, s.tail]) expect(cleanHadithMarkup(piece)).not.toContain("[quran");
  });
});

describe("tailParts", () => {
  it("keeps the leading punctuation apart from the narration that follows, losing nothing", () => {
    const tail = splitHadith(text("bukhari:5862"))!.tail;
    const { lead, rest } = tailParts(tail);
    expect(lead + rest).toBe(tail);
    expect(lead).toBe("‏.‏ ");
    expect(plain(rest).startsWith(plain("فَأَعْطَاهُ"))).toBe(true);
    expect(tailParts("‏.‏")).toEqual({ lead: "‏.‏", rest: "" });
  });
});
