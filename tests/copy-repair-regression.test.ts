import { expect, it } from "vitest";
import { sourceCopyMatch, copiesSource, type SourceText } from "@/lib/ask/checks";
import recorded from "./fixtures/recorded-arabic-overlap.json";

it("identifies copied clauses in the recorded Arabic drafts without treating them as a semantic verdict", () => {
  const sources: SourceText[] = recorded.sources.map(s => ({ id: s.id, kind: s.kind as SourceText["kind"], arabic: s.arabic,
    translations: { en: s.translations.en ?? undefined, de: s.translations.de ?? undefined } }));
  expect(recorded.hadith.map(c => sourceCopyMatch(c.text, sources))).toEqual([
    expect.objectContaining({ sourceId: "HE10404", language: "ar", rule: "copied_clause" }),
    null,
  ]);
  expect(recorded.scholar.some(c => sourceCopyMatch(c.text, sources)?.rule === "copied_clause")).toBe(true);
});

it("keeps ordinary technical terms and honorifics without exempting copied clauses", () => {
  const source: SourceText = { id: "S1", kind: "scholar", arabic: "تجب الزكاة عند بلوغ النصاب ومرور الحول والواجب ربع العشر في المال", translations: {} };
  expect(sourceCopyMatch("بين الشيخ رحمه الله أن بلوغ النصاب ومرور الحول شرطان للزكاة", [source])).toBeNull();
  expect(copiesSource("بين الشيخ أن الزكاة واجبة عند بلوغ النصاب ومرور الحول والواجب ربع العشر في المال", [source])).toBe(true);
});

// The corrected wording from the interrupted R01 continuation. This is an
// editorial regression, not an assertion that the sentence has passed meaning review.
const rightsHadith: SourceText = { id: "HE65007", kind: "hadith", translations: {}, arabic:
  "عَنْ مُعَاذٍ رَضِيَ اللَّهُ عَنْهُ، قَالَ: كُنْتُ رِدْفَ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ عَلَى حِمَارٍ يُقَالُ لَهُ عُفَيْرٌ، فَقَالَ: يَا مُعَاذُ، هَلْ تَدْرِي حَقَّ اللَّهِ عَلَى عِبَادِهِ، وَمَا حَقُّ العِبَادِ عَلَى اللَّهِ؟ قُلْتُ: اللَّهُ وَرَسُولُهُ أَعْلَمُ، قَالَ: فَإِنَّ حَقَّ اللَّهِ عَلَى العِبَادِ أَنْ يَعْبُدُوهُ وَلا يُشْرِكُوا بِهِ شَيْئًا، وَحَقَّ العِبَادِ عَلَى اللَّهِ أَنْ لا يُعَذِّبَ مَنْ لا يُشْرِكُ بِهِ شَيْئًا" };

it("does not mistake the recorded hadith paraphrase's short noun phrase for retyping", () => {
  expect(sourceCopyMatch("بين النبي صلى الله عليه وسلم أن حق الله على العباد إفراده بالعبادة وأن حقهم عليه ألا يعذب من لم يشرك به.", [rightsHadith])).toBeNull();
});

it("still rejects full short hadiths, substantial clauses and lightly altered copies", () => {
  expect(copiesSource("أوضح الحديث أن حق العباد على الله أن لا يعذب من لا يشرك به شيئا", [rightsHadith])).toBe(true);
  const source: SourceText = { id: "HE-style-control", kind: "hadith", translations: {}, arabic: "الصبر يعين الإنسان على تحمل المشقة واجتياز الأزمات بثبات" };
  expect(copiesSource("وضح النص أن الصبر يعين الإنسان على تحمل المشقة", [source])).toBe(true);
  expect(copiesSource("الصبر يعين الإنسان على تحمل الصعوبة واجتياز الأزمات بثبات", [source])).toBe(true);
  expect(copiesSource("يبين النص فضل الكلمة الطيبة صدقة", [{ ...source, arabic: "الكلمة الطيبة صدقة" }])).toBe(true);
});

it("allows short shared terminology in other hadith explanations without a source whitelist", () => {
  const source: SourceText = { id: "HE-style-control", kind: "hadith", translations: {}, arabic: "ينال صاحب حسن الخلق مع الناس الثواب الجزيل ويرتفع قدره عند ربه" };
  expect(sourceCopyMatch("يشير الحديث إلى منزلة حسن الخلق مع الناس وأثر التعامل الحسن", [source])).toBeNull();
});
