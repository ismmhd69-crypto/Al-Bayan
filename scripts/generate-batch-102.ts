import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-102.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "companion_words", "narration", "dialogue", "narration", "companion_words", "narration", "companion_words", "dialogue", "narration",
  "narration", "dialogue", "companion_words", "companion_words", "narration", "companion_words", "prophet_words", "companion_words", "companion_words", "narration",
  "companion_words", "companion_words", "companion_words", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only",
  "dialogue", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "reference_only", "narration", "reference_only",
  "narration", "reference_only", "dialogue", "narration", "companion_words", "companion_words", "prophet_words", "reference_only", "dialogue", "dialogue", "companion_words",
  "dialogue", "companion_words", "dialogue", "companion_words", "companion_words", "companion_words", "companion_words", "dialogue", "dialogue", "companion_words"
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
const cleanMap = (text: string) => {
  const clean: string[] = [], map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(text[i])) continue;
    clean.push(text[i]); map.push(i);
  }
  return { clean: clean.join(""), map };
};
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) {
  const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate: ${needle}`);
  const start = map[p];
  return text.slice(start, start + Math.min(100, text.length - start));
}
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) {
  const text = batch[i].text_original as string, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate tail: ${needle}`);
  marks[i].tail_start = text.slice(map[p]);
}

