import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const kinds: Kind[] = [
  "dialogue","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","narration","dialogue","companion_words",
  "prophet_words","prophet_words","narration","prophet_words","prophet_words","prophet_words","narration","dialogue","narration","prophet_words",
  "prophet_words","prophet_words","prophet_words","companion_words","dialogue","dialogue","prophet_words","prophet_words","companion_words","narration",
  "narration","prophet_words","prophet_words","narration","companion_words","companion_words","dialogue","companion_words","companion_words","narration",
  "narration","prophet_words","dialogue","dialogue","prophet_words","companion_words","dialogue","prophet_words","dialogue","dialogue",
  "dialogue","narration","prophet_words","dialogue","prophet_words","dialogue","companion_words","narration","dialogue","prophet_words",
];

function firstMatnSegment(text: string): string {
  const comma = text.lastIndexOf("\u060C", Math.min(text.length, 280)); let start = comma >= 0 ? comma + 1 : 0;
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  let plain = ""; const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) { if (/[\u064B-\u065F\u0670]/u.test(text[i])) continue; plain += text[i]; sourceIndex.push(i); }
  const markers = ["\u0642\u0627\u0644", "\u0623\u0646", "\u0625\u0646", "\u0623\u062a\u0649", "\u062c\u0627\u0621", "\u062f\u062e\u0644", "\u0643\u0627\u0646", "\u0644\u0645\u0627", "\u0633\u0645\u0639", "\u0631\u0623\u0649", "\u0623\u062b\u0646\u0649"];
  let markerIndex = -1; for (const marker of markers) { const found = plain.lastIndexOf(marker, Math.min(plain.length - 1, start)); if (found >= 80 && found > markerIndex) markerIndex = found; }
  if (markerIndex >= 0) start = sourceIndex[markerIndex];
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  const rest = text.slice(start); const end = rest.search(/[\u060C.]/u); return end < 0 ? rest : rest.slice(0, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-062.json", "utf8"));
if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => ({ id: item.id, url: item.url, start: firstMatnSegment(item.text_original), kind: kinds[index] }));

