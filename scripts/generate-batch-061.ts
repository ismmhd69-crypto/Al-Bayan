import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const kinds: Kind[] = [
  "dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","narration","dialogue","narration",
  "dialogue","dialogue","dialogue","narration","companion_words","dialogue","narration","narration","companion_words","dialogue",
  "narration","prophet_words","prophet_words","prophet_words","companion_words","narration","companion_words","narration","narration","dialogue",
  "companion_words","companion_words","dialogue","dialogue","companion_words","dialogue","companion_words","dialogue","dialogue","narration",
  "prophet_words","companion_words","dialogue","companion_words","prophet_words","companion_words","companion_words","prophet_words","prophet_words","narration",
  "narration","dialogue","dialogue","companion_words","companion_words","narration","narration","prophet_words","dialogue","narration",
];

function firstMatnSegment(text: string): string {
  const comma = text.lastIndexOf("\u060C", Math.min(text.length, 280));
  let start = comma >= 0 ? comma + 1 : 0;
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  let plain = ""; const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) { if (/[\u064B-\u065F\u0670]/u.test(text[i])) continue; plain += text[i]; sourceIndex.push(i); }
  const markers = ["\u0642\u0627\u0644", "\u0623\u0646", "\u0625\u0646", "\u0623\u062a\u0649", "\u062c\u0627\u0621", "\u062f\u062e\u0644", "\u0643\u0627\u0646", "\u0644\u0645\u0627", "\u0633\u0645\u0639", "\u0631\u0623\u0649", "\u0623\u062b\u0646\u0649"];
  let markerIndex = -1;
  for (const marker of markers) { const found = plain.lastIndexOf(marker, Math.min(plain.length - 1, start)); if (found >= 80 && found > markerIndex) markerIndex = found; }
  if (markerIndex >= 0) start = sourceIndex[markerIndex];
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  const rest = text.slice(start); const end = rest.search(/[\u060C.]/u); return end < 0 ? rest : rest.slice(0, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-061.json", "utf8"));
if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => ({ id: item.id, url: item.url, start: firstMatnSegment(item.text_original), kind: kinds[index] }));