const starts: Array<[number, string]> = [
  [0, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"], [1, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"], [2, "قَالَتْ قَدِمَ النَّبِيُّ"],
  [3, "قَالَتْ عَائِشَةُ رضى الله عنها يَا رَسُولَ اللَّهِ"], [4, "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَمَرَهُ"], [5, "أَنَّهُ قَالَ أَقْبَلْنَا مُهِلِّينَ"],
  [6, "يَقُولُ دَخَلَ النَّبِيُّ صلى الله عليه وسلم"], [7, "أَنَّ عَائِشَةَ،"], [8, "قَالَ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"],
  [9, "قَالَ أَمَرَنَا النَّبِيُّ"], [10, "يَقُولُ لَمْ يَطُفِ النَّبِيُّ"], [11, "قَالَ أَهْلَلْنَا أَصْحَابُ مُحَمَّدٍ"],
  [12, "قَالَ قَدِمْتُ مَكَّةَ مُتَمَتِّعًا"], [13, "قَالَ قَدِمْنَا مَعَ رَسُولِ اللَّهِ"], [14, "قَالَ قَدِمْنَا مَعَ رَسُولِ اللَّهِ"],
  [15, "قَالَ كَانَ ابْنُ عَبَّاسٍ يَأْمُرُ"], [16, "فَافْصِلُوا حَجَّكُمْ مِنْ عُمْرَتِكُمْ"], [17, "قَالَ دَخَلْنَا عَلَى جَابِرِ بْنِ عَبْدِ اللَّهِ"],
  [18, "وَكَانَتِ الْعَرَبُ يَدْفَعُ بِهِمْ"], [19, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم لَمَّا قَدِمَ"], [20, "قَالَتْ كَانَ قُرَيْشٌ"],
  [21, "قَالَ كَانَتِ الْعَرَبُ تَطُوفُ"], [22, "قَالَ أَضْلَلْتُ بَعِيرًا لِي"], [23, "قَالَ قَدِمْتُ عَلَى رَسُولِ اللَّهِ"],
  [25, "قَالَ قَدِمْتُ عَلَى رَسُولِ اللَّهِ"], [26, "قَالَ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم"], [27, "أَنَّهُ كَانَ يُفْتِي بِالْمُتْعَةِ"],
  [28, "كَانَ عُثْمَانُ يَنْهَى عَنِ الْمُتْعَةِ"], [30, "قَالَ اجْتَمَعَ عَلِيٌّ وَعُثْمَانُ"], [31, "قَالَ كَانَتِ الْمُتْعَةُ فِي الْحَجِّ"],
  [32, "قَالَ كَانَتْ لَنَا رُخْصَةً"], [33, "قَالَ أَبُو ذَرٍّ رضى الله عنه"], [34, "قَالَ أَتَيْتُ إِبْرَاهِيمَ النَّخَعِيَّ"],
  [35, "قَالَ سَأَلْتُ سَعْدَ بْنَ أَبِي وَقَّاصٍ"], [38, "قَالَ لِي عِمْرَانُ بْنُ حُصَيْنٍ"], [40, "قَالَ لِي عِمْرَانُ بْنُ حُصَيْنٍ"],
  [42, "قَالَ بَعَثَ إِلَىَّ عِمْرَانُ بْنُ حُصَيْنٍ"], [43, "قَالَ اعْلَمْ أَنَّ رَسُولَ اللَّهِ"], [44, "قَالَ تَمَتَّعْنَا مَعَ رَسُولِ اللَّهِ"],
  [45, "قَالَ عِمْرَانُ بْنُ حُصَيْنٍ نَزَلَتْ آيَةُ الْمُتْعَةِ"], [46, "قَالَ وَفَعَلْنَاهَا مَعَ رَسُولِ اللَّهِ"],
  [48, "قَالَتْ قُلْتُ يَا رَسُولَ اللَّهِ"], [49, "قَالَتْ يَا رَسُولَ اللَّهِ"], [50, "أَنَّ عَبْدَ اللَّهِ بْنَ عُمَرَ"],
  [51, "قَالاَ لاَ يَضُرُّكَ أَنْ لاَ تَحُجَّ"], [52, "قَالَ أَرَادَ ابْنُ عُمَرَ الْحَجَّ"], [53, "أَنَّ ابْنَ عُمَرَ،"],
  [54, "قَالَ إِذًا أَفْعَلُ كَمَا فَعَلَ رَسُولُ اللَّهِ"], [55, "قَالَ أَهْلَلْنَا مَعَ رَسُولِ اللَّهِ"],
  [56, "أَنَّهُ رَأَى النَّبِيَّ"], [57, "فَقَالَ أَيَصْلُحُ لِي"], [58, "قَالَ سَأَلَ رَجُلٌ ابْنَ عُمَرَ"], [59, "قَالَ قَدِمَ رَسُولُ اللَّهِ"]
];
for (const [i, needle] of starts) setStart(i, needle);

for (const i of [24, 29, 36, 37, 39, 41, 47]) {
  marks[i].start = null;
  marks[i].kind = "reference_only";
}

const tails: Array<[number, string]> = [
  [0, "وَقَالَ إِسْحَاقُ مُتَهَبِّطَةٌ"], [1, "وَسَاقَ الْحَدِيثَ بِمَعْنَى حَدِيثِ مَنْصُورٍ"], [2, "بِمِثْلِ حَدِيثِ غُنْدَرٍ"],
  [6, "وَلَمْ يَذْكُرْ مَا قَبْلَ هَذَا"], [7, "وَسَاقَ الْحَدِيثَ بِمَعْنَى حَدِيثِ اللَّيْثِ"],
  [10, "زَادَ فِي حَدِيثِ مُحَمَّدِ بْنِ بَكْرٍ"], [11, "قَالَ عَطَاءٌ وَلَمْ يَعْزِمْ"], [26, "ثُمَّ سَاقَ الْحَدِيثَ بِمِثْلِ حَدِيثِ شُعْبَةَ"],
  [29, "بِهَذَا الإِسْنَادِ مِثْلَهُ"], [36, "وَقَالَ فِي رِوَايَتِهِ"], [37, "وَفِي حَدِيثِ سُفْيَانَ"],
  [39, "وَقَالَ ابْنُ حَاتِمٍ فِي رِوَايَتِهِ"], [41, "بِمِثْلِ حَدِيثِ مُعَاذٍ"], [46, "وَلَمْ يَقُلْ وَأَمَرَنَا بِهَا"],
  [47, "بِمِثْلِ الَّذِي أَخْبَرَنِي"], [52, "وَاقْتَصَّ الْحَدِيثَ"],
  [54, "وَلَمْ يَذْكُرْ فِي آخِرِ الْحَدِيثِ"], [56, "فَرَجَعْتُ إِلَى أَنَسٍ"]
];
for (const [i, needle] of tails) if (marks[i].start !== null) setTail(i, needle);

fs.writeFileSync("data/hadith-split/marks-102.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-102.json");
