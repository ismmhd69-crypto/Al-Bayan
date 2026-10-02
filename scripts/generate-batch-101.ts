import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-101.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "companion_words", "prophet_words", "companion_words", "companion_words", "reference_only",
  "prophet_words", "prophet_words", "reference_only", "prophet_words", "companion_words", "companion_words",
  "companion_words", "reference_only", "companion_words", "narration", "narration", "narration", "narration", "narration",
  "companion_words", "narration", "narration", "companion_words", "companion_words", "dialogue", "companion_words", "companion_words",
  "companion_words", "companion_words", "companion_words", "dialogue", "reference_only", "companion_words", "companion_words", "prophet_words",
  "companion_words", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only",
  "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words",
  "companion_words", "narration", "companion_words", "companion_words", "companion_words", "reference_only", "reference_only"
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));

const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function cleanMap(text: string) {
  const clean: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(text[i])) continue;
    clean.push(text[i]);
    map.push(i);
  }
  return { clean: clean.join(""), map };
}
function locate(text: string, needle: string) {
  const { clean, map } = cleanMap(text);
  const p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate: ${needle}`);
  const original = map[p];
  return text.slice(original, original + Math.min(100, text.length - original));
}
function setStart(i: number, needle: string) {
  try { marks[i].start = locate(batch[i].text_original, needle); }
  catch { throw new Error(`Could not locate start ${i}: ${needle}`); }
}
function setTail(i: number, needle: string) {
  const text = batch[i].text_original as string;
  const { clean, map } = cleanMap(text);
  const p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate tail: ${needle}`);
  marks[i].tail_start = text.slice(map[p]);
}