const starts: Record<number, string> = {
  0: "أَنَّ رَجُلاً، أَتَى رَسُولَ اللَّهِ صلى الله عليه وسلم",
  1: "أَنَّ أَعْرَابِيًّا قَالَ يَا رَسُولَ اللَّهِ",
  2: "أَنَّ رَجُلاً، مِنْ أَهْلِ الْبَادِيَةِ أَتَى النَّبِيَّ صلى الله عليه وسلم",
  3: "أَنَّ رَجُلاً، سَأَلَ النَّبِيَّ صلى الله عليه وسلم",
  4: "قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم لاِبْنِ صَائِدٍ",
  5: "أَنَّ عُمَرَ بْنَ الْخَطَّابِ انْطَلَقَ مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم",
  6: "قَالَ لَمَّا قَدِمَ وَفْدُ عَبْدِ الْقَيْسِ عَلَى النَّبِيِّ صلى الله عليه وسلم",
  7: "أَنَّهُ أَقْبَلَ هُوَ وَأَبُو طَلْحَةَ مَعَ النَّبِيِّ صلى الله عليه وسلم",
  8: "أَنَّ أَبَاهُ، جَاءَ إِلَى النَّبِيِّ صلى الله عليه وسلم",
  9: "قَالَ أُتِيَ بِالْمُنْذِرِ بْنِ أَبِي أُسَيْدٍ إِلَى النَّبِيِّ صلى الله عليه وسلم",
  10: "أَنَّ زَيْنَبَ، كَانَ اسْمُهَا بَرَّةَ",
  11: "قَالَ جَلَسْتُ إِلَى سَعِيدِ بْنِ الْمُسَيَّبِ",
  12: "قُلْتُ لاِبْنِ أَبِي أَوْفَى رَأَيْتَ إِبْرَاهِيمَ",
  13: "قَالَ وُلِدَ لِي غُلاَمٌ، فَأَتَيْتُ بِهِ النَّبِيَّ صلى الله عليه وسلم",
  14: "قَالَ انْكَسَفَتِ الشَّمْسُ يَوْمَ مَاتَ إِبْرَاهِيمُ",
  15: "قَالَتْ عَائِشَةُ سَأَلَ أُنَاسٌ رَسُولَ اللَّهِ صلى الله عليه وسلم",
  16: "قَالَ بِتُّ فِي بَيْتِ مَيْمُونَةَ وَالنَّبِيُّ صلى الله عليه وسلم عِنْدَهَا",
  17: "أَنَّهُ كَانَ مَعَ النَّبِيِّ صلى الله عليه وسلم فِي حَائِطٍ",
  18: "قَالَ كُنَّا مَعَ النَّبِيِّ صلى الله عليه وسلم",
  19: "قَالَتِ اسْتَيْقَظَ النَّبِيُّ صلى الله عليه وسلم",
  20: "أَنَّ صَفِيَّةَ بِنْتَ حُيَىٍّ",
  21: "قَالَ أَمَرَنَا النَّبِيُّ صلى الله عليه وسلم بِسَبْعٍ",
  22: "أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ ‏\"‏ إِيَّاكُمْ وَالْجُلُوسَ",
  23: "قَالَ أَمَرَنَا رَسُولُ اللَّهِ صلى الله عليه وسلم بِسَبْعٍ",
  24: "أَنَّهُ كَانَ ابْنَ عَشْرِ سِنِينَ",
  25: "قَالَ لَمَّا تَزَوَّجَ النَّبِيُّ صلى الله عليه وسلم زَيْنَبَ",
  26: "قَالَتْ كَانَ عُمَرُ بْنُ الْخَطَّابِ",
  27: "أَنَّ رَجُلاً، اطَّلَعَ مِنْ بَعْضِ حُجَرِ النَّبِيِّ صلى الله عليه وسلم",
  28: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا سَلَّمَ",
  29: "قَالَ كُنْتُ فِي مَجْلِسٍ مِنْ مَجَالِسِ الأَنْصَارِ",
  30: "أَنَّهُ مَرَّ عَلَى صِبْيَانٍ فَسَلَّمَ عَلَيْهِمْ",
  31: "قَالَ كُنَّا نَفْرَحُ يَوْمَ الْجُمُعَةِ",
  32: "يَقُولُ أَتَيْتُ النَّبِيَّ صلى الله عليه وسلم فِي دَيْنٍ",
  33: "أَنَّ رَجُلاً، دَخَلَ الْمَسْجِدَ وَرَسُولُ اللَّهِ صلى الله عليه وسلم",
  34: "قَالَ سَمِعْتُ كَعْبَ بْنَ مَالِكٍ",
  35: "قَالَتْ دَخَلَ رَهْطٌ مِنَ الْيَهُودِ عَلَى رَسُولِ اللَّهِ صلى الله عليه وسلم",
  36: "قَالَ بَعَثَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم",
  37: "أَنَّ أَهْلَ، قُرَيْظَةَ نَزَلُوا عَلَى حُكْمِ سَعْدٍ",
  38: "قَالَ قُلْتُ لأَنَسٍ أَكَانَتِ الْمُصَافَحَةُ",
  39: "قَالَ كُنَّا مَعَ النَّبِيِّ صلى الله عليه وسلم",
  40: "يَقُولُ عَلَّمَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم",
  41: "أَنَّ عَلِيًّا ـ يَعْنِي ابْنَ أَبِي طَالِبٍ ـ خَرَجَ مِنْ عِنْدِ النَّبِيِّ صلى الله عليه وسلم",
  42: "قَالَ أَنَا رَدِيفُ النَّبِيِّ، صلى الله عليه وسلم",
  43: "بِالرَّبَذَةِ كُنْتُ أَمْشِي مَعَ النَّبِيِّ صلى الله عليه وسلم",
  44: "عَنِ النَّبِيِّ صلى الله عليه وسلم أَنَّهُ نَهَى",
  45: "قَالَ لَمَّا تَزَوَّجَ رَسُولُ اللَّهِ صلى الله عليه وسلم زَيْنَبَ",
  46: "قَالَ رَأَيْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم",
  47: "قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏\"‏ أَلاَ أُخْبِرُكُمْ",
  48: "وَكَانَ مُتَّكِئًا فَجَلَسَ فَقَالَ ‏\"‏ أَلاَ وَقَوْلُ الزُّورِ",
  49: "قَالَ صَلَّى النَّبِيُّ صلى الله عليه وسلم الْعَصْرَ",
  50: "قَالَتْ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يُصَلِّي",
  51: "قَالَ أَخْبَرَنِي أَبُو الْمَلِيحِ",
  52: "أَنَّهُ قَدِمَ الشَّأْمَ",
  53: "قَالَ كُنَّا نَقِيلُ وَنَتَغَدَّى بَعْدَ الْجُمُعَةِ",
  54: "قَالَ مَا كَانَ لِعَلِيٍّ اسْمٌ أَحَبَّ إِلَيْهِ مِنْ أَبِي تُرَابٍ",
  55: "أَنَّ أُمَّ سُلَيْمٍ، كَانَتْ تَبْسُطُ لِلنَّبِيِّ صلى الله عليه وسلم",
  56: "أَنَّهُ سَمِعَهُ يَقُولُ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم",
  57: "قَالَ نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ لِبْسَتَيْنِ",
  58: "قَالَتْ إِنَّا كُنَّا أَزْوَاجَ النَّبِيِّ صلى الله عليه وسلم",
  59: "قَالَ رَأَيْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم فِي الْمَسْجِدِ",
};
for (const [index, start] of Object.entries(starts)) marks[Number(index)].start = start;

const tailMarkers: Record<number, string> = { 14: "رَوَاهُ أَبُو بَكْرَةَ عَنِ النَّبِيِّ صلى الله عليه وسلم" };
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
fs.writeFileSync("data/hadith-split/marks-061.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-061.json");
