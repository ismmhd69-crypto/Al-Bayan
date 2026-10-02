import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-139.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "dialogue", "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "narration", "narration", "dialogue",
  "prophet_words", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only",
  "reference_only", "reference_only", "dialogue", "prophet_words", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue",
  "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "prophet_words",
  "reference_only", "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "companion_words", "reference_only",
  "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue",
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) {
  const clean: string[] = [], map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670\u200e\u200f]/.test(text[i])) continue;
    clean.push(text[i]); map.push(i);
  }
  return { clean: clean.join(""), map };
}
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) {
  const { clean, map } = cleanMap(text);
  const p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate: ${needle}`);
  return text.slice(map[p], map[p] + Math.min(100, text.length - map[p]));
}
function setStart(i: number, needle: string) {
  try { marks[i].start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Index ${i}: ${(error as Error).message}`); }
}

const starts: Array<[number, string]> = [
  [0, "\u0642\u0627\u0644 \u0623\u062a\u064a\u062a \u0639\u0645\u0631"],
  [1, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0647\u0631\u064a\u0631\u0629"],
  [3, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [5, "\u0623\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [7, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [8, "\u0642\u0627\u0644 \u062d\u0627\u0644\u0641 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [9, "\u0642\u0627\u0644 \u0635\u0644\u064a\u0646\u0627 \u0627\u0644\u0645\u063a\u0631\u0628"],
  [10, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [12, "\u0639\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [13, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [15, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [17, "\u0639\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [22, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0639\u0645\u0631 \u0628\u0646 \u0627\u0644\u062e\u0637\u0627\u0628"],
  [23, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [24, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0625\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [27, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [29, "\u0623\u0646 \u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0628\u0646 \u0639\u0645\u0631\u0648 \u0628\u0646 \u0627\u0644\u0639\u0627\u0635"],
  [30, "\u0623\u0646\u0647 \u0642\u0627\u0644 \u0643\u0627\u0646 \u062c\u0631\u064a\u062c"],
  [31, "\u0639\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [32, "\u0639\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [33, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [34, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [35, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [39, "\u0623\u0646\u0648\u0633\u0644\u0645 \u0642\u0627\u0644"],
  [42, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [44, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [46, "\u0639\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [48, "\u0642\u0627\u0644\u062a \u0639\u0627\u0626\u0634\u0629"],
  [50, "\u0642\u0627\u0644 \u062f\u062e\u0644\u062a \u0639\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [53, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [54, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0644\u064a \u0627\u0628\u0646 \u0639\u0628\u0627\u0633"],
  [57, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [58, "\u0642\u0627\u0644 \u0627\u0642\u062a\u062a\u0644 \u063a\u0644\u0627\u0645\u0627\u0646"],
  [59, "\u064a\u0642\u0648\u0644 \u0643\u0646\u0627 \u0645\u0639 \u0627\u0644\u0646\u0628\u064a"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-139.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-139.json");
