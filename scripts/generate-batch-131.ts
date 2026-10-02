import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-131.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "reference_only", "narration", "narration", "dialogue", "dialogue", "companion_words", "reference_only", "dialogue", "reference_only",
  "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "narration", "companion_words", "reference_only", "dialogue",
  "prophet_words", "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "reference_only", "narration", "reference_only", "companion_words",
  "reference_only", "reference_only", "narration", "reference_only", "dialogue", "reference_only", "companion_words", "dialogue", "dialogue", "dialogue",
  "narration", "reference_only", "reference_only", "reference_only", "prophet_words", "companion_words", "reference_only", "reference_only", "narration", "dialogue",
  "reference_only", "dialogue", "reference_only", "narration", "reference_only", "prophet_words", "reference_only", "reference_only", "narration", "narration",
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
  [0, "\u0623\u0646\u0647\u0627 \u062d\u0645\u0644\u062a \u0628\u0639\u0628\u062f \u0627\u0644\u0644\u0647"],
  [2, "\u0643\u0627\u0646 \u064a\u0624\u062a\u0649 \u0628\u0627\u0644\u0635\u0628\u064a\u0627\u0646"],
  [3, "\u0642\u0627\u0644\u062a \u062c\u0626\u0646\u0627 \u0628\u0639\u0628\u062f \u0627\u0644\u0644\u0647"],
  [4, "\u0642\u0627\u0644 \u0623\u062a\u064a \u0628\u0627\u0644\u0645\u0646\u0630\u0631"],
  [5, "\u0645\u0627 \u0633\u0623\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [6, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0633\u0639\u064a\u062f \u0641\u0642\u0645\u062a \u0645\u0639\u0647"],
  [8, "\u0623\u0628\u0627 \u0645\u0648\u0633\u0649\u060c \u0627\u0633\u062a\u0623\u0630\u0646"],
  [10, "\u0641\u0642\u0627\u0644 \u064a\u0627 \u0623\u0628\u0627 \u0627\u0644\u0645\u0646\u0630\u0631"],
  [11, "\u0642\u0627\u0644 \u0623\u062a\u064a\u062a \u0627\u0644\u0646\u0628\u064a"],
  [12, "\u0642\u0627\u0644 \u0627\u0633\u062a\u0623\u0630\u0646\u062a \u0639\u0644\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [14, "\u0627\u0637\u0651\u0644\u0639 \u0641\u064a \u062c\u062d\u0631"],
  [16, "\u0627\u0637\u0651\u0644\u0639 \u0645\u0646 \u0628\u0639\u0636"],
  [17, "\u0642\u0627\u0644 \u0633\u0623\u0644\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [19, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0623\u0628\u0648 \u0637\u0644\u062d\u0629 \u0643\u0646\u0627"],
  [20, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [21, "\u062d\u0642 \u0627\u0644\u0645\u0633\u0644\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u0644\u0645 \u0633\u062a"],
  [22, "\u0641\u0642\u0648\u0644\u0648\u0627 \u0648\u0639\u0644\u064a\u0643"],
  [23, "\u0642\u0627\u0644\u062a \u0627\u0633\u062a\u0623\u0630\u0646 \u0631\u0647\u0637"],
  [24, "\u0642\u0627\u0644\u062a \u0623\u062a\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [25, "\u064a\u0642\u0648\u0644 \u0633\u0644\u0645 \u0646\u0627\u0633 \u0645\u0646 \u064a\u0647\u0648\u062f"],
  [27, "\u0645\u0631 \u0639\u0644\u0649 \u063a\u0644\u0645\u0627\u0646"],
  [29, "\u0642\u0627\u0644 \u0643\u0646\u062a \u0623\u0645\u0634\u064a \u0645\u0639 \u062b\u0627\u0628\u062a"],
  [32, "\u0623\u0632\u0648\u0627\u062c\u060c \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [34, "\u0625\u064a\u0627\u0643\u0645 \u0648\u0627\u0644\u062f\u062e\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0646\u0633\u0627\u0621"],
  [36, "\u064a\u0642\u0648\u0644 \u0627\u0644\u062d\u0645\u0648 \u0623\u062e \u0627\u0644\u0632\u0648\u062c"],
  [37, "\u0623\u0646 \u0646\u0641\u0631\u0627 \u0645\u0646 \u0628\u0646\u064a \u0647\u0627\u0634\u0645"],
  [38, "\u0643\u0627\u0646 \u0645\u0639 \u0625\u062d\u062f\u0649 \u0646\u0633\u0627\u0626\u0647"],
  [39, "\u0645\u0639\u062a\u0643\u0641\u0627 \u0641\u0623\u062a\u064a\u062a\u0647"],
  [40, "\u0635\u0641\u064a\u0629\u060c \u0632\u0648\u062c \u0627\u0644\u0646\u0628\u064a"],
  [44, "\u0625\u0630\u0627 \u0642\u0627\u0645 \u0623\u062d\u062f\u0643\u0645"],
  [45, "\u0642\u0627\u0644\u062a \u0643\u0646\u062a \u0623\u062e\u062f\u0645 \u0627\u0644\u0632\u0628\u064a\u0631"],
  [48, "\u0623\u0646\u0647\u0627 \u0642\u0627\u0644\u062a \u0643\u0627\u0646 \u0625\u0630\u0627 \u0627\u0634\u062a\u0643\u0649"],
  [49, "\u0642\u0627\u0644\u062a \u0633\u062d\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [51, "\u0627\u0645\u0631\u0623\u0629\u060c \u064a\u0647\u0648\u062f\u064a\u0629 \u0623\u062a\u062a"],
  [53, "\u0625\u0630\u0627 \u0627\u0634\u062a\u0643\u0649 \u0645\u0646\u0627 \u0625\u0646\u0633\u0627\u0646"],
  [55, "\u0625\u0630\u0627 \u0623\u062a\u0649 \u0627\u0644\u0645\u0631\u064a\u0636 \u064a\u062f\u0639\u0648 \u0644\u0647"],
  [58, "\u0625\u0630\u0627 \u0645\u0631\u0636 \u0623\u062d\u062f \u0645\u0646 \u0623\u0647\u0644\u0647"],
  [59, "\u0643\u0627\u0646 \u0625\u0630\u0627 \u0627\u0634\u062a\u0643\u0649 \u064a\u0642\u0631\u0623"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-131.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-131.json");