const starts: Array<[number, string]> = [
  [0, "فِي رِوَايَةِ مَنْصُورٍ"], [1, "قَالَ خَرَجَ رَسُولُ اللَّهِ"], [2, "فَقَالَ رَسُولُ اللَّهِ"], [3, "قَالَ كَانَ أَبُو قَتَادَةَ"],
  [4, "قَالَ كُنَّا مَعَ طَلْحَةَ"], [6, "قَالَتْ أَمَرَ رَسُولُ اللَّهِ"], [7, "عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ"],
  [9, "قَالَ سَمِعْتُ النَّبِيَّ"], [10, "أَخْبَرَتْنِي إِحْدَى نِسْوَةِ رَسُولِ اللَّهِ"], [11, "حَدَّثَتْنِي إِحْدَى نِسْوَةِ النَّبِيِّ"],
  [12, "قَالَ أَتَى عَلَىَّ رَسُولُ اللَّهِ"], [14, "قَالَ فِيَّ أُنْزِلَتْ هَذِهِ الآيَةُ"], [15, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم وَقَفَ"],
  [16, "أَنَّ النَّبِيَّ صلى الله عليه وسلم مَرَّ بِهِ"], [17, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم مَرَّ بِهِ"], [18, "أَنَّ النَّبِيَّ صلى الله عليه وسلم احْتَجَمَ"],
  [19, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم احْتَجَمَ"], [20, "قَالَ حَجَمَ النَّبِيَّ"], [21, "أَنَّ النَّبِيَّ صلى الله عليه وسلم احْتَجَمَ"],
  [22, "أَنَّ النَّبِيَّ صلى الله عليه وسلم احْتَجَمَ"], [23, "قَالَ خَرَجْنَا مَعَ أَبَانَ"], [24, "أَنَّ عُمَرَ بْنَ عُبَيْدِ اللَّهِ"],
  [25, "أَنَّهُمَا اخْتَلَفَا بِالأَبْوَاءِ"], [26, "وَقَالَ فَأَمَرَّ أَبُو أَيُّوبَ"], [27, "قَالَ أَقْبَلَ رَجُلٌ"],
  [28, "أَنَّ رَجُلاً، وَقَصَهُ بَعِيرُهُ"], [29, "أَنَّ رَجُلاً أَتَى النَّبِيَّ"], [30, "قَالَ ابْنُ عَبَّاسٍ"],
  [31, "قَالَتْ دَخَلَ رَسُولُ اللَّهِ"], [33, "أَنَّ ضُبَاعَةَ، أَرَادَتِ الْحَجَّ"], [34, "قَالَتْ نُفِسَتْ أَسْمَاءُ"],
  [35, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَمَرَ أَبَا بَكْرٍ"], [36, "أَنَّهَا قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"],
  [37, "أَنَّ عَائِشَةَ، قَالَتْ حَاضَتْ صَفِيَّةُ"], [38, "قَالَتْ طَمِثَتْ صَفِيَّةُ"],
  [40, "قَالَتْ كُنَّا نَتَخَوَّفُ"], [41, "أَنَّهَا قَالَتْ لِرَسُولِ اللَّهِ"], [42, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَرَادَ"],
  [43, "قَالَتْ لَمَّا أَرَادَ النَّبِيُّ"], [45, "قَالَتْ خَرَجْنَا مَعَ النَّبِيِّ"], [46, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"],
  [47, "قَالَتْ خَرَجْنَا مُوَافِينَ"], [48, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"], [49, "أَنَّهَا قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"],
  [50, "قَالَتْ خَرَجْنَا مَعَ النَّبِيِّ"], [51, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"], [52, "قَالَتْ لَبَّيْنَا بِالْحَجِّ"],
  [53, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَفْرَدَ الْحَجَّ"], [54, "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"],
  [55, "قَالَتْ مِنَّا مَنْ أَهَلَّ"], [56, "قَالَ جَاءَتْ عَائِشَةُ حَاجَّةً"], [57, "قَالَتْ عَائِشَةُ رضى الله عنها فَدُخِلَ عَلَيْنَا"]
];
for (const [i, needle] of starts) setStart(i, needle);

for (const i of [5, 8, 13, 32, 39, 44, 58, 59]) {
  marks[i].start = null;
  marks[i].kind = "reference_only";
}
marks[6].kind = "narration";
marks[35].kind = "narration";
marks[53].kind = "narration";
marks[54].kind = "companion_words";

const tails: Array<[number, string]> = [
  [0, "وَفِي رِوَايَةِ شُعْبَةَ عَنِ الْحَكَمِ"], [2, "وَفِي رِوَايَةِ شُعْبَةَ قَالَ"],
  [6, "ثُمَّ ذَكَرَ بِمِثْلِ حَدِيثِ يَزِيدَ"], [7, "وَقَالَ ابْنُ أَبِي عُمَرَ فِي رِوَايَتِهِ"],
  [8, "وَلَمْ يَقُلْ أَحَدٌ مِنْهُمْ"], [9, "فَذَكَرَ بِمِثْلِهِ"], [11, "قَالَ وَفِي الصَّلاَةِ أَيْضًا"],
  [12, "قَالَ أَيُّوبُ فَلاَ أَدْرِي"],
  [27, "وَزَادَ لَمْ يُسَمِّ"], [29, "قَالَ شُعْبَةُ ثُمَّ حَدَّثَنِي بِهِ"],
  [38, "بِمِثْلِ حَدِيثِ اللَّيْثِ"], [44, "نَحْوَ حَدِيثِ الْحَكَمِ"],
  [47, "وَسَاقَ الْحَدِيثَ بِمِثْلِ حَدِيثِ عَبْدَةَ"], [48, "وَسَاقَ الْحَدِيثَ بِنَحْوِ حَدِيثِهِمَا"],
  [52, "وَلاَ قَوْلُهَا وَأَنَا جَارِيَةٌ"], [58, "بِهَذَا الإِسْنَادِ مِثْلَهُ"], [59, "فَذَكَرَ الْحَدِيثَ"]
];
for (const [i, needle] of tails) {
  if (marks[i].start !== null) setTail(i, needle);
}

fs.writeFileSync("data/hadith-split/marks-101.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-101.json");
