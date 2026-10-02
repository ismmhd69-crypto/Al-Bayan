import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-137.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "companion_words", "dialogue", "companion_words", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words", "reference_only",
  "dialogue", "companion_words", "narration", "companion_words", "reference_only", "dialogue", "reference_only", "narration", "narration", "companion_words",
  "dialogue", "dialogue", "reference_only", "narration", "companion_words", "dialogue", "reference_only", "companion_words", "companion_words", "reference_only",
  "dialogue", "reference_only", "companion_words", "reference_only", "narration", "dialogue", "reference_only", "reference_only", "narration", "reference_only",
  "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue", "dialogue",
  "dialogue", "narration", "dialogue", "companion_words", "reference_only", "companion_words", "dialogue", "dialogue", "reference_only", "companion_words",
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
  [1, "\u0641\u064a\u0651 \u0646\u0632\u0644\u062a"],
  [2, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0645\u0639 \u0627\u0644\u0646\u0628\u064a"],
  [3, "\u0642\u0627\u0644 \u0644\u0645 \u064a\u0628\u0642 \u0645\u0639 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [6, "\u0642\u0627\u0644\u062a \u0644\u064a \u0639\u0627\u0626\u0634\u0629"],
  [8, "\u0642\u0627\u0644\u062a \u0644\u064a \u0639\u0627\u0626\u0634\u0629"],
  [10, "\u0642\u0627\u0644 \u062e\u0631\u062c\u062a \u0645\u0639 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [11, "\u0642\u0627\u0644 \u0644\u0642\u062f \u0642\u062f\u062a \u0628\u0646\u0628\u064a \u0627\u0644\u0644\u0647"],
  [12, "\u0642\u0627\u0644\u062a \u0639\u0627\u0626\u0634\u0629 \u062e\u0631\u062c \u0627\u0644\u0646\u0628\u064a"],
  [13, "\u0623\u0646\u0647 \u0643\u0627\u0646 \u064a\u0642\u0648\u0644"],
  [15, "\u0642\u0627\u0644 \u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0628\u0646 \u062c\u0639\u0641\u0631"],
  [17, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [18, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [19, "\u0642\u0627\u0644 \u0623\u0631\u062f\u0641\u0646\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [20, "\u0642\u0627\u0644 \u0623\u062a\u0649 \u062c\u0628\u0631\u064a\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [21, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0628\u0646 \u0623\u0628\u064a \u0623\u0648\u0641\u0649"],
  [23, "\u0642\u0627\u0644\u062a \u0628\u0634\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [24, "\u0642\u0627\u0644\u062a \u0645\u0627 \u063a\u0631\u062a \u0639\u0644\u0649 \u0627\u0645\u0631\u0623\u0629"],
  [25, "\u0642\u0627\u0644\u062a \u0645\u0627 \u063a\u0631\u062a \u0639\u0644\u0649 \u0646\u0633\u0627\u0621"],
  [27, "\u0642\u0627\u0644\u062a \u0645\u0627 \u063a\u0631\u062a \u0644\u0644\u0646\u0628\u064a"],
  [28, "\u0642\u0627\u0644\u062a \u0644\u0645 \u064a\u062a\u0632\u0648\u062c \u0627\u0644\u0646\u0628\u064a"],
  [30, "\u0642\u0627\u0644\u062a \u0642\u0627\u0644 \u0644\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [32, "\u0623\u0646\u0647\u0627 \u0643\u0627\u0646\u062a \u062a\u0644\u0639\u0628 \u0628\u0627\u0644\u0628\u0646\u0627\u062a"],
  [34, "\u0643\u0627\u0646\u0648\u0627 \u064a\u062a\u062d\u0631\u0648\u0646"],
  [35, "\u0623\u0646 \u0639\u0627\u0626\u0634\u0629"],
  [38, "\u0642\u0627\u0644\u062a \u0643\u0646\u062a \u0623\u0633\u0645\u0639"],
  [40, "\u0623\u0646 \u0639\u0627\u0626\u0634\u0629"],
  [41, "\u0642\u0627\u0644\u062a \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [46, "\u0623\u0646 \u0639\u0644\u064a \u0628\u0646 \u0627\u0644\u062d\u0633\u064a\u0646 \u062d\u062f\u062b\u0647"],
  [48, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [49, "\u0642\u0627\u0644\u062a \u0643\u0646 \u0623\u0632\u0648\u0627\u062c \u0627\u0644\u0646\u0628\u064a"],
  [50, "\u0642\u0627\u0644\u062a \u0627\u062c\u062a\u0645\u0639 \u0646\u0633\u0627\u0621 \u0627\u0644\u0646\u0628\u064a"],
  [51, "\u0642\u0627\u0644 \u0627\u0646\u0637\u0644\u0642 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [52, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0623\u0628\u0648 \u0628\u0643\u0631"],
  [53, "\u0642\u0627\u0644 \u0642\u062f\u0645\u062a \u0623\u0646\u0627 \u0648\u0623\u062e\u064a"],
  [55, "\u0642\u0627\u0644 \u0623\u062a\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [56, "\u0642\u0627\u0644 \u0634\u0647\u062f\u062a \u0623\u0628\u0627 \u0645\u0648\u0633\u0649"],
  [57, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0641\u064a \u062f\u0627\u0631 \u0623\u0628\u064a \u0645\u0648\u0633\u0649"],
  [59, "\u0623\u0646\u0647 \u0642\u0627\u0644"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-137.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-137.json");
