import fs from "node:fs";
import { HadithExportItem } from "./export-hadith-for-marking";
import { HadithMark, validateSingleMark } from "./validate-hadith-marks";

const batch: HadithExportItem[] = JSON.parse(fs.readFileSync("data/hadith-split/batch-002.json", "utf8"));

function getStartSlice(text: string, marker: string, minWords: number = 3): string {
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`Marker not found: ${marker}`);
  // Take at least 45 chars or until boundary
  let len = Math.max(marker.length, 35);
  while (len < text.length - idx) {
    const candidate = text.slice(idx, idx + len);
    // check single occurrence
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

const defs: Array<[number, string, HadithMark["kind"], string?]> = [
  // 1: bukhari:125
  [0, "بَيْنَا أَنَا أَمْشِي، مَعَ النَّبِيِّ", "prophet_words"],
  // 2: bukhari:127
  [1, "حَدِّثُوا النَّاسَ، بِمَا يَعْرِفُونَ،", "companion_words", "حَدَّثَنَا عُبَيْدُ اللَّهِ بْنُ مُوسَى"],
  // 3: bukhari:128
  [2, "أَنَّ النَّبِيَّ صلى الله عليه وسلم وَمُعَاذٌ رَدِيفُهُ", "dialogue"],
  // 4: bukhari:129
  [3, "ذُكِرَ لِي أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ لِمُعَاذٍ", "dialogue"],
  // 5: bukhari:130
  [4, "جَاءَتْ أُمُّ سُلَيْمٍ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم", "dialogue"],
  // 6: bukhari:131
  [5, "\u200F\"\u200F إِنَّ مِنَ الشَّجَرِ شَجَرَةً", "dialogue"],
  // 7: bukhari:133
  [6, "أَنَّ رَجُلاً، قَامَ فِي الْمَسْجِدِ فَقَالَ", "dialogue"],
  // 8: bukhari:138
  [7, "أَنَّ النَّبِيَّ صلى الله عليه وسلم نَامَ حَتَّى نَفَخَ", "narration"],
  // 9: bukhari:140
  [8, "أَنَّهُ تَوَضَّأَ فَغَسَلَ وَجْهَهُ،", "narration"],
  // 10: bukhari:143
  [9, "أَنَّ النَّبِيَّ صلى الله عليه وسلم دَخَلَ الْخَلاَءَ،", "dialogue"],
  // 11: bukhari:145
  [10, "أَنَّهُ كَانَ يَقُولُ إِنَّ نَاسًا يَقُولُونَ", "narration"],
  // 12: bukhari:146
  [11, "أَنَّ أَزْوَاجَ النَّبِيِّ، صلى الله عليه وسلم كُنَّ يَخْرُجْنَ", "narration"],
  // 13: bukhari:148
  [12, "ارْتَقَيْتُ فَوْقَ ظَهْرِ بَيْتِ حَفْصَةَ", "narration"],
  // 14: bukhari:149
  [13, "لَقَدْ ظَهَرْتُ ذَاتَ يَوْمٍ عَلَى ظَهْرِ بَيْتِنَا،", "narration"],
  // 15: bukhari:150
  [14, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا خَرَجَ لِحَاجَتِهِ", "narration"],
  // 16: bukhari:151
  [15, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِذَا خَرَجَ لِحَاجَتِهِ", "narration"],
  // 17: bukhari:152
  [16, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَدْخُلُ الْخَلاَءَ،", "narration", "تَابَعَهُ النَّضْرُ وَشَاذَانُ عَنْ شُعْبَةَ‏.‏"],
  // 18: bukhari:157
  [17, "تَوَضَّأَ النَّبِيُّ صلى الله عليه وسلم مَرَّةً مَرَّةً‏.‏", "narration"],
  // 19: bukhari:158
  [18, "أَنَّ النَّبِيَّ صلى الله عليه وسلم تَوَضَّأَ مَرَّتَيْنِ مَرَّتَيْنِ‏.‏", "narration"],
  // 20: bukhari:160
  [19, "فَلَمَّا تَوَضَّأَ عُثْمَانُ قَالَ أَلاَ أُحَدِّثُكُمْ", "companion_words"],
  // 21: bukhari:166
  [20, "يَا أَبَا عَبْدِ الرَّحْمَنِ، رَأَيْتُكَ تَصْنَعُ أَرْبَعًا", "dialogue"],
  // 22: bukhari:168
  [21, "كَانَ النَّبِيُّ صلى الله عليه وسلم يُعْجِبُهُ التَّيَمُّنُ", "narration"],
  // 23: bukhari:169
  [22, "رَأَيْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم وَحَانَتْ صَلاَةُ الْعَصْرِ،", "narration"],
  // 24: bukhari:170
  [23, "قُلْتُ لِعَبِيدَةَ عِنْدَنَا مِنْ شَعَرِ النَّبِيِّ", "dialogue"],
  // 25: bukhari:171
  [24, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم لَمَّا حَلَقَ رَأْسَهُ", "narration"],
  // 26: bukhari:174
  [25, "كَانَتِ الْكِلاَبُ تَبُولُ وَتُقْبِلُ وَتُدْبِرُ فِي الْمَسْجِدِ", "narration"],
  // 27: bukhari:175
  [26, "\u200F\"\u200F إِذَا أَرْسَلْتَ كَلْبَكَ الْمُعَلَّمَ", "prophet_words"],
  // 28: bukhari:179
  [27, "أَرَأَيْتَ إِذَا جَامَعَ فَلَمْ يُمْنِ قَالَ عُثْمَانُ", "dialogue"],
  // 29: bukhari:180
  [28, "أَرْسَلَ إِلَى رَجُلٍ مِنَ الأَنْصَارِ فَجَاءَ وَرَأْسُهُ يَقْطُرُ،", "dialogue", "تَابَعَهُ وَهْبٌ قَالَ حَدَّثَنَا شُعْبَةُ‏.‏"],
  // 30: bukhari:182
  [29, "أَنَّهُ كَانَ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم فِي سَفَرٍ،", "narration"],
  // 31: bukhari:183
  [30, "أَنَّهُ، بَاتَ لَيْلَةً عِنْدَ مَيْمُونَةَ زَوْجِ النَّبِيِّ", "narration"],
  // 32: bukhari:185
  [31, "أَتَسْتَطِيعُ أَنْ تُرِيَنِي، كَيْفَ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَتَوَضَّأُ", "dialogue"],
  // 33: bukhari:186
  [32, "شَهِدْتُ عَمْرَو بْنَ أَبِي حَسَنٍ سَأَلَ عَبْدَ اللَّهِ بْنَ زَيْدٍ عَنْ وُضُوءِ النَّبِيِّ،", "dialogue"],
  // 34: bukhari:187
  [33, "خَرَجَ عَلَيْنَا رَسُولُ اللَّهِ صلى الله عليه وسلم بِالْهَاجِرَةِ،", "narration"],
  // 35: bukhari:188
  [34, "دَعَا النَّبِيُّ صلى الله عليه وسلم بِقَدَحٍ فِيهِ مَاءٌ، فَغَسَلَ يَدَيْهِ", "narration"],
  // 36: bukhari:189
  [35, "وَهُوَ الَّذِي مَجَّ رَسُولُ اللَّهِ صلى الله عليه وسلم فِي وَجْهِهِ", "narration"],
  // 37: bukhari:190
  [36, "ذَهَبَتْ بِي خَالَتِي إِلَى النَّبِيِّ صلى الله عليه وسلم فَقَالَتْ", "narration"],
  // 38: bukhari:191
  [37, "أَنَّهُ أَفْرَغَ مِنَ الإِنَاءِ عَلَى يَدَيْهِ فَغَسَلَهُمَا،", "narration"],
  // 39: bukhari:192
  [38, "شَهِدْتُ عَمْرَو بْنَ أَبِي حَسَنٍ سَأَلَ عَبْدَ اللَّهِ بْنَ زَيْدٍ عَنْ وُضُوءِ النَّبِيِّ،", "dialogue", "وَحَدَّثَنَا مُوسَى قَالَ حَدَّثَنَا وُهَيْبٌ"],
  // 40: bukhari:193
  [39, "كَانَ الرِّجَالُ وَالنِّسَاءُ يَتَوَضَّئُونَ فِي زَمَانِ رَسُولِ اللَّهِ صلى الله عليه وسلم", "narration"],
  // 41: bukhari:194
  [40, "جَاءَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَعُودُنِي، وَأَنَا مَرِيضٌ", "narration"],
  // 42: bukhari:195
  [41, "حَضَرَتِ الصَّلاَةُ، فَقَامَ مَنْ كَانَ قَرِيبَ الدَّارِ إِلَى أَهْلِهِ،", "narration"],
  // 43: bukhari:196
  [42, "أَنَّ النَّبِيَّ صلى الله عليه وسلم دَعَا بِقَدَحٍ فِيهِ مَاءٌ،", "narration"],
  // 44: bukhari:197
  [43, "أَتَى رَسُولُ اللَّهِ صلى الله عليه وسلم فَأَخْرَجْنَا لَهُ مَاءً", "narration"],
  // 45: bukhari:199
  [44, "كَانَ عَمِّي يُكْثِرُ مِنَ الْوُضُوءِ، قَالَ لِعَبْدِ اللَّهِ بْنِ زَيْدٍ", "dialogue"],
  // 46: bukhari:200
  [45, "أَنَّ النَّبِيَّ صلى الله عليه وسلم دَعَا بِإِنَاءٍ مِنْ مَاءٍ،", "narration"],
  // 47: bukhari:201
  [46, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَغْسِلُ ـ أَوْ كَانَ يَغْتَسِلُ ـ", "narration"],
  // 48: bukhari:202
  [47, "أَنَّهُ مَسَحَ عَلَى الْخُفَّيْنِ‏.‏", "narration", "وَقَالَ مُوسَى بْنُ عُقْبَةَ أَخْبَرَنِي أَبُو النَّضْرِ"],
  // 49: bukhari:203
  [48, "أَنَّهُ خَرَجَ لِحَاجَتِهِ فَاتَّبَعَهُ الْمُغِيرَةُ بِإِدَاوَةٍ", "narration"],
  // 50: bukhari:204
  [49, "أَنَّهُ، رَأَى النَّبِيَّ صلى الله عليه وسلم يَمْسَحُ عَلَى الْخُفَّيْنِ‏.‏", "narration", "وَتَابَعَهُ حَرْبُ بْنُ شَدَّادٍ وَأَبَانُ عَنْ يَحْيَى‏.‏"],
  // 51: bukhari:205
  [50, "رَأَيْتُ النَّبِيَّ صلى الله عليه وسلم يَمْسَحُ عَلَى عِمَامَتِهِ وَخُفَّيْهِ‏.‏", "narration", "وَتَابَعَهُ مَعْمَرٌ عَنْ يَحْيَى عَنْ أَبِي سَلَمَةَ"],
  // 52: bukhari:207
  [51, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَكَلَ كَتِفَ شَاةٍ،", "narration"],
  // 53: bukhari:208
  [52, "أَنَّهُ، رَأَى رَسُولَ اللَّهِ صلى الله عليه وسلم يَحْتَزُّ مِنْ كَتِفِ شَاةٍ،", "narration"],
  // 54: bukhari:209
  [53, "أَنَّهُ، خَرَجَ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم عَامَ خَيْبَرَ،", "narration"],
  // 55: bukhari:210
  [54, "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَكَلَ عِنْدَهَا كَتِفًا،", "narration"],
  // 56: bukhari:214
  [55, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَتَوَضَّأُ عِنْدَ كُلِّ صَلاَةٍ‏.‏", "narration"],
  // 57: bukhari:215
  [56, "خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم عَامَ خَيْبَرَ،", "narration"],
  // 58: bukhari:216
  [57, "مَرَّ النَّبِيُّ صلى الله عليه وسلم بِحَائِطٍ مِنْ حِيطَانِ الْمَدِينَةِ", "narration"],
  // 59: bukhari:217
  [58, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا تَبَرَّزَ لِحَاجَتِهِ أَتَيْتُهُ بِمَاءٍ", "narration"],
  // 60: bukhari:218
  [59, "مَرَّ النَّبِيُّ صلى الله عليه وسلم بِقَبْرَيْنِ فَقَالَ", "narration", "قَالَ ابْنُ الْمُثَنَّى وَحَدَّثَنَا وَكِيعٌ"],
];

const marks: HadithMark[] = [];
let hasError = false;

for (const [idx, marker, kind, tailMarker] of defs) {
  const item = batch[idx];
  const t = item.text_original;
  const start = getStartSlice(t, marker);
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
  console.error("Batch 2 marks had validation errors!");
  process.exit(1);
}

fs.writeFileSync("data/hadith-split/marks-002.json", JSON.stringify(marks, null, 2), "utf8");
console.log(`Successfully generated and validated ${marks.length} marks for batch 2! Saved to data/hadith-split/marks-002.json`);
