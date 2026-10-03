import fs from "node:fs";

type Kind = "prophet_statement" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-178.json", "utf8"));
const kinds: Kind[] = [
  "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "prophet_statement", "narration", "reference_only", "prophet_statement",
  "dialogue", "prophet_statement", "dialogue", "dialogue", "prophet_statement", "dialogue", "prophet_statement", "prophet_statement", "prophet_statement", "dialogue",
  "dialogue", "dialogue", "dialogue", "prophet_statement", "dialogue", "prophet_statement", "dialogue", "dialogue", "dialogue", "dialogue",
  "narration", "dialogue", "dialogue", "narration", "prophet_statement", "narration", "prophet_statement", "dialogue", "dialogue", "narration",
  "dialogue", "dialogue", "prophet_statement", "narration", "dialogue", "dialogue", "prophet_statement", "companion_words", "companion_words", "companion_words",
  "dialogue", "dialogue", "reference_only", "prophet_statement", "prophet_statement", "prophet_statement", "prophet_statement", "dialogue", "companion_words", "dialogue",
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
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync("data/hadith-split/marks-178.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-178.json`);
