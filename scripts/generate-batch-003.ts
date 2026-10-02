import fs from "node:fs";
import { HadithExportItem } from "./export-hadith-for-marking";
import { HadithMark, validateSingleMark } from "./validate-hadith-marks";

const batch: HadithExportItem[] = JSON.parse(fs.readFileSync("data/hadith-split/batch-003.json", "utf8"));

function getStartSlice(text: string, marker: string): string {
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`Marker not found: ${marker}`);
  let len = Math.max(marker.length, 35);
  while (len < text.length - idx) {
    const candidate = text.slice(idx, idx + len);
    if (text.split(candidate).length === 2) {
      return candidate;
    }
    len += 5;
  }
  return text.slice(idx);
}

function getTailSlice(text: string, marker: string): string {
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`Tail marker not found: ${marker}`);
  let len = Math.max(marker.length, 30);
  while (len < text.length - idx) {
    const candidate = text.slice(idx, idx + len);
    if (text.split(candidate).length === 2) {
      return candidate;
    }
    len += 5;
  }
  return text.slice(idx);
}

const defs: Array<[number, string | null, HadithMark["kind"], string?]> = [
  // 1: bukhari:221
  [0, null, "reference_only"],
  // 2: bukhari:222
  [1, "أُتِيَ رَسُولُ اللَّهِ صلى الله عليه وسلم بِصَبِيٍّ،", "narration"],
  // 3: bukhari:223
  [2, "أَنَّهَا أَتَتْ بِابْنٍ لَهَا صَغِيرٍ،", "narration"],
  // 4: bukhari:224
  [3, "أَتَى النَّبِيُّ صلى الله عليه وسلم سُبَاطَةَ قَوْمٍ", "narration"],
  // 5: bukhari:225
  [4, "رَأَيْتُنِي أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم نَتَمَاشَى،", "narration"],
  // 6: bukhari:226
  [5, "كَانَ أَبُو مُوسَى الأَشْعَرِيُّ يُشَدِّدُ فِي الْبَوْلِ", "companion_words"],
  // 7: bukhari:228
  [6, "جَاءَتْ فَاطِمَةُ ابْنَةُ أَبِي حُبَيْشٍ إِلَى النَّبِيِّ", "dialogue"],
  // 8: bukhari:229
  [7, "كُنْتُ أَغْسِلُ الْجَنَابَةَ مِنْ ثَوْبِ النَّبِيِّ صلى الله عليه وسلم،", "narration"],
  // 9: bukhari:230
  [8, "سَأَلْتُ عَائِشَةَ عَنِ الْمَنِيِّ، يُصِيبُ الثَّوْبَ", "dialogue"],
  // 10: bukhari:231
  [9, "سَأَلْتُ سُلَيْمَانَ بْنَ يَسَارٍ فِي الثَّوْبِ تُصِيبُهُ الْجَنَابَةُ", "dialogue"],
  // 11: bukhari:232
  [10, "أَنَّهَا كَانَتْ تَغْسِلُ الْمَنِيَّ مِنْ ثَوْبِ النَّبِيِّ", "narration"],
  // 12: bukhari:233
  [11, "قَدِمَ أُنَاسٌ مِنْ عُكْلٍ أَوْ عُرَيْنَةَ،", "narration", "قَالَ أَبُو قِلاَبَةَ فَهَؤُلاَءِ سَرَقُوا وَقَتَلُوا"],
  // 13: bukhari:234
  [12, "كَانَ النَّبِيُّ صلى الله عليه وسلم يُصَلِّي قَبْلَ أَنْ يُبْنَى الْمَسْجِدُ", "narration"],
  // 14: bukhari:239
  [13, "\u200F\"\u200F لاَ يَبُولَنَّ أَحَدُكُمْ فِي الْمَاءِ الدَّائِمِ", "prophet_words"],
  // 15: bukhari:240
  [14, "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ يُصَلِّي عِنْدَ الْبَيْتِ،", "narration"],
  // 16: bukhari:241
  [15, "بَزَقَ النَّبِيُّ صلى الله عليه وسلم فِي ثَوْبِهِ‏.‏", "narration", "طَوَّلَهُ ابْنُ أَبِي مَرْيَمَ قَالَ أَخْبَرَنَا يَحْيَى"],
  // 17: bukhari:243
  [16, "وَسَأَلَهُ النَّاسُ، وَمَا بَيْنِي وَبَيْنَهُ أَحَدٌ", "companion_words"],
  // 18: bukhari:245
  [17, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا قَامَ مِنَ اللَّيْلِ", "narration"],
  // 19: bukhari:247
  [18, "\u200F\"\u200F إِذَا أَتَيْتَ مَضْجَعَكَ فَتَوَضَّأْ وُضُوءَكَ لِلصَّلاَةِ،", "dialogue"],
  // 20: bukhari:248
  [19, "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ إِذَا اغْتَسَلَ مِنَ الْجَنَابَةِ", "narration"],
  // 21: bukhari:249
  [20, "تَوَضَّأَ رَسُولُ اللَّهِ صلى الله عليه وسلم وُضُوءَهُ لِلصَّلاَةِ", "narration"],
  // 22: bukhari:250
  [21, "كُنْتُ أَغْتَسِلُ أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم مِنْ إِنَاءٍ وَاحِدٍ", "narration"],
  // 23: bukhari:251
  [22, "دَخَلْتُ أَنَا وَأَخُو، عَائِشَةَ عَلَى عَائِشَةَ", "narration", "قَالَ أَبُو عَبْدِ اللَّهِ قَالَ يَزِيدُ بْنُ هَارُونَ"],
  // 24: bukhari:252
  [23, "أَنَّهُ كَانَ عِنْدَ جَابِرِ بْنِ عَبْدِ اللَّهِ هُوَ وَأَبُوهُ،", "dialogue"],
  // 25: bukhari:253
  [24, "أَنَّ النَّبِيَّ صلى الله عليه وسلم وَمَيْمُونَةَ كَانَا يَغْتَسِلاَنِ", "narration", "قَالَ أَبُو عَبْدِ اللَّهِ كَانَ ابْنُ عُيَيْنَةَ"],
  // 26: bukhari:255
  [25, "كَانَ النَّبِيُّ صلى الله عليه وسلم يُفْرِغُ عَلَى رَأْسِهِ ثَلاَثًا‏.‏", "narration"],
  // 27: bukhari:256
  [26, "أَتَانِي ابْنُ عَمِّكَ يُعَرِّضُ بِالْحَسَنِ بْنِ مُحَمَّدٍ", "dialogue"],
  // 28: bukhari:257
  [27, "وَضَعْتُ لِلنَّبِيِّ صلى الله عليه وسلم مَاءً لِلْغُسْلِ،", "narration"],
  // 29: bukhari:258
  [28, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا اغْتَسَلَ مِنَ الْجَنَابَةِ دَعَا", "narration"],
  // 30: bukhari:259
  [29, "صَبَبْتُ لِلنَّبِيِّ صلى الله عليه وسلم غُسْلاً،", "narration"],
  // 31: bukhari:260
  [30, "أَنَّ النَّبِيَّ صلى الله عليه وسلم اغْتَسَلَ مِنَ الْجَنَابَةِ،", "narration"],
  // 32: bukhari:261
  [31, "كُنْتُ أَغْتَسِلُ أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم مِنْ إِنَاءٍ وَاحِدٍ تَخْتَلِفُ", "narration"],
  // 33: bukhari:262
  [32, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِذَا اغْتَسَلَ مِنَ الْجَنَابَةِ غَسَلَ يَدَهُ‏.‏", "narration"],
  // 34: bukhari:263
  [33, "كُنْتُ أَغْتَسِلُ أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم مِنْ إِنَاءٍ وَاحِدٍ مِنْ جَنَابَةٍ‏.‏", "narration", "وَعَنْ عَبْدِ الرَّحْمَنِ بْنِ الْقَاسِمِ عَنْ أَبِيهِ"],
  // 35: bukhari:264
  [34, "كَانَ النَّبِيُّ صلى الله عليه وسلم وَالْمَرْأَةُ مِنْ نِسَائِهِ يَغْتَسِلاَنِ", "narration", "زَادَ مُسْلِمٌ وَوَهْبٌ عَنْ شُعْبَةَ"],
  // 36: bukhari:265
  [35, "وَضَعْتُ لِرَسُولِ اللَّهِ صلى الله عليه وسلم مَاءً يَغْتَسِلُ بِهِ،", "narration"],
  // 37: bukhari:266
  [36, "وَضَعْتُ لِرَسُولِ اللَّهِ صلى الله عليه وسلم غُسْلاً وَسَتَرْتُهُ،", "narration"],
  // 38: bukhari:267
  [37, "ذَكَرْتُهُ لِعَائِشَةَ فَقَالَتْ يَرْحَمُ اللَّهُ أَبَا عَبْدِ الرَّحْمَنِ،", "companion_words"],
  // 39: bukhari:268
  [38, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَدُورُ عَلَى نِسَائِهِ", "dialogue", "وَقَالَ سَعِيدٌ عَنْ قَتَادَةَ إِنَّ أَنَسًا"],
  // 40: bukhari:270
  [39, "سَأَلْتُ عَائِشَةَ فَذَكَرْتُ لَهَا قَوْلَ ابْنِ عُمَرَ", "dialogue"],
  // 41: bukhari:271
  [40, "كَأَنِّي أَنْظُرُ إِلَى وَبِيصِ الطِّيبِ فِي مَفْرِقِ النَّبِيِّ", "companion_words"],
  // 42: bukhari:272
  [41, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِذَا اغْتَسَلَ مِنَ الْجَنَابَةِ غَسَلَ يَدَيْهِ،", "narration"],
  // 43: bukhari:274
  [42, "وَضَعَ رَسُولُ اللَّهِ صلى الله عليه وسلم وَضُوءًا لِجَنَابَةٍ", "narration"],
  // 44: bukhari:276
  [43, "وَضَعْتُ لِلنَّبِيِّ صلى الله عليه وسلم غُسْلاً، فَسَتَرْتُهُ بِثَوْبٍ،", "narration"],
  // 45: bukhari:277
  [44, "كُنَّا إِذَا أَصَابَتْ إِحْدَانَا جَنَابَةٌ، أَخَذَتْ بِيَدَيْهَا", "companion_words"],
  // 46: bukhari:279
  [45, "\u200F\"\u200F بَيْنَا أَيُّوبُ يَغْتَسِلُ عُرْيَانًا", "prophet_words", "وَرَوَاهُ إِبْرَاهِيمُ عَنْ مُوسَى بْنِ عُقْبَةَ"],
  // 47: bukhari:281
  [46, "سَتَرْتُ النَّبِيَّ صلى الله عليه وسلم وَهُوَ يَغْتَسِلُ مِنَ الْجَنَابَةِ،", "narration", "تَابَعَهُ أَبُو عَوَانَةَ وَابْنُ فُضَيْلٍ فِي السَّتْرِ‏.‏"],
  // 48: bukhari:283
  [47, "أَنَّ النَّبِيَّ صلى الله عليه وسلم لَقِيَهُ فِي بَعْضِ طَرِيقِ الْمَدِينَةِ", "dialogue"],
  // 49: bukhari:284
  [48, "أَنَّ نَبِيَّ اللَّهِ صلى الله عليه وسلم كَانَ يَطُوفُ عَلَى نِسَائِهِ", "narration"],
  // 50: bukhari:285
  [49, "لَقِيَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم وَأَنَا جُنُبٌ،", "dialogue"],
  // 51: bukhari:286
  [50, "سَأَلْتُ عَائِشَةَ أَكَانَ النَّبِيُّ صلى الله عليه وسلم يَرْقُدُ", "dialogue"],
  // 52: bukhari:288
  [51, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا أَرَادَ أَنْ يَنَامَ وَهْوَ جُنُبٌ،", "narration"],
  // 53: bukhari:291
  [52, "\u200F\"\u200F إِذَا جَلَسَ بَيْنَ شُعَبِهَا الأَرْبَعِ", "prophet_words", "تَابَعَهُ عَمْرُو بْنُ مَرْزُوقٍ عَنْ شُعْبَةَ مِثْلَهُ‏.‏"],
  // 54: bukhari:292
  [53, "أَنَّهُ، سَأَلَ عُثْمَانَ بْنَ عَفَّانَ فَقَالَ أَرَأَيْتَ إِذَا جَامَعَ الرَّجُلُ", "dialogue"],
  // 55: bukhari:294
  [54, "خَرَجْنَا لاَ نَرَى إِلاَّ الْحَجَّ، فَلَمَّا كُنَّا بِسَرِفَ حِضْتُ،", "dialogue"],
  // 56: bukhari:295
  [55, "كُنْتُ أُرَجِّلُ رَأْسَ رَسُولِ اللَّهِ صلى الله عليه وسلم وَأَنَا حَائِضٌ‏.‏", "companion_words"],
  // 57: bukhari:296
  [56, "سُئِلَ أَتَخْدُمُنِي الْحَائِضُ أَوْ تَدْنُو مِنِّي الْمَرْأَةُ", "companion_words"],
  // 58: bukhari:297
  [57, "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ يَتَّكِئُ فِي حَجْرِي", "companion_words"],
  // 59: bukhari:299
  [58, "كُنْتُ أَغْتَسِلُ أَنَا وَالنَّبِيُّ، صلى الله عليه وسلم مِنْ إِنَاءٍ وَاحِدٍ،", "companion_words"],
  // 60: bukhari:302
  [59, "كَانَتْ إِحْدَانَا إِذَا كَانَتْ حَائِضًا، فَأَرَادَ رَسُولُ اللَّهِ صلى الله عليه وسلم", "companion_words", "تَابَعَهُ خَالِدٌ وَجَرِيرٌ عَنِ الشَّيْبَانِيِّ‏.‏"],
];

const marks: HadithMark[] = [];
let hasError = false;

for (const [idx, marker, kind, tailMarker] of defs) {
  const item = batch[idx];
  const t = item.text_original;
  const start = marker ? getStartSlice(t, marker) : null;
  const tail_start = tailMarker ? getTailSlice(t, tailMarker) : undefined;
  const mark: HadithMark = {
    id: item.id,
    url: item.url,
    start,
    kind,
    tail_start,
  };
  const val = validateSingleMark(mark, t);
  if (!val.valid) {
    console.error(`Validation failed for [${item.url}]: ${val.error}`);
    hasError = true;
  }
  marks.push(mark);
}

if (hasError) {
  console.error("Batch 3 marks had validation errors!");
  process.exit(1);
}

fs.writeFileSync("data/hadith-split/marks-003.json", JSON.stringify(marks, null, 2), "utf8");
console.log(`Successfully generated and validated ${marks.length} marks for batch 3! Saved to data/hadith-split/marks-003.json`);
