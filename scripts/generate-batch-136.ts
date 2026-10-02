import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-136.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "reference_only", "reference_only", "reference_only", "prophet_words", "prophet_words", "reference_only", "companion_words", "reference_only", "reference_only",
  "companion_words", "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "reference_only", "narration", "dialogue", "reference_only",
  "companion_words", "dialogue", "dialogue", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words", "prophet_words",
  "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "narration", "reference_only", "companion_words", "reference_only",
  "dialogue", "reference_only", "dialogue", "reference_only", "companion_words", "companion_words", "narration", "reference_only", "dialogue", "prophet_words",
  "prophet_words", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "reference_only", "companion_words",
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
  [0, "\u0648\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [4, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [5, "\u0648\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [7, "\u0642\u0627\u0644 \u0628\u064a\u0646\u0645\u0627 \u064a\u0647\u0648\u062f\u064a"],
  [10, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u064a\u0647\u0648\u062f\u064a"],
  [11, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [12, "\u0642\u064a\u0644 \u064a\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [13, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0627\u0628\u0646 \u0639\u0628\u0627\u0633"],
  [14, "\u0642\u064a\u0644 \u0644\u0627\u0628\u0646 \u0639\u0628\u0627\u0633"],
  [15, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [17, "\u0623\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [18, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [20, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0623\u0628\u064a \u064a\u0642\u0648\u0644"],
  [21, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [22, "\u0633\u0645\u0639\u062a \u0639\u0627\u0626\u0634\u0629"],
  [23, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [28, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [29, "\u0639\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [34, "\u0639\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [35, "\u0623\u0646 \u0623\u0628\u0627\u0647 \u0633\u0639\u062f\u0627 \u0642\u0627\u0644"],
  [36, "\u0623\u0646 \u0639\u0645\u0631 \u0628\u0646 \u0627\u0644\u062e\u0637\u0627\u0628"],
  [38, "\u0642\u0627\u0644 \u0639\u0645\u0631 \u0648\u0627\u0641\u0642\u062a \u0631\u0628\u064a"],
  [40, "\u0623\u0646 \u0639\u0627\u0626\u0634\u0629 \u0632\u0648\u062c \u0627\u0644\u0646\u0628\u064a"],
  [42, "\u0642\u0627\u0644 \u0628\u064a\u0646\u0645\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [44, "\u0623\u0646\u0647 \u062a\u0648\u0636\u0623 \u0641\u064a \u0628\u064a\u062a\u0647"],
  [45, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0645\u0648\u0633\u0649 \u062e\u0631\u062c\u062a"],
  [46, "\u0642\u0627\u0644 \u062e\u0631\u062c \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [48, "\u0642\u0627\u0644 \u0623\u0645\u0631 \u0645\u0639\u0627\u0648\u064a\u0629"],
  [49, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [50, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [51, "\u0642\u0627\u0644 \u0627\u0646\u0637\u0644\u0642\u062a \u0623\u0646\u0627"],
  [54, "\u0642\u0627\u0644 \u062f\u062e\u0644\u0646\u0627 \u0639\u0644\u064a\u0647"],
  [55, "\u0642\u0627\u0644 \u0627\u0633\u062a\u0639\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u062f\u064a\u0646\u0629"],
  [56, "\u0623\u0646 \u0639\u0627\u0626\u0634\u0629"],
  [59, "\u0642\u0627\u0644 \u0644\u0642\u062f \u062c\u0645\u0639 \u0644\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-136.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-136.json");
