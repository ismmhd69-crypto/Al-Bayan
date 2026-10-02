import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-134.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "prophet_words", "reference_only", "reference_only", "prophet_words", "reference_only", "prophet_words", "companion_words", "reference_only", "reference_only", "reference_only",
  "dialogue", "prophet_words", "prophet_words", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "prophet_words",
  "reference_only", "companion_words", "companion_words", "narration", "reference_only", "narration", "reference_only", "companion_words", "reference_only", "companion_words",
  "companion_words", "narration", "companion_words", "reference_only", "companion_words", "dialogue", "narration", "companion_words", "companion_words", "prophet_words",
  "dialogue", "reference_only", "reference_only", "narration", "reference_only", "companion_words", "reference_only", "reference_only", "narration", "companion_words",
  "narration", "reference_only", "reference_only", "narration", "reference_only", "narration", "reference_only", "companion_words", "companion_words", "narration",
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
  [0, "\u0645\u062b\u0644\u064a \u0648\u0645\u062b\u0644 \u0627\u0644\u0623\u0646\u0628\u064a\u0627\u0621"],
  [3, "\u0623\u0646\u0627 \u0641\u0631\u0637\u0643\u0645"],
  [5, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [6, "\u0642\u0627\u0644\u062a \u0643\u0646\u062a \u0623\u0633\u0645\u0639 \u0627\u0644\u0646\u0627\u0633"],
  [10, "\u062d\u0648\u0636\u0647 \u0645\u0627 \u0628\u064a\u0646 \u0635\u0646\u0639\u0627\u0621 \u0648\u0627\u0644\u0645\u062f\u064a\u0646\u0629"],
  [11, "\u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [12, "\u0625\u0646 \u0623\u0645\u0627\u0645\u0643\u0645 \u062d\u0648\u0636\u0627"],
  [15, "\u0625\u0646\u064a \u0644\u0628\u0639\u0642\u0631 \u062d\u0648\u0636\u064a"],
  [19, "\u062a\u0631\u0649 \u0641\u064a\u0647 \u0623\u0628\u0627\u0631\u064a\u0642 \u0627\u0644\u0630\u0647\u0628"],
  [21, "\u0631\u0623\u064a\u062a \u0639\u0646 \u064a\u0645\u064a\u0646\u060c \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [22, "\u0642\u0627\u0644 \u0644\u0642\u062f \u0631\u0623\u064a\u062a \u064a\u0648\u0645 \u0623\u062d\u062f"],
  [23, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [25, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [27, "\u062e\u062f\u0645\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [29, "\u0644\u0645\u0627 \u0642\u062f\u0645 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [30, "\u062e\u062f\u0645\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [31, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [32, "\u0645\u0627 \u0633\u0626\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [34, "\u0645\u0627 \u0633\u0626\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [35, "\u0631\u062c\u0644\u0627\u060c \u0633\u0623\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [36, "\u0642\u0627\u0644 \u063a\u0632\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [37, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [38, "\u0644\u0645\u0627 \u0645\u0627\u062a \u0627\u0644\u0646\u0628\u064a"],
  [39, "\u0648\u0644\u062f \u0644\u064a \u0627\u0644\u0644\u064a\u0644\u0629 \u063a\u0644\u0627\u0645"],
  [40, "\u0642\u0627\u0644\u062a \u0642\u062f\u0645 \u0646\u0627\u0633 \u0645\u0646 \u0627\u0644\u0623\u0639\u0631\u0627\u0628"],
  [43, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [45, "\u0642\u0644\u062a \u0644\u062c\u0627\u0628\u0631 \u0628\u0646 \u0633\u0645\u0631\u0629"],
  [48, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
  [49, "\u0642\u0627\u0644 \u0644\u0642\u062f \u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [50, "\u0623\u0646\u0647\u0627 \u0642\u0627\u0644\u062a \u0645\u0627 \u062e\u064a\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [53, "\u0642\u0627\u0644\u062a \u0645\u0627 \u062e\u064a\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [55, "\u0642\u0627\u0644\u062a \u0645\u0627 \u0636\u0631\u0628 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [57, "\u0642\u0627\u0644 \u0635\u0644\u064a\u062a \u0645\u0639 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [58, "\u0642\u0627\u0644 \u0623\u0646\u0633 \u0645\u0627 \u0634\u0645\u0645\u062a \u0639\u0646\u0628\u0631\u0627"],
  [59, "\u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647 \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-134.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-134.json");
