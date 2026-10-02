import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-130.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "narration", "narration", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words", "reference_only", "companion_words",
  "reference_only", "narration", "narration", "narration", "narration", "narration", "prophet_words", "reference_only", "reference_only", "reference_only",
  "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only", "dialogue", "narration", "reference_only", "narration", "companion_words",
  "reference_only", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words", "companion_words", "reference_only", "reference_only", "prophet_words",
  "reference_only", "reference_only", "reference_only", "companion_words", "prophet_words", "reference_only", "companion_words", "narration", "companion_words", "reference_only", "dialogue",
  "dialogue", "prophet_words", "dialogue", "narration", "reference_only", "companion_words", "reference_only", "dialogue", "companion_words",
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
  [0, "\u0642\u0627\u0644\u062a \u062f\u062e\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [1, "\u0623\u0646\u0647\u0627 \u0646\u0635\u0628\u062a \u0633\u062a\u0631\u0627"],
  [2, "\u0623\u0646\u0647\u0627 \u0627\u0634\u062a\u0631\u062a \u0646\u0645\u0631\u0642\u0629"],
  [5, "\u0642\u0627\u0644 \u0643\u0646\u062a \u0645\u0639 \u0645\u0633\u0631\u0648\u0642"],
  [7, "\u0642\u0627\u0644 \u062f\u062e\u0644\u062a \u0645\u0639 \u0623\u0628\u064a \u0647\u0631\u064a\u0631\u0629"],
  [9, "\u0642\u0627\u0644 \u0646\u0647\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [11, "\u0633\u0645\u0639 \u0627\u0628\u0646 \u0639\u0628\u0627\u0633"],
  [12, "\u0642\u0627\u0644 \u0644\u0645\u0627 \u0648\u0644\u062f\u062a \u0623\u0645 \u0633\u0644\u064a\u0645"],
  [13, "\u0633\u0645\u0639\u062a \u0623\u0646\u0633\u0627"],
  [14, "\u064a\u0642\u0648\u0644 \u062f\u062e\u0644\u0646\u0627 \u0639\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [15, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0641\u064a \u064a\u062f \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [16, "\u0646\u0647\u0649 \u0639\u0646 \u0627\u0644\u0642\u0632\u0639"],
  [20, "\u0625\u064a\u0627\u0643\u0645 \u0648\u0627\u0644\u062c\u0644\u0648\u0633 \u0641\u064a \u0627\u0644\u0637\u0631\u0642\u0627\u062a"],
  [22, "\u0625\u064a\u0627\u0643\u0645 \u0648\u0627\u0644\u062c\u0644\u0648\u0633 \u0628\u0627\u0644\u0637\u0631\u0642\u0627\u062a"],
  [25, "\u0627\u0645\u0631\u0623\u0629\u060c \u0623\u062a\u062a \u0627\u0644\u0646\u0628\u064a"],
  [26, "\u0623\u0646 \u062c\u0627\u0631\u064a\u0629\u060c \u0645\u0646 \u0627\u0644\u0623\u0646\u0635\u0627\u0631"],
  [28, "\u0644\u0639\u0646 \u0627\u0644\u0648\u0627\u0635\u0644\u0629"],
  [29, "\u0642\u0627\u0644 \u0644\u0639\u0646 \u0627\u0644\u0644\u0647"],
  [33, "\u064a\u0642\u0648\u0644 \u0632\u062c\u0631 \u0627\u0644\u0646\u0628\u064a"],
  [35, "\u0642\u062f\u0645 \u0645\u0639\u0627\u0648\u064a\u0629 \u0627\u0644\u0645\u062f\u064a\u0646\u0629"],
  [36, "\u0645\u0639\u0627\u0648\u064a\u0629\u060c \u0642\u0627\u0644"],
  [39, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [43, "\u0642\u0627\u0644 \u0646\u0647\u0627\u0646\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [44, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [46, "\u064a\u0642\u0648\u0644 \u0623\u0631\u0627\u062f \u0627\u0644\u0646\u0628\u064a"],
  [47, "\u0623\u0646 \u0627\u0628\u0646\u0629 \u0644\u0639\u0645\u0631"],
  [48, "\u0642\u0627\u0644 \u0643\u0627\u0646\u062a \u062c\u0648\u064a\u0631\u064a\u0629"],
  [50, "\u0642\u0627\u0644\u062a \u0643\u0627\u0646 \u0627\u0633\u0645\u064a \u0628\u0631\u0629"],
  [51, "\u0642\u0627\u0644 \u0633\u0645\u064a\u062a \u0627\u0628\u0646\u062a\u064a \u0628\u0631\u0629"],
  [52, "\u0623\u062e\u0646\u0639 \u0627\u0633\u0645 \u0639\u0646\u062f \u0627\u0644\u0644\u0647"],
  [53, "\u0642\u0627\u0644 \u0630\u0647\u0628\u062a \u0628\u0639\u0628\u062f \u0627\u0644\u0644\u0647"],
  [54, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0628\u0646 \u0644\u0623\u0628\u064a \u0637\u0644\u062d\u0629"],
  [56, "\u0642\u0627\u0644 \u0645\u0627\u062a \u0627\u0628\u0646 \u0644\u0623\u0628\u064a \u0637\u0644\u062d\u0629"],
  [58, "\u0642\u0627\u0644 \u0648\u0644\u062f \u0644\u064a \u063a\u0644\u0627\u0645"],
  [59, "\u0623\u0646\u0647\u0645\u0627 \u0642\u0627\u0644\u0627 \u062e\u0631\u062c\u062a \u0623\u0633\u0645\u0627\u0621"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-130.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-130.json");
