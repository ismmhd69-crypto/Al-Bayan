import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
type Spec = { start: string | null; kind: Kind; tail_start?: string };

const specs: Spec[] = [
  { start: "لاَ تُوَاصِلُوا", kind: "prophet_words" },
  { start: "لاَ تُوَاصِلُوا، فَأَيُّكُمْ", kind: "prophet_words" },
  { start: "نَهَى رَسُولُ اللَّهِ صلى الله عليه وسلم", kind: "companion_words" },
  { start: "إِيَّاكُمْ وَالْوِصَالَ", kind: "prophet_words" },
  { start: "لاَ تُوَاصِلُوا، فَأَيُّكُمْ أَرَادَ", kind: "prophet_words" },
  { start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَصُومُ", kind: "narration" },
  { start: "مَا صَامَ النَّبِيُّ صلى الله عليه وسلم", kind: "companion_words" },
  { start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يُفْطِرُ", kind: "narration", tail_start: "وَقَالَ سُلَيْمَانُ عَنْ حُمَيْدٍ" },
  { start: "مَا كُنْتُ أُحِبُّ أَنْ أَرَاهُ", kind: "companion_words" },
  { start: "دَخَلَ عَلَىَّ رَسُولُ اللَّهِ صلى الله عليه وسلم", kind: "dialogue" },
  { start: "يَا عَبْدَ اللَّهِ أَلَمْ أُخْبَرْ", kind: "dialogue" },
  { start: "أُخْبِرَ رَسُولُ اللَّهِ صلى الله عليه وسلم", kind: "dialogue" },
  { start: "بَلَغَ النَّبِيَّ صلى الله عليه وسلم", kind: "dialogue" },
  { start: "صُمْ مِنَ الشَّهْرِ ثَلاَثَةَ أَيَّامٍ", kind: "prophet_words" },
  { start: "إِنَّكَ لَتَصُومُ الدَّهْرَ", kind: "dialogue" },
  { start: "ذُكِرَ لَهُ صَوْمِي فَدَخَلَ عَلَىَّ", kind: "dialogue" },
  { start: "أَوْصَانِي خَلِيلِي صلى الله عليه وسلم", kind: "companion_words" },
  { start: "دَخَلَ النَّبِيُّ صلى الله عليه وسلم عَلَى أُمِّ سُلَيْمٍ", kind: "narration", tail_start: "حَدَّثَنَا ابْنُ أَبِي مَرْيَمَ" },
  { start: "أَنَّهُ سَأَلَهُ", kind: "dialogue", tail_start: "لَمْ يَقُلِ الصَّلْتُ" },
  { start: "نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْجُمُعَةِ", kind: "companion_words" },
  { start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم دَخَلَ عَلَيْهَا", kind: "dialogue", tail_start: "وَقَالَ حَمَّادُ بْنُ الْجَعْدِ" },
  { start: "هَلْ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَخْتَصُّ", kind: "companion_words" },
  { start: "أَنَّ أُمَّ، الْفَضْلِ حَدَّثَتْهُ", kind: "companion_words" },
  { start: "أَنَّ النَّاسَ، شَكُّوا فِي صِيَامِ النَّبِيِّ", kind: "narration" },
  { start: "شَهِدْتُ الْعِيدَ مَعَ عُمَرَ بْنِ الْخَطَّابِ", kind: "companion_words", tail_start: "قَالَ أَبُو عَبْد اللَّهِ" },
  { start: "نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْفِطْرِ", kind: "companion_words" },
  { start: "يُنْهَى عَنْ صِيَامَيْنِ، وَبَيْعَتَيْنِ", kind: "companion_words" },
  { start: "جَاءَ رَجُلٌ إِلَى ابْنِ عُمَرَ", kind: "dialogue" },
  { start: "كَانَتْ، عَائِشَةُ ـ رضى الله عنها ـ تَصُومُ", kind: "companion_words" },
  { start: "لَمْ يُرَخَّصْ فِي أَيَّامِ التَّشْرِيقِ", kind: "companion_words" },
  { start: "الصِّيَامُ لِمَنْ تَمَتَّعَ بِالْعُمْرَةِ", kind: "companion_words", tail_start: "تَابَعَهُ إِبْرَاهِيمُ بْنُ سَعْدٍ" },
  { start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم أَمَرَ بِصِيَامِ يَوْمِ عَاشُورَاءَ", kind: "narration" },
  { start: "كَانَ يَوْمُ عَاشُورَاءَ تَصُومُهُ قُرَيْشٌ", kind: "narration" },
  { start: "قَدِمَ النَّبِيُّ صلى الله عليه وسلم الْمَدِينَةَ", kind: "dialogue" },
  { start: "مَا رَأَيْتُ النَّبِيَّ صلى الله عليه وسلم يَتَحَرَّى", kind: "companion_words" },
  { start: "خَرَجْتُ مَعَ عُمَرَ بْنِ الْخَطَّابِ", kind: "companion_words" },
  { start: "صَلَّى وَذَلِكَ فِي رَمَضَانَ", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا دَخَلَ الْعَشْرُ", kind: "narration" },
  { start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَعْتَكِفُ الْعَشْرَ الأَوَاخِرَ", kind: "narration" },
  { start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ يَعْتَكِفُ", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُصْغِي إِلَىَّ رَأْسَهُ", kind: "narration" },
  { start: "وَإِنْ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَيُدْخِلُ", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُبَاشِرُنِي", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يَعْتَكِفُ فِي الْعَشْرِ الأَوَاخِرِ", kind: "narration" },
  { start: "أَنَّ صَفِيَّةَ، زَوْجَ النَّبِيِّ صلى الله عليه وسلم أَخْبَرَتْهُ أَنَّهَا جَاءَتْ", kind: "narration" },
  { start: "اعْتَكَفَتْ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم فِي الْمَسْجِدِ، وَعِنْدَهُ أَزْوَاجُهُ", kind: "dialogue" },
  { start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَعْتَكِفُ فِي كُلِّ رَمَضَانَ", kind: "narration" },
  { start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يَعْتَكِفُ فِي كُلِّ رَمَضَانَ عَشْرَةَ أَيَّامٍ", kind: "narration" },
  { start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم ذَكَرَ أَنْ يَعْتَكِفَ", kind: "narration" },
  { start: "أَنَّهَا كَانَتْ تُرَجِّلُ النَّبِيَّ صلى الله عليه وسلم", kind: "narration" },
  { start: "إِنَّكُمْ تَقُولُونَ إِنَّ أَبَا هُرَيْرَةَ يُكْثِرُ الْحَدِيثَ", kind: "companion_words" },
  { start: "لَمَّا قَدِمْنَا الْمَدِينَةَ آخَى رَسُولُ اللَّهِ صلى الله عليه وسلم", kind: "dialogue" },
  { start: "قَدِمَ عَبْدُ الرَّحْمَنِ بْنُ عَوْفٍ الْمَدِينَةَ", kind: "dialogue" },
  { start: "كَانَتْ عُكَاظٌ وَمَجَنَّةُ وَذُو الْمَجَازِ أَسْوَاقًا", kind: "companion_words" },
  { start: "كَانَ عُتْبَةُ بْنُ أَبِي وَقَّاصٍ عَهِدَ", kind: "dialogue" },
  { start: "سَأَلْتُ النَّبِيَّ صلى الله عليه وسلم عَنِ الْمِعْرَاضِ", kind: "dialogue" },
  { start: "مَرَّ النَّبِيُّ صلى الله عليه وسلم بِتَمْرَةٍ مَسْقُوطَةٍ", kind: "narration", tail_start: "وَقَالَ هَمَّامٌ عَنْ أَبِي هُرَيْرَةَ" },
  { start: "بَيْنَمَا نَحْنُ نُصَلِّي مَعَ النَّبِيِّ صلى الله عليه وسلم", kind: "companion_words" },
  { start: "أَنَّ أَبَا مُوسَى الأَشْعَرِيَّ، اسْتَأْذَنَ عَلَى عُمَرَ", kind: "dialogue" },
];

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-021.json", "utf8"));
if (batch.length !== specs.length) throw new Error(`Expected ${specs.length} items, got ${batch.length}`);

// These five records use a slightly different Arabic combining-mark form in the source.
// Take the exact source substring while preserving the same intended boundary.
const exact = (text: string, token: string, endToken: string, backToken?: string) => {
  const tokenIndex = text.indexOf(token);
  if (tokenIndex < 0) throw new Error(`Could not find source token: ${token}`);
  const startIndex = backToken ? text.lastIndexOf(backToken, tokenIndex) : tokenIndex;
  const endIndex = text.indexOf(endToken, tokenIndex);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not build exact source substring for ${token}`);
  return text.slice(startIndex, endIndex);
};

specs[12].start = exact(batch[12].text_original, "بَلَغَ", " أَنِّي");
specs[15].start = exact(batch[15].text_original, "ذُكِرَ", " فَدَخَلَ");
specs[20].start = exact(batch[20].text_original, "أَنَّ النَّبِيَّ", " دَخَلَ عَلَيْهَا");
specs[24].start = exact(batch[24].text_original, "شَهِدْتُ", " فَقَالَ");
specs[54].start = exact(batch[54].text_original, "عُكَاظ", "،", "كَانَتْ");

const marks = batch.map((item: any, i: number) => ({ id: item.id, url: item.url, ...specs[i] }));
fs.writeFileSync("data/hadith-split/marks-021.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-021.json`);
