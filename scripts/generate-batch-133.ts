import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-133.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "companion_words",
  "narration", "companion_words", "reference_only", "prophet_words", "narration", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "prophet_words", "companion_words",
  "dialogue", "dialogue", "prophet_words", "reference_only", "reference_only", "reference_only", "prophet_words", "companion_words", "prophet_words", "reference_only",
  "reference_only", "reference_only", "reference_only", "companion_words", "reference_only", "prophet_words", "dialogue", "dialogue", "dialogue", "dialogue",
  "dialogue", "dialogue", "narration", "narration", "narration", "narration", "dialogue", "reference_only", "companion_words", "prophet_words",
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
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }

const starts: Array<[number, string]> = [
  [0, "\u0623\u0628\u0627 \u0644\u0628\u0627\u0628\u0629\u060c \u0643\u0644\u0645 \u0627\u0628\u0646 \u0639\u0645\u0631"],
  [1, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0628\u0646 \u0639\u0645\u0631 \u064a\u0642\u062a\u0644 \u0627\u0644\u062d\u064a\u0627\u062a"],
  [2, "\u0646\u0647\u0649 \u0639\u0646 \u0642\u062a\u0644 \u0627\u0644\u062c\u0646\u0627\u0646"],
  [3, "\u0623\u0646 \u0623\u0628\u0627 \u0644\u0628\u0627\u0628\u0629"],
  [4, "\u0623\u0646 \u0623\u0628\u0627 \u0644\u0628\u0627\u0628\u0629 \u0628\u0646 \u0639\u0628\u062f \u0627\u0644\u0645\u0646\u0630\u0631"],
  [5, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0644\u0628\u0627\u0628\u0629 \u0627\u0644\u0623\u0646\u0635\u0627\u0631\u064a"],
  [7, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0645\u0639 \u0627\u0644\u0646\u0628\u064a"],
  [9, "\u0642\u0627\u0644 \u0628\u064a\u0646\u0645\u0627 \u0646\u062d\u0646 \u0645\u0639 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [10, "\u0623\u0645\u0631 \u0645\u062d\u0631\u0645\u0627 \u0628\u0642\u062a\u0644 \u062d\u064a\u0629"],
  [11, "\u0623\u0646\u0647 \u062f\u062e\u0644 \u0639\u0644\u0649 \u0623\u0628\u064a \u0633\u0639\u064a\u062f"],
  [13, "\u0623\u0645\u0631\u0647\u0627 \u0628\u0642\u062a\u0644 \u0627\u0644\u0623\u0648\u0632\u0627\u063a"],
  [14, "\u0627\u0633\u062a\u0623\u0645\u0631\u062a \u0627\u0644\u0646\u0628\u064a"],
  [15, "\u0623\u0645\u0631 \u0628\u0642\u062a\u0644 \u0627\u0644\u0648\u0632\u063a"],
  [24, "\u0628\u064a\u0646\u0645\u0627 \u0631\u062c\u0644 \u064a\u0645\u0634\u064a \u0628\u0637\u0631\u064a\u0642"],
  [26, "\u0644\u0627 \u064a\u0642\u0648\u0644\u0646 \u0623\u062d\u062f\u0643\u0645"],
  [28, "\u0630\u0643\u0631 \u0627\u0645\u0631\u0623\u0629 \u0645\u0646 \u0628\u0646\u064a \u0625\u0633\u0631\u0627\u0626\u064a\u0644"],
  [29, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0628\u0646 \u0639\u0645\u0631 \u0625\u0630\u0627 \u0627\u0633\u062a\u062c\u0645\u0631"],
  [30, "\u0642\u0627\u0644 \u0631\u062f\u0641\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [31, "\u0642\u0627\u0644 \u0627\u0633\u062a\u0646\u0634\u062f\u0646\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [32, "\u0644\u0623\u0646 \u064a\u0645\u062a\u0644\u0626 \u062c\u0648\u0641 \u0627\u0644\u0631\u062c\u0644"],
  [36, "\u0625\u0630\u0627 \u0627\u0642\u062a\u0631\u0628 \u0627\u0644\u0632\u0645\u0627\u0646"],
  [37, "\u0642\u0627\u0644 \u0625\u0630\u0627 \u0627\u0642\u062a\u0631\u0628 \u0627\u0644\u0632\u0645\u0627\u0646"],
  [38, "\u0631\u0624\u064a\u0627 \u0627\u0644\u0645\u0633\u0644\u0645 \u064a\u0631\u0627\u0647\u0627"],
  [43, "\u0642\u0627\u0644 \u0646\u0627\u0641\u0639 \u062d\u0633\u0628\u062a \u0623\u0646 \u0627\u0628\u0646 \u0639\u0645\u0631 \u0642\u0627\u0644"],
  [45, "\u0645\u0646 \u0631\u0622\u0646\u064a \u0641\u064a \u0627\u0644\u0646\u0648\u0645"],
  [46, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0623\u0639\u0631\u0627\u0628\u064a \u0625\u0644\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [47, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [48, "\u0623\u062a\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [49, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [50, "\u0623\u062a\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [51, "\u0642\u062f\u0645 \u0645\u0633\u064a\u0644\u0645\u0629 \u0627\u0644\u0643\u0630\u0627\u0628"],
  [52, "\u062f\u0639\u0627 \u0628\u0645\u0627\u0621"],
  [53, "\u0623\u0646\u0647 \u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [54, "\u0648\u0623\u0635\u062d\u0627\u0628\u0647 \u0628\u0627\u0644\u0632\u0648\u0631\u0627\u0621"],
  [55, "\u0643\u0627\u0646 \u0628\u0627\u0644\u0632\u0648\u0631\u0627\u0621"],
  [56, "\u0623\u0645 \u0645\u0627\u0644\u0643\u060c \u0643\u0627\u0646\u062a \u062a\u0647\u062f\u064a"],
  [58, "\u0642\u0627\u0644 \u0647\u0630\u0627 \u0645\u0627 \u062d\u062f\u062b\u0646\u0627 \u0623\u0628\u0648 \u0647\u0631\u064a\u0631\u0629"],
  [59, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-133.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-133.json");
