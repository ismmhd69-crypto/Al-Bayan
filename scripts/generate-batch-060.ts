import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const kinds: Kind[] = [
  "prophet_words","narration","dialogue","prophet_words","dialogue","dialogue","prophet_words","dialogue","dialogue","companion_words",
  "companion_words","prophet_words","companion_words","dialogue","prophet_words","dialogue","dialogue","narration","prophet_words","dialogue",
  "narration","dialogue","narration","narration","narration","dialogue","narration","dialogue","dialogue","prophet_words",
  "dialogue","narration","dialogue","companion_words","companion_words","companion_words","narration","dialogue","dialogue","narration",
  "prophet_words","dialogue","prophet_words","companion_words","companion_words","companion_words","dialogue","narration","prophet_words","companion_words",
  "companion_words","companion_words","prophet_words","dialogue","prophet_words","dialogue","dialogue","dialogue","dialogue","companion_words",
];

function firstMatnSegment(text: string): string {
  const comma = text.lastIndexOf("\u060C", Math.min(text.length, 280));
  let start = comma >= 0 ? comma + 1 : 0;
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  let plain = "";
  const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064B-\u065F\u0670]/u.test(text[i])) continue;
    plain += text[i];
    sourceIndex.push(i);
  }
  const markers = ["\u0642\u0627\u0644", "\u0623\u0646", "\u0625\u0646", "\u0623\u062a\u0649", "\u062c\u0627\u0621", "\u062f\u062e\u0644", "\u0643\u0627\u0646", "\u0644\u0645\u0627", "\u0633\u0645\u0639", "\u0631\u0623\u0649", "\u0623\u062b\u0646\u0649"];
  let markerIndex = -1;
  for (const marker of markers) {
    const found = plain.lastIndexOf(marker, Math.min(plain.length - 1, start));
    if (found >= 80 && found > markerIndex) markerIndex = found;
  }
  if (markerIndex >= 0) start = sourceIndex[markerIndex];
  while (start < text.length && /[\s\u200f\u200e.]/u.test(text[start])) start++;
  const rest = text.slice(start);
  const end = rest.search(/[\u060C.]/u);
  return end < 0 ? rest : rest.slice(0, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-060.json", "utf8"));
if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);

const marks = batch.map((item: any, index: number) => ({
  id: item.id,
  url: item.url,
  start: firstMatnSegment(item.text_original),
  kind: kinds[index],
}));

