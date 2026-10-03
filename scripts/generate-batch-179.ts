import fs from "node:fs";

type Kind = "prophet_statement" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-179.json", "utf8"));
const kinds: Kind[] = [
  "reference_only", "reference_only", "reference_only", "prophet_statement", "dialogue", "narration", "narration", "prophet_statement", "dialogue", "dialogue",
  "dialogue", "narration", "dialogue", "dialogue", "prophet_statement", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue",
  "dialogue", "narration", "dialogue", "prophet_statement", "prophet_statement", "prophet_statement", "narration", "prophet_statement", "prophet_statement", "prophet_statement",
  "prophet_statement", "narration", "narration", "dialogue", "dialogue", "reference_only", "prophet_statement", "narration", "dialogue", "prophet_statement",
  "prophet_statement", "dialogue", "dialogue", "dialogue", "narration", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue",
  "prophet_statement", "dialogue", "dialogue", "dialogue", "prophet_statement", "prophet_statement", "dialogue", "dialogue", "dialogue", "dialogue",
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
  if (i === 44) mark.tail_start = "قَالَ أَحْمَدُ مَكَانَ أَخْبَرَنِي عَنْ";
  return mark;
});

fs.writeFileSync("data/hadith-split/marks-179.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-179.json`);
