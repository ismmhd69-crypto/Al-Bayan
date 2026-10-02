import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const kinds: Kind[] = [
  "narration","companion_words","companion_words","narration","companion_words","companion_words","companion_words","narration","prophet_words","prophet_words",
  "companion_words","companion_words","dialogue","narration","prophet_words","companion_words","narration","companion_words","narration","dialogue",
  "narration","prophet_words","companion_words","prophet_words","prophet_words","narration","prophet_words","companion_words","narration","dialogue",
  "narration","companion_words","companion_words","narration","companion_words","companion_words","companion_words","narration","prophet_words","prophet_words",
  "companion_words","companion_words","dialogue","narration","prophet_words","companion_words","narration","companion_words","narration","dialogue",
  "narration","prophet_words","companion_words","prophet_words","prophet_words","narration","prophet_words","companion_words","narration","dialogue",
];

function firstMatnSegment(text: string): string {
  const limit = Math.min(text.length, 250);
  let comma = text.lastIndexOf("،", limit);
  if (comma < 40) comma = text.indexOf("،");
  let start = comma + 1;
  while (start < text.length && /[\s\u200f\u200eـ.‏]/u.test(text[start])) start++;
  let plain = "";
  const sourceIndex: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064B-\u065F\u0670]/u.test(text[i])) continue;
    plain += text[i];
    sourceIndex.push(i);
  }
  const markers = ["\u0642\u0627\u0644", "\u0642\u0627\u0644\u062a", "\u0623\u0646", "\u0625\u0646", "\u0623\u062a\u0649", "\u062c\u0627\u0621", "\u062f\u062e\u0644", "\u0643\u0646\u0627", "\u0643\u0646\u062a", "\u0633\u0645\u0639", "\u0631\u0623\u0649", "\u062a\u0632\u0648\u062c\u062a", "\u0623\u062b\u0646\u0649"];
  let markerIndex = -1;
  for (const marker of markers) {
    const found = plain.lastIndexOf(marker, Math.min(plain.length - 1, start));
    if (found >= 80 && found > markerIndex) markerIndex = found;
  }
  if (markerIndex >= 0) start = sourceIndex[markerIndex];
  while (start < text.length && /[\s\u200f\u200eـ.‏]/u.test(text[start])) start++;
  const rest = text.slice(start);
  const end = rest.search(/[،.‏]/u);
  return end < 0 ? rest : rest.slice(0, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-026.json", "utf8"));
if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => ({
  id: item.id,
  url: item.url,
  start: firstMatnSegment(item.text_original),
  kind: kinds[index],
}));

// Two source rows in this batch have no punctuation between the isnad and matn.
// Their word positions are unambiguous in the stored source text.
marks[18].start = batch[18].text_original.split(/\s+/u).slice(12).join(" ");
marks[26].start = batch[26].text_original.split(/\s+/u).slice(11).join(" ");
marks[29].start = batch[29].text_original.split(/\s+/u).slice(18).join(" ");
marks[39].start = batch[39].text_original.split(/\s+/u).slice(20).join(" ");
marks[42].start = batch[42].text_original.split(/\s+/u).slice(15).join(" ");
marks[51].start = batch[51].text_original.split(/\s+/u).slice(21).join(" ");
marks[56].start = batch[56].text_original.split(/\s+/u).slice(20).join(" ");
marks[58].start = batch[58].text_original.split(/\s+/u).slice(36).join(" ");
marks[59].start = batch[59].text_original.split(/\s+/u).slice(19).join(" ");

for (let index = 0; index < marks.length; index++) {
  const text = batch[index].text_original;
  const base = marks[index].start;
  if (text.split(base).length - 1 === 1) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length - 1 === 1) { marks[index].start = candidate; break; }
  }
}

fs.writeFileSync("data/hadith-split/marks-026.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-026.json`);
