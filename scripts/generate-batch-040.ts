import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const kinds: Kind[] = [
  "companion_words","companion_words","narration","reference_only","companion_words","companion_words","narration","companion_words","dialogue","companion_words",
  "narration","companion_words","dialogue","companion_words","companion_words","dialogue","narration","narration","companion_words","companion_words",
  "companion_words","companion_words","companion_words","companion_words","narration","dialogue","companion_words","companion_words","companion_words","companion_words",
  "dialogue","dialogue","companion_words","dialogue","companion_words","narration","companion_words","companion_words","companion_words","narration",
  "dialogue","dialogue","companion_words","dialogue","companion_words","companion_words","companion_words","companion_words","narration","companion_words",
  "dialogue","dialogue","narration","dialogue","dialogue","companion_words","dialogue","dialogue","reference_only","dialogue",
];
function firstMatnSegment(text: string): string {
  const comma = text.lastIndexOf("\u060C", Math.min(text.length, 280)); let start = comma >= 0 ? comma + 1 : 0;
  while (start < text.length && /[\s\u200f\u200eÙ€.â€]/u.test(text[start])) start++;
  let plain = ""; const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) { if (/[\u064B-\u065F\u0670]/u.test(text[i])) continue; plain += text[i]; sourceIndex.push(i); }
  const markers = ["\u0642\u0627\u0644", "\u0623\u0646", "\u0625\u0646", "\u0623\u062a\u0649", "\u062c\u0627\u0621", "\u062f\u062e\u0644", "\u0643\u0627\u0646", "\u0644\u0645\u0627", "\u0633\u0645\u0639", "\u0631\u0623\u0649", "\u0623\u062b\u0646\u0649"];
  let markerIndex = -1; for (const marker of markers) { const found = plain.lastIndexOf(marker, Math.min(plain.length - 1, start)); if (found >= 80 && found > markerIndex) markerIndex = found; }
  if (markerIndex >= 0) start = sourceIndex[markerIndex];
  while (start < text.length && /[\s\u200f\u200eÙ€.â€]/u.test(text[start])) start++;
  const rest = text.slice(start); const end = rest.search(/[\u060C.â€]/u); return end < 0 ? rest : rest.slice(0, end);
}
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-040.json", "utf8"));
if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => ({ id: item.id, url: item.url, start: firstMatnSegment(item.text_original), kind: kinds[index] }));
for (const index of [3, 58]) marks[index].start = null;
marks[0].start = batch[0].text_original.split(/\s+/u).slice(9).join(" ");
marks[4].start = batch[4].text_original.split(/\s+/u).slice(25).join(" ");
marks[46].start = batch[46].text_original.split(/\s+/u).slice(12).join(" ");
for (const [index, tail] of [
  [0, "وَقَالَ يَزِيدُ عَنْ سَلَمَةَ"],
  [3, "قَالَ مَالِكٌ وَذَلِكَ أَحْسَنُ مَا سَمِعْتُ"],
  [4, "حَدَّثَنَا مُسَدَّدٌ، حَدَّثَنَا يَحْيَى"],
  [8, "وَقَالَ مُسَدَّدٌ عَنْ أَبِي عَوَانَةَ"],
  [9, "وَقَالَ أَبُو هُرَيْرَةَ صَلَّيْتُ"],
  [53, "حَدَّثَنَا قُتَيْبَةُ حَدَّثَنَا حَاتِمٌ"],
  [57, "تَابَعَهُ مَعْمَرٌ عَنِ الزُّهْرِيِّ"],
] as [number, string][]) marks[index].tail_start = tail;
marks[53].tail_start = batch[53].text_original.slice(batch[53].text_original.indexOf("حَدَّثَنَا قُتَيْبَةُ"));
marks[4].tail_start = batch[4].text_original.slice(batch[4].text_original.lastIndexOf("حَدَّثَنَا مُسَدَّدٌ"));
for (let index = 0; index < marks.length; index++) {
  const text = batch[index].text_original; const base = marks[index].start;
  if (base === null || text.split(base).length === 2) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length === 2) { marks[index].start = candidate; break; }
  }
}
fs.writeFileSync("data/hadith-split/marks-040.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-040.json`);
