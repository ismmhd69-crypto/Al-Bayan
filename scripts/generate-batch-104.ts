import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-104.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "companion_words", "narration", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words",
  "reference_only", "narration", "narration", "narration", "narration", "narration", "dialogue", "dialogue", "dialogue", "dialogue",
  "companion_words", "companion_words", "narration", "reference_only", "companion_words", "narration", "dialogue", "prophet_words", "companion_words", "companion_words",
  "companion_words", "dialogue", "companion_words", "narration", "dialogue", "reference_only", "narration", "narration", "companion_words", "reference_only",
  "narration", "companion_words", "narration", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "companion_words", "dialogue",
  "narration", "companion_words", "companion_words", "companion_words", "companion_words", "dialogue", "companion_words", "companion_words", "dialogue", "reference_only"
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); const start = map[p]; return text.slice(start, start + Math.min(100, text.length - start)); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original as string, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "قَالَ لَمْ يَكُنْ رَسُولُ اللَّهِ"], [1, "ذَكَرَ أَنَّ رَسُولَ اللَّهِ"], [2, "قَالَ مَا تَرَكْتُ اسْتِلاَمَ هَذَيْنِ"], [3, "قَالَ رَأَيْتُ ابْنَ عُمَرَ"],
  [4, "يَقُولُ لَمْ أَرَ رَسُولَ اللَّهِ"], [5, "قَالَ قَبَّلَ عُمَرُ بْنُ الْخَطَّابِ"], [6, "أَنَّ عُمَرَ، قَبَّلَ الْحَجَرَ"], [7, "قَالَ رَأَيْتُ الأَصْلَعَ"],
  [8, "قَالَ رَأَيْتُ عُمَرَ يُقَبِّلُ"], [9, "قَالَ رَأَيْتُ عُمَرَ قَبَّلَ"], [11, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم طَافَ"],
  [12, "قَالَ طَافَ رَسُولُ اللَّهِ"], [13, "يَقُولُ طَافَ النَّبِيُّ"], [14, "قَالَتْ طَافَ النَّبِيُّ"], [15, "رَأَيْتُ رَسُولَ اللَّهِ"],
  [16, "قُلْتُ لَهَا إِنِّي"], [17, "قُلْتُ لِعَائِشَةَ مَا أَرَى"], [18, "قُلْتُ لِعَائِشَةَ زَوْجِ النَّبِيِّ"], [19, "فَلَمَّا سَأَلُوا رَسُولَ اللَّهِ"],
  [20, "أَنَّ الأَنْصَارَ كَانُوا"], [21, "قَالَ كَانَتِ الأَنْصَارُ"], [22, "يَقُولُ لَمْ يَطُفِ النَّبِيُّ"],
  [24, "أَنَّهُ كَانَ رَدِيفَ رَسُولِ اللَّهِ"], [25, "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَرْدَفَ الْفَضْلَ"],
  [26, "أَنَّهُ قَالَ فِي عَشِيَّةِ عَرَفَةَ"], [27, "وَالنَّبِيُّ صلى الله عليه وسلم يُشِيرُ"], [28, "أَنَّ عَبْدَ اللَّهِ، لَبَّى"],
  [29, "قَالَ غَدَوْنَا مَعَ رَسُولِ اللَّهِ"], [30, "قَالَ كُنَّا مَعَ رَسُولِ اللَّهِ"], [31, "أَنَّهُ سَأَلَ أَنَسَ بْنَ مَالِكٍ"],
  [32, "قُلْتُ لِأَنَسِ بْنِ مَالِكٍ"], [33, "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم أَفَاضَ"], [34, "سُئِلَ أُسَامَةُ"],
  [36, "أَنَّ أَبَا أَيُّوبَ أَخْبَرَهُ"], [37, "قَالَ جَمَعَ رَسُولُ اللَّهِ"], [38, "أَنَّهُ صَلَّى الْمَغْرِبَ"], [40, "قَالَ جَمَعَ رَسُولُ اللَّهِ"],
  [41, "قَالَ سَعِيدُ بْنُ جُبَيْرٍ أَفَضْنَا"], [42, "قَالَ مَا رَأَيْتُ رَسُولَ اللَّهِ"], [44, "أَنَّهَا قَالَتِ اسْتَأْذَنَتْ"],
  [45, "قَالَتْ كَانَتْ سَوْدَةُ"], [46, "قَالَتْ وَدِدْتُ"], [48, "قَالَتْ لِي أَسْمَاءُ"], [49, "قَالَتْ لاَ أَىْ بُنَىَّ"],
  [50, "أَنَّ النَّبِيَّ صلى الله عليه وسلم بَعَثَ بِهَا"], [51, "قَالَتْ كُنَّا نَفْعَلُهُ"], [52, "قَالَ سَمِعْتُ ابْنَ عَبَّاسٍ"],
  [53, "يَقُولُ أَنَا مِمَّنْ"], [54, "قَالَ كُنْتُ فِيمَنْ قَدَّمَ"], [55, "قَالَ بَعَثَ بِي رَسُولُ اللَّهِ"],
  [56, "أَنَّ عَبْدَ اللَّهِ بْنَ عُمَرَ كَانَ"], [57, "قَالَ رَمَى عَبْدُ اللَّهِ بْنُ مَسْعُودٍ"], [58, "قَالَ سَمِعْتُ الْحَجَّاجَ بْنَ يُوسُفَ"]
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [10, 23, 35, 39, 43, 47, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }

const tails: Array<[number, string]> = [
  [5, "زَادَ هَارُونُ فِي رِوَايَتِهِ"], [7, "وَفِي رِوَايَةِ"], [10, "وَلَمْ يَقُلْ وَالْتَزَمَهُ"], [13, "وَلَمْ يَذْكُرِ ابْنُ خَشْرَمٍ"],
  [25, "قَالَ فَأَخْبَرَنِي ابْنُ عَبَّاسٍ"], [28, "وَحَدَّثَنَاهُ حَسَنٌ الْحُلْوَانِيُّ"],
  [35, "وَزَادَ فِي حَدِيثِ حُمَيْدٍ"], [36, "وَحَدَّثَنَاهُ قُتَيْبَةُ"],
  [51, "وَفِي رِوَايَةِ النَّاقِدِ"]
];
for (const [i, needle] of tails) if (marks[i].start !== null) setTail(i, needle);
fs.writeFileSync("data/hadith-split/marks-104.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-104.json");