const startOverrides: Record<number, string> = {
  0: "قَالَ ‏\"‏ السَّاعِي عَلَى الأَرْمَلَةِ",
  1: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏\"‏ بَيْنَمَا رَجُلٌ",
  2: "أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ ‏\"‏ وَاللَّهِ لاَ يُؤْمِنُ",
  3: "قَالَ سَمِعَتْ أُذُنَاىَ، وَأَبْصَرَتْ، عَيْنَاىَ حِينَ تَكَلَّمَ النَّبِيُّ",
  6: "قَالَ ‏\"‏ الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ",
  7: "أَنَّ يَهُودَ، أَتَوُا النَّبِيَّ صلى الله عليه وسلم",
  8: "أَنَّ رَجُلاً، اسْتَأْذَنَ عَلَى النَّبِيِّ صلى الله عليه وسلم",
  9: "قَالَ كَانَ النَّبِيُّ صلى الله عليه وسلم أَحْسَنَ النَّاسِ",
  11: "قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏\"‏ يَتَقَارَبُ الزَّمَانُ",
  12: "قَالَ خَدَمْتُ النَّبِيَّ صلى الله عليه وسلم",
  13: "قَالَ سَأَلْتُ عَائِشَةَ مَا كَانَ النَّبِيُّ صلى الله عليه وسلم",
  14: "قَالَ نَهَى النَّبِيُّ صلى الله عليه وسلم",
  16: "قَالَ رَأَيْتُ عَلَيْهِ بُرْدًا وَعَلَى غُلاَمِهِ بُرْدًا",
  17: "صَلَّى بِنَا النَّبِيُّ صلى الله عليه وسلم",
  18: "قَالَ مَرَّ رَسُولُ اللَّهِ صلى الله عليه وسلم",
  19: "قَالَتِ، اسْتَأْذَنَ رَجُلٌ عَلَى رَسُولِ اللَّهِ صلى الله عليه وسلم",
  20: "قَالَ خَرَجَ النَّبِيُّ صلى الله عليه وسلم",
  21: "أَنَّ رَجُلاً، ذُكِرَ عِنْدَ النَّبِيِّ صلى الله عليه وسلم",
  22: "قَالَتْ مَكَثَ النَّبِيُّ صلى الله عليه وسلم",
  24: "أَنَّ عَائِشَةَ حُدِّثَتْ أَنَّ عَبْدَ اللَّهِ بْنَ الزُّبَيْرِ",
  26: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم زَارَ أَهْلَ بَيْتٍ",
  29: "قَالَ لَمَّا كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم بِالطَّائِفِ",
  30: "قَالَ أَتَى رَجُلٌ النَّبِيَّ صلى الله عليه وسلم",
  31: "قَالَ كُنْتُ أَمْشِي مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم",
  32: "قَالَتْ يَا رَسُولَ اللَّهِ إِنَّ اللَّهَ لاَ يَسْتَحِي مِنَ الْحَقِّ",
  34: "يَقُولُ إِنَّ أَشْبَهَ النَّاسِ دَلاًّ وَسَمْتًا وَهَدْيًا",
  35: "قَالَ عَبْدُ اللَّهِ إِنَّ أَحْسَنَ الْحَدِيثِ كِتَابُ اللَّهِ",
  36: "قَالَ كَانَ النَّبِيُّ صلى الله عليه وسلم أَشَدَّ حَيَاءً",
  37: "أَنَّ رَجُلاً، سَأَلَ رَسُولَ اللَّهِ صلى الله عليه وسلم",
  38: "أَنَّ رَجُلاً، قَالَ لِلنَّبِيِّ صلى الله عليه وسلم أَوْصِنِي",
  40: "قَالَ النَّبِيُّ صلى الله عليه وسلم ‏\"‏ مَثَلُ الْمُؤْمِنِ",
  41: "يَقُولُ جَاءَتِ امْرَأَةٌ إِلَى النَّبِيِّ صلى الله عليه وسلم",
  42: "قَالَ لَهُمَا ‏\"‏ يَسِّرَا وَلاَ تُعَسِّرَا",
  43: "أَنَّهَا قَالَتْ مَا خُيِّرَ رَسُولُ اللَّهِ صلى الله عليه وسلم",
  44: "قَالَ كُنَّا عَلَى شَاطِئِ نَهْرٍ بِالأَهْوَازِ",
  45: "قَالَتْ كُنْتُ أَلْعَبُ بِالْبَنَاتِ عِنْدَ النَّبِيِّ صلى الله عليه وسلم",
  46: "أَنَّهُ، اسْتَأْذَنَ عَلَى النَّبِيِّ صلى الله عليه وسلم رَجُلٌ",
  47: "قَالَ دَخَلَ عَلَىَّ رَسُولُ اللَّهِ صلى الله عليه وسلم",
  48: "قَالَ ‏\"‏ مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ",
  49: "أَنَّ أَبَا بَكْرٍ، تَضَيَّفَ رَهْطًا",
  50: "قَالَ عَبْدُ الرَّحْمَنِ بْنُ أَبِي بَكْرٍ ـ رضى الله عنهما جَاءَ أَبُو بَكْرٍ",
  52: "قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏\"‏ أَخْبِرُونِي بِشَجَرَةٍ",
  53: "قَالَ خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم",
  54: "أَتَى النَّبِيُّ صلى الله عليه وسلم",
  56: "تَقُولُ ذَهَبْتُ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم",
  57: "أَنَّ النَّبِيَّ صلى الله عليه وسلم رَأَى رَجُلاً",
  58: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم رَأَى رَجُلاً",
  59: "قَالَ بَيْنَا النَّبِيُّ صلى الله عليه وسلم يَقْسِمُ ذَاتَ يَوْمٍ",
};
for (const [index, start] of Object.entries(startOverrides)) marks[Number(index)].start = start;

const tails: Record<number, string> = {
  0: "حَدَّثَنَا إِسْمَاعِيلُ، قَالَ حَدَّثَنِي مَالِكٌ، عَنْ ثَوْرِ بْنِ زَيْدٍ",
  2: "وَقَالَ حُمَيْدُ بْنُ الأَسْوَدِ وَعُثْمَانُ بْنُ عُمَرَ",
  14: "وَقَالَ الثَّوْرِيُّ وَوُهَيْبٌ وَأَبُو مُعَاوِيَةَ عَنْ هِشَامٍ",
  21: "قَالَ وُهَيْبٌ عَنْ خَالِدٍ",
  27: "فَكَانَ ابْنُ عُمَرَ يَكْرَهُ الْعَلَمَ فِي الثَّوْبِ",
  40: "وَعَنْ شُعْبَةَ حَدَّثَنَا خُبَيْبُ بْنُ عَبْدِ الرَّحْمَنِ",
  48: "حَدَّثَنَا إِسْمَاعِيلُ، قَالَ حَدَّثَنِي مَالِكٌ، مِثْلَهُ",
  54: "قَالَ أَبُو قِلاَبَةَ فَتَكَلَّمَ النَّبِيُّ",
};
for (const [index, marker] of Object.entries(tails)) {
  const i = Number(index);
  const position = batch[i].text_original.indexOf(marker);
  if (position >= 0) marks[i].tail_start = batch[i].text_original.slice(position);
}

for (let index = 0; index < marks.length; index++) {
  const text = batch[index].text_original;
  const base = marks[index].start;
  if (base === null || text.split(base).length === 2) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length === 2) {
      marks[index].start = candidate;
      break;
    }
  }
}

fs.writeFileSync("data/hadith-split/marks-060.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-060.json");
