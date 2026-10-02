import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-103.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "dialogue", "companion_words", "companion_words", "dialogue", "reference_only", "narration", "companion_words", "narration", "narration",
  "narration", "companion_words", "narration", "reference_only", "dialogue", "dialogue", "companion_words", "dialogue", "narration", "companion_words",
  "companion_words", "companion_words", "dialogue", "reference_only", "prophet_words", "prophet_words", "narration", "companion_words", "companion_words", "dialogue",
  "companion_words", "narration", "dialogue", "dialogue", "dialogue", "narration", "reference_only", "narration", "companion_words", "companion_words",
  "narration", "narration", "narration", "narration", "narration", "narration", "narration", "narration", "narration", "narration",
  "companion_words", "narration", "narration", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "companion_words", "narration"
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); const start = map[p]; return text.slice(start, start + Math.min(100, text.length - start)); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original as string, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [1, "فَقَالَ لاَ يَحِلُّ مَنْ أَهَلَّ بِالْحَجِّ"], [2, "قَالَتْ قَدِمْنَا مَعَ رَسُولِ اللَّهِ"], [3, "تَقُولُ صَلَّى اللَّهُ عَلَى رَسُولِهِ"],
  [4, "فَرَخَّصَ فِيهَا وَكَانَ ابْنُ الزُّبَيْرِ"], [6, "يَقُولُ أَهَلَّ النَّبِيُّ"], [7, "وَكَانَ مِمَّنْ لَمْ يَكُنْ مَعَهُ الْهَدْىُ"],
  [8, "أَهَلَّ رَسُولُ اللَّهِ صلى الله عليه وسلم بِالْحَجِّ"], [9, "قَالَ قَدِمَ النَّبِيُّ"], [10, "قَالَ صَلَّى رَسُولُ اللَّهِ"],
  [11, "قَالَ تَمَتَّعْتُ فَنَهَانِي نَاسٌ"], [12, "قَالَ صَلَّى رَسُولُ اللَّهِ"], [14, "قَالَ رَجُلٌ مِنْ بَنِي الْهُجَيْمِ"],
  [15, "قِيلَ لِابْنِ عَبَّاسٍ"], [16, "كَانَ ابْنُ عَبَّاسٍ يَقُولُ"], [17, "قَالَ لِي مُعَاوِيَةُ"], [18, "قَالَ قَصَّرْتُ عَنْ رَسُولِ اللَّهِ"],
  [19, "قَالَ خَرَجْنَا مَعَ رَسُولِ اللَّهِ"], [20, "قَالاَ قَدِمْنَا مَعَ النَّبِيِّ"], [21, "قَالَ جَابِرٌ فَعَلْنَاهُمَا"],
  [22, "أَنَّ عَلِيًّا، قَدِمَ مِنَ الْيَمَنِ"], [24, "قَالَ سَمِعْتُ رَسُولَ اللَّهِ"], [25, "وَالَّذِي نَفْسِي بِيَدِهِ"],
  [26, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم اعْتَمَرَ أَرْبَعَ عُمَرٍ"], [27, "قَالَ سَأَلْتُ أَنَسًا"], [28, "قَالَ سَأَلْتُ زَيْدَ بْنَ أَرْقَمَ"],
  [29, "قَالَ كُنْتُ أَنَا وَابْنُ"], [30, "أَنَّ عَبْدَ اللَّهِ بْنَ يَزِيدَ"], [31, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم غَزَا تِسْعَ عَشْرَةَ"],
  [32, "قَالَ دَخَلْتُ أَنَا وَعُرْوَةُ"], [33, "قَالَ قَالَ رَسُولُ اللَّهِ"], [34, "أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ"],
  [35, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يَخْرُجُ"], [37, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَنَاخَ بِالْبَطْحَاءِ"], [38, "قَالَ كَانَ ابْنُ عُمَرَ يُنِيخُ"],
  [39, "أَنَّ عَبْدَ اللَّهِ بْنَ عُمَرَ، كَانَ"], [40, "أَنَّ النَّبِيَّ صلى الله عليه وسلم لَمَّا جَاءَ"], [41, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم دَخَلَ"],
  [42, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم بَاتَ بِذِي طَوًى"], [43, "أَنَّ ابْنَ عُمَرَ، كَانَ لاَ يَقْدَمُ"], [44, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يَنْزِلُ"],
  [45, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم اسْتَقْبَلَ"], [46, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا طَافَ"], [47, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا طَافَ"],
  [48, "قَالَ رَأَيْتُ رَسُولَ اللَّهِ"], [49, "قَالَ رَمَلَ رَسُولُ اللَّهِ"], [50, "أَنَّ ابْنَ عُمَرَ، رَمَلَ"],
  [51, "أَنَّهُ قَالَ رَأَيْتُ رَسُولَ اللَّهِ"], [52, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم رَمَلَ"], [53, "قَالَ قُلْتُ لِابْنِ عَبَّاسٍ"],
  [55, "قَالَ قُلْتُ لِابْنِ عَبَّاسٍ"], [56, "قَالَ قُلْتُ لِابْنِ عَبَّاسٍ"], [57, "قَالَ قَدِمَ رَسُولُ اللَّهِ"],
  [58, "قَالَ إِنَّمَا سَعَى رَسُولُ اللَّهِ"], [59, "أَنَّهُ قَالَ لَمْ أَرَ رَسُولَ اللَّهِ"]
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 5, 13, 23, 36, 54]) { marks[i].start = null; marks[i].kind = "reference_only"; }
marks[43].kind = "companion_words";

const tails: Array<[number, string]> = [
  [0, "نَحْوَ حَدِيثِ ابْنِ عُيَيْنَةَ"], [2, "ثُمَّ ذَكَرَ بِمِثْلِ حَدِيثِ ابْنِ جُرَيْجٍ"],
  [5, "قَالَ مُسْلِمٌ لاَ أَدْرِي"], [8, "وَفِي حَدِيثِهِمْ جَمِيعًا"], [13, "بِمَعْنَى حَدِيثِ شُعْبَةَ"],
  [23, "مِثْلَهُ غَيْرَ أَنَّ فِي رِوَايَةِ بَهْزٍ"], [27, "ثُمَّ ذَكَرَ بِمِثْلِ حَدِيثِ هَدَّابٍ"],
  [36, "وَقَالَ فِي رِوَايَةِ زُهَيْرٍ"], [37, "وَكَانَ عَبْدُ اللَّهِ بْنُ عُمَرَ يَفْعَلُ"], [42, "وَفِي رِوَايَةِ ابْنِ سَعِيدٍ"],
  [46, "وَكَانَ ابْنُ عُمَرَ يَفْعَلُ"], [54, "وَلَمْ يَقُلْ يَحْسُدُونَهُ"]
];
for (const [i, needle] of tails) if (marks[i].start !== null) setTail(i, needle);
fs.writeFileSync("data/hadith-split/marks-103.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-103.json");
