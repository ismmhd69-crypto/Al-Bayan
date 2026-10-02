import fs from "fs";
import { HadithMark, validateSingleMark } from "./validate-hadith-marks";

function getStartSlice(text: string, marker: string, minLength = 30): string {
  const idx = text.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Marker "${marker}" not found in text: "${text.slice(0, 100)}..."`);
  }
  return text.slice(idx, idx + Math.max(minLength, marker.length));
}

function getTailSlice(text: string, marker: string, minLength = 30): string {
  const idx = text.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Tail marker "${marker}" not found in text: "...${text.slice(-100)}"`);
  }
  return text.slice(idx, idx + Math.max(minLength, marker.length));
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-010.json", "utf8"));

// [batchIndex, startMarker | null, kind, tailMarker?]
const defs: [number, string | null, HadithMark["kind"], string?][] = [
  // 1: bukhari:893
  [0, "\u200F\"\u200F كُلُّكُمْ رَاعٍ ‏\"‏‏.‏", "prophet_words", "وَزَادَ اللَّيْثُ قَالَ يُونُسُ"],
  // 2: bukhari:896
  [1, batch[1].text_original.slice(186, 230), "prophet_words"],
  // 3: bukhari:901
  [2, "إِذَا قُلْتَ أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ‏.‏", "dialogue"],
  // 4: bukhari:903
  [3, "كَانَ النَّاسُ مَهَنَةَ أَنْفُسِهِمْ،", "companion_words"],
  // 5: bukhari:904
  [4, "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ يُصَلِّي الْجُمُعَةَ حِينَ تَمِيلُ الشَّمْسُ‏.‏", "narration"],
  // 6: bukhari:905
  [5, "كُنَّا نُبَكِّرُ بِالْجُمُعَةِ، وَنَقِيلُ بَعْدَ الْجُمُعَةِ‏.‏", "companion_words"],
  // 7: bukhari:906
  [6, "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا اشْتَدَّ الْبَرْدُ بَكَّرَ بِالصَّلاَةِ،", "narration", "قَالَ يُونُسُ بْنُ بُكَيْرٍ"],
  // 8: bukhari:911
  [7, "نَهَى النَّبِيُّ صلى الله عليه وسلم أَنْ يُقِيمَ الرَّجُلُ أَخَاهُ", "dialogue"],
  // 9: bukhari:912
  [8, "كَانَ النِّدَاءُ يَوْمَ الْجُمُعَةِ أَوَّلُهُ إِذَا جَلَسَ الإِمَامُ عَلَى الْمِنْبَرِ", "companion_words", "قال أبو عبد الله : الزوراء"],
  // 10: bukhari:913
  [9, "أَنَّ الَّذِي، زَادَ التَّأْذِينَ الثَّالِثَ يَوْمَ الْجُمُعَةِ عُثْمَانُ بْنُ عَفَّانَ", "companion_words"],
  // 11: bukhari:914
  [10, "أَذَّنَ الْمُؤَذِّنُ قَالَ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ‏.‏", "dialogue"],
  // 12: bukhari:915
  [11, "أَنَّ التَّأْذِينَ الثَّانِيَ يَوْمَ الْجُمُعَةِ أَمَرَ بِهِ عُثْمَانُ", "companion_words"],
  // 13: bukhari:916
  [12, "إِنَّ الأَذَانَ يَوْمَ الْجُمُعَةِ كَانَ أَوَّلُهُ حِينَ يَجْلِسُ الإِمَامُ", "companion_words"],
  // 14: bukhari:917
  [13, "أَنَّ رِجَالاً، أَتَوْا سَهْلَ بْنَ سَعْدٍ السَّاعِدِيَّ،", "dialogue"],
  // 15: bukhari:918
  [14, "كَانَ جِذْعٌ يَقُومُ إِلَيْهِ النَّبِيُّ صلى الله عليه وسلم", "narration", "قَالَ سُلَيْمَانُ عَنْ يَحْيَى"],
  // 16: bukhari:920
  [15, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَخْطُبُ قَائِمًا", "companion_words"],
  // 17: bukhari:921
  [16, "إِنَّ النَّبِيَّ صلى الله عليه وسلم جَلَسَ ذَاتَ يَوْمٍ عَلَى الْمِنْبَرِ", "companion_words"],
  // 18: bukhari:922
  [17, "دَخَلْتُ عَلَى عَائِشَةَ ـ رضى الله عنها ـ وَالنَّاسُ يُصَلُّونَ", "dialogue", "قَالَ هِشَامٌ فَلَقَدْ قَالَتْ لِي فَاطِمَةُ"],
  // 19: bukhari:925
  [18, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَامَ عَشِيَّةً بَعْدَ الصَّلاَةِ،", "narration", "تَابَعَهُ أَبُو مُعَاوِيَةَ وَأَبُو أُسَامَةَ"],
  // 20: bukhari:927
  [19, "صَعِدَ النَّبِيُّ صلى الله عليه وسلم الْمِنْبَرَ وَكَانَ آخِرَ مَجْلِسٍ", "dialogue"],
  // 21: bukhari:928
  [20, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَخْطُبُ خُطْبَتَيْنِ يَقْعُدُ بَيْنَهُمَا‏.‏", "narration"],
  // 22: bukhari:930
  [21, "جَاءَ رَجُلٌ وَالنَّبِيُّ صلى الله عليه وسلم يَخْطُبُ النَّاسَ", "dialogue"],
  // 23: bukhari:931
  [22, "دَخَلَ رَجُلٌ يَوْمَ الْجُمُعَةِ وَالنَّبِيُّ صلى الله عليه وسلم يَخْطُبُ", "dialogue"],
  // 24: bukhari:932
  [23, "بَيْنَمَا النَّبِيُّ صلى الله عليه وسلم يَخْطُبُ يَوْمَ الْجُمُعَةِ", "dialogue"],
  // 25: bukhari:936
  [24, "بَيْنَمَا نَحْنُ نُصَلِّي مَعَ النَّبِيِّ صلى الله عليه وسلم إِذْ أَقْبَلَتْ عِيرٌ", "companion_words"],
  // 26: bukhari:937
  [25, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يُصَلِّي قَبْلَ الظُّهْرِ", "narration"],
  // 27: bukhari:938
  [26, "كَانَتْ فِينَا امْرَأَةٌ تَجْعَلُ عَلَى أَرْبِعَاءَ فِي مَزْرَعَةٍ", "companion_words"],
  // 28: bukhari:939
  [27, "مَا كُنَّا نَقِيلُ وَلاَ نَتَغَدَّى إِلاَّ بَعْدَ الْجُمُعَةِ‏.‏", "companion_words"],
  // 29: bukhari:940
  [28, batch[28].text_original.slice(100, 140), "companion_words"],
  // 30: bukhari:941
  [29, batch[29].text_original.slice(105, 145), "companion_words"],
  // 31: bukhari:942
  [30, "غَزَوْتُ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم قِبَلَ نَجْدٍ،", "companion_words"],
  // 32: bukhari:943
  [31, "إِذَا اخْتَلَطُوا قِيَامًا‏.‏", "dialogue"],
  // 33: bukhari:944
  [32, "قَامَ النَّبِيُّ صلى الله عليه وسلم وَقَامَ النَّاسُ مَعَهُ،", "narration"],
  // 34: bukhari:948
  [33, "أَخَذَ عُمَرُ جُبَّةً مِنْ إِسْتَبْرَقٍ تُبَاعُ فِي السُّوقِ،", "dialogue"],
  // 35: bukhari:949
  [34, "دَخَلَ عَلَىَّ رَسُولُ اللَّهِ صلى الله عليه وسلم وَعِنْدِي جَارِيَتَانِ", "dialogue"],
  // 36: bukhari:953
  [35, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لاَ يَغْدُو يَوْمَ الْفِطْرِ", "narration", "وَقَالَ مُرَجَّى بْنُ رَجَاءٍ"],
  // 37: bukhari:955
  [36, "خَطَبَنَا النَّبِيُّ صلى الله عليه وسلم يَوْمَ الأَضْحَى بَعْدَ الصَّلاَةِ", "dialogue"],
  // 38: bukhari:956
  [37, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَخْرُجُ يَوْمَ الْفِطْرِ وَالأَضْحَى", "dialogue"],
  // 39: bukhari:957
  [38, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يُصَلِّي فِي الأَضْحَى", "narration"],
  // 40: bukhari:958
  [39, "إِنَّ النَّبِيَّ صلى الله عليه وسلم خَرَجَ يَوْمَ الْفِطْرِ،", "dialogue", "قُلْتُ لِعَطَاءٍ أَتَرَى حَقًّا عَلَى الإِمَامِ"],
  // 41: bukhari:962
  [40, "شَهِدْتُ الْعِيدَ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم", "companion_words"],
  // 42: bukhari:963
  [41, "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم وَأَبُو بَكْرٍ وَعُمَرُ", "companion_words"],
  // 43: bukhari:964
  [42, "أَنَّ النَّبِيَّ صلى الله عليه وسلم صَلَّى يَوْمَ الْفِطْرِ رَكْعَتَيْنِ،", "narration"],
  // 44: bukhari:965
  [43, "\u200F\"\u200F إِنَّ أَوَّلَ مَا نَبْدَأُ فِي يَوْمِنَا هَذَا أَنْ نُصَلِّيَ،", "dialogue"],
  // 45: bukhari:966
  [44, "كُنْتُ مَعَ ابْنِ عُمَرَ حِينَ أَصَابَهُ سِنَانُ الرُّمْحِ", "dialogue"],
  // 46: bukhari:967
  [45, "دَخَلَ الْحَجَّاجُ عَلَى ابْنِ عُمَرَ وَأَنَا عِنْدَهُ،", "dialogue"],
  // 47: bukhari:968
  [46, "خَطَبَنَا النَّبِيُّ صلى الله عليه وسلم يَوْمَ النَّحْرِ قَالَ", "dialogue"],
  // 48: bukhari:969
  [47, "\u200F\"\u200F مَا الْعَمَلُ فِي أَيَّامِ الْعَشْرِ أَفْضَلَ مِنَ الْعَمَلِ", "dialogue"],
  // 49: bukhari:970
  [48, "سَأَلْتُ أَنَسًا وَنَحْنُ غَادِيَانِ مِنْ مِنًى إِلَى عَرَفَاتٍ", "dialogue"],
  // 50: bukhari:971
  [49, "كُنَّا نُؤْمَرُ أَنْ نَخْرُجَ يَوْمَ الْعِيدِ،", "companion_words"],
  // 51: bukhari:972
  [50, "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ تُرْكَزُ الْحَرْبَةُ قُدَّامَهُ", "narration"],
  // 52: bukhari:973
  [51, "كَانَ النَّبِيُّ صلى الله عليه وسلم يَغْدُو إِلَى الْمُصَلَّى،", "companion_words"],
  // 53: bukhari:974
  [52, "أُمِرْنَا أَنْ نُخْرِجَ، الْعَوَاتِقَ وَذَوَاتِ الْخُدُورِ‏.‏", "companion_words", "وَعَنْ أَيُّوبَ عَنْ حَفْصَةَ بِنَحْوِهِ‏.‏"],
  // 54: bukhari:975
  [53, "خَرَجْتُ مَعَ النَّبِيِّ صلى الله عليه وسلم يَوْمَ فِطْرٍ أَوْ أَضْحَى،", "companion_words"],
  // 55: bukhari:976
  [54, "خَرَجَ النَّبِيُّ صلى الله عليه وسلم يَوْمَ أَضْحًى إِلَى الْبَقِيعِ", "dialogue"],
  // 56: bukhari:977
  [55, "شَهِدْتَ الْعِيدَ مَعَ النَّبِيِّ صلى الله عليه وسلم قَالَ نَعَمْ،", "dialogue"],
  // 57: bukhari:978
  [56, "قَامَ النَّبِيُّ صلى الله عليه وسلم يَوْمَ الْفِطْرِ،", "dialogue", "قُلْتُ لِعَطَاءٍ زَكَاةَ يَوْمِ الْفِطْرِ"],
  // 58: bukhari:979
  [57, "شَهِدْتُ الْفِطْرَ مَعَ النَّبِيِّ صلى الله عليه وسلم", "dialogue", "قَالَ عَبْدُ الرَّزَّاقِ الْفَتَخُ الْخَوَاتِيمُ"],
  // 59: bukhari:980
  [58, "كُنَّا نَمْنَعُ جَوَارِيَنَا أَنْ يَخْرُجْنَ يَوْمَ الْعِيدِ،", "dialogue"],
  // 60: bukhari:981
  [59, "أُمِرْنَا أَنْ نَخْرُجَ فَنُخْرِجَ الْحُيَّضَ وَالْعَوَاتِقَ", "companion_words", "قَالَ ابْنُ عَوْنٍ أَوِ الْعَوَاتِقَ"]
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
  console.error("Batch 10 marks had validation errors!");
  process.exit(1);
}

fs.writeFileSync("data/hadith-split/marks-010.json", JSON.stringify(marks, null, 2), "utf8");
console.log(`Successfully generated and validated ${marks.length} marks for batch 10! Saved to data/hadith-split/marks-010.json`);