const starts: Record<number, string> = {
  0: "أَسَرَّ إِلَىَّ النَّبِيُّ صلى الله عليه وسلم",
  1: "قَالَ النَّبِيُّ صلى الله عليه وسلم",
  3: "قَالَ ‏{‏لاَ تَتْرُكُوا النَّارَ",
  4: "قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم",
  5: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ",
  6: "قَالَ سُئِلَ ابْنُ عَبَّاسٍ",
  7: "قُبِضَ النَّبِيُّ صلى الله عليه وسلم وَأَنَا خَتِينٌ",
  9: "قَالَ عَمْرٌو قَالَ ابْنُ عُمَرَ وَاللَّهِ مَا وَضَعْتُ لَبِنَةً",
  10: "عَنِ النَّبِيِّ صلى الله عليه وسلم ‏\"‏ سَ",
  11: "قَالَ ‏\"‏ إِنَّ الْمُؤْمِنَ",
  17: "أَنَّ فَاطِمَةَ ـ عَلَيْهِمَا السَّلاَمُ ـ شَكَتْ",
  18: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا أَخَذَ مَضْجَعَهُ",
  20: "عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏\"‏ سَيِّدُ الاِسْتِغْفَارِ",
  21: "قَالَ كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا أَرَادَ أَنْ يَنَامَ",
  25: "قَالَ خَرَجْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم إِلَى خَيْبَرَ",
  26: "كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا أَتَاهُ رَجُلٌ بِصَدَقَةٍ",
  28: "قَالَ حَدِّثِ النَّاسَ، كُلَّ جُمُعَةٍ مَرَّةً",
  31: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يَقُولُ عِنْدَ الْكَرْبِ",
  32: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَتَعَوَّذُ",
  36: "يَقُولُ ذَهَبَتْ بِي خَالَتِي إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم",
  37: "أَنَّهُ كَانَ يَخْرُجُ بِهِ جَدُّهُ عَبْدُ اللَّهِ بْنُ هِشَامٍ",
  38: "وَهُوَ الَّذِي مَجَّ رَسُولُ اللَّهِ صلى الله عليه وسلم فِي وَجْهِهِ",
  40: "أَنَّهُ رَأَى سَعْدَ بْنَ أَبِي وَقَّاصٍ يُوتِرُ بِرَكْعَةٍ",
  42: "سَأَلُوا رَسُولَ اللَّهِ صلى الله عليه وسلم",
  43: "قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم لأَبِي طَلْحَةَ",
  44: "قَالَتْ سَمِعْتُ النَّبِيَّ صلى الله عليه وسلم",
  45: "قَالَ عَادَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم",
  46: "أَنَّهَا قَالَتْ يَا رَسُولَ اللَّهِ أَنَسٌ خَادِمُكَ",
  47: "قَالَ دَعَا النَّبِيُّ صلى الله عليه وسلم بِمَاءٍ",
  49: "قَالَ رَأَى النَّبِيُّ صلى الله عليه وسلم عَلَى عَبْدِ الرَّحْمَنِ",
  50: "قَالَ هَلَكَ أَبِي وَتَرَكَ سَبْعَ",
  51: "طُبَّ حَتَّى إِنَّهُ لَيُخَيَّلُ إِلَيْهِ",
  52: "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ إِذَا قَالَ",
  54: "أَنَّهُ كَانَ يَدْعُو بِهَذَا الدُّعَاءِ",
  56: "قَالَ مَنْ قَالَ عَشْرًا كَانَ كَمَنْ أَعْتَقَ",
  57: "قَالَ أَخَذَ النَّبِيُّ صلى الله عليه وسلم",
  58: "قَالَ كُنَّا نَنْتَظِرُ عَبْدَ اللَّهِ",
  59: "قَالَ قَالَ النَّبِيُّ صلى الله عليه وسلم ‏\"‏ نِعْمَتَانِ",
};
for (const [index, start] of Object.entries(starts)) marks[Number(index)].start = start;

const tailMarkers: Record<number, string> = {
  9: "قَالَ سُفْيَانُ فَذَكَرْتُهُ",
  14: "تُنْشِرُهَا: تُخْرِجُهَا",
  16: "‏{‏اسْتَرْهَبُوهُمْ‏}‏",
  17: "وَعَنْ شُعْبَةَ عَنْ خَالِدٍ عَنِ ابْنِ سِيرِينَ",
  20: "مِثْلَهُ‏.‏",
  28: "يَعْنِي لاَ يَفْعَلُونَ إِلاَّ ذَلِكَ الاِجْتِنَابَ",
  31: "وَقَالَ وَهْبٌ حَدَّثَنَا شُعْبَةٌ عَنْ قَتَادَةَ",
  32: "قَالَ سُفْيَانُ الْحَدِيثُ ثَلاَثٌ",
  42: "وَكَانَ قَتَادَةُ يَذْكُرُ عِنْدَ الْحَدِيثِ هَذِهِ الآيَةَ",
  46: "وَعَنْ هِشَامِ بْنِ زَيْدٍ، سَمِعْتُ أَنَسَ بْنَ مَالِكٍ، مِثْلَهُ",
  50: "لَمْ يَقُلِ ابْنُ عُيَيْنَةَ وَمُحَمَّدُ بْنُ مُسْلِمٍ",
};
for (const [index, marker] of Object.entries(tailMarkers)) {
  const i = Number(index); const position = batch[i].text_original.indexOf(marker);
  if (position >= 0) marks[i].tail_start = batch[i].text_original.slice(position);
}

for (let index = 0; index < marks.length; index++) {
  const text = batch[index].text_original; const base = marks[index].start;
  if (base === null || text.split(base).length === 2) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length === 2) { marks[index].start = candidate; break; }
  }
}
fs.writeFileSync("data/hadith-split/marks-062.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-062.json");
