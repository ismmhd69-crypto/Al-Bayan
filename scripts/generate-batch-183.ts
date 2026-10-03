import fs from "node:fs";

type Kind = "prophet_statement" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-183.json", "utf8"));
const kinds: Kind[] = [
  "prophet_statement", "narration", "prophet_statement", "prophet_statement", "prophet_statement", "prophet_statement", "dialogue", "prophet_statement",
  "prophet_statement", "dialogue", "companion_words", "prophet_statement", "dialogue", "prophet_statement", "prophet_statement", "narration",
  "dialogue", "prophet_statement", "prophet_statement", "reference_only", "prophet_statement", "dialogue", "companion_words", "narration",
];

if (batch.length !== kinds.length) throw new Error(`Expected ${kinds.length} items, got ${batch.length}`);

const marker = "\u200f\"\u200f";
const marks = batch.map((x: any, i: number) => {
  if (kinds[i] === "reference_only" || kinds[i] === "unclear") {
    return { id: x.id, url: x.url, start: null, kind: kinds[i] };
  }
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  let start = raw.slice(raw.indexOf(" ") + 1).trim();
  if (x.text_original.split(start).length - 1 !== 1) {
    const at = x.text_original.indexOf(start);
    for (let length = start.length; length <= x.text_original.length - at; length++) {
      const candidate = x.text_original.slice(at, at + length);
      if (x.text_original.split(candidate).length - 1 === 1) {
        start = candidate;
        break;
      }
    }
  }
  const mark: any = { id: x.id, url: x.url, start, kind: kinds[i] };
  if (i === 1) mark.tail_start = "وَقَالَ عُبَيْدُ اللَّهِ بْنُ سَعِيدٍ";
  if (i === 8) mark.tail_start = "قَالَ أَبُو مَسْعُودٍ";
  if (i === 10) mark.tail_start = "قَالَ أَبُو مَسْعُودٍ هَكَذَا سَمِعْتُ";
  if (i === 11) mark.tail_start = "قَالَ أَبُو إِسْحَاقَ يُقَالُ";
  if (i === 13) mark.tail_start = "وَسَاقَ الْحَدِيثَ";
  return mark;
});

fs.writeFileSync("data/hadith-split/marks-183.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-183.json`);
