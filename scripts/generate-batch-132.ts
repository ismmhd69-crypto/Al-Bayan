import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-132.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "companion_words", "companion_words", "narration", "narration", "reference_only", "narration", "companion_words", "companion_words", "dialogue",
  "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "narration",
  "reference_only", "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "prophet_words", "reference_only", "dialogue", "prophet_words",
  "prophet_words", "reference_only", "reference_only", "companion_words", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words", "reference_only",
  "dialogue", "dialogue", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "dialogue", "reference_only", "prophet_words",
  "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "prophet_words",
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
  [1, "\u0642\u0627\u0644 \u0633\u0623\u0644\u062a \u0639\u0627\u0626\u0634\u0629 \u0639\u0646 \u0627\u0644\u0631\u0642\u064a\u0629"],
  [2, "\u0642\u0627\u0644\u062a \u0631\u062e\u0635 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [3, "\u0643\u0627\u0646 \u0625\u0630\u0627"],
  [4, "\u0643\u0627\u0646 \u064a\u0623\u0645\u0631\u0647\u0627 \u0623\u0646 \u062a\u0633\u062a\u0631\u0642\u064a"],
  [6, "\u064a\u0623\u0645\u0631\u0646\u064a \u0623\u0646 \u0623\u0633\u062a\u0631\u0642\u064a"],
  [7, "\u0642\u0627\u0644 \u0631\u062e\u0635 \u0641\u064a \u0627\u0644\u062d\u0645\u0629"],
  [8, "\u0641\u064a \u0627\u0644\u0631\u0642\u064a\u0629 \u0645\u0646 \u0627\u0644\u0639\u064a\u0646"],
  [9, "\u0631\u062e\u0635 \u0627\u0644\u0646\u0628\u064a"],
  [12, "\u0623\u0646 \u0646\u0627\u0633\u0627\u060c \u0645\u0646 \u0623\u0635\u062d\u0627\u0628"],
  [17, "\u0642\u0627\u0644 \u062c\u0627\u0621\u0646\u0627 \u062c\u0627\u0628\u0631"],
  [18, "\u0623\u0645 \u0633\u0644\u0645\u0629\u060c \u0627\u0633\u062a\u0623\u0630\u0646\u062a"],
  [19, "\u0642\u0627\u0644 \u0628\u0639\u062b \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [21, "\u064a\u0648\u0645 \u0627\u0644\u0623\u062d\u0632\u0627\u0628"],
  [22, "\u0631\u0645\u064a \u0633\u0639\u062f \u0628\u0646 \u0645\u0639\u0627\u0630"],
  [24, "\u0623\u0646\u0647\u0627 \u0643\u0627\u0646\u062a \u062a\u0624\u062a\u0649 \u0628\u0627\u0644\u0645\u0631\u0623\u0629"],
  [26, "\u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [28, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0625\u0644\u0649 \u0627\u0644\u0646\u0628\u064a"],
  [29, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [30, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [33, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0628\u0627\u0644\u0645\u062f\u064a\u0646\u0629"],
  [36, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0623\u0633\u0627\u0645\u0629 \u0628\u0646 \u0632\u064a\u062f"],
  [38, "\u0642\u0627\u0644 \u0648\u0642\u0627\u0644 \u0644\u0647 \u0623\u064a\u0636\u0627"],
  [40, "\u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [41, "\u0644\u0627 \u0639\u062f\u0648\u0649 \u0648\u0644\u0627 \u0637\u064a\u0631\u0629"],
  [42, "\u0642\u0627\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [43, "\u0644\u0627 \u0639\u062f\u0648\u0649"],
  [44, "\u0644\u0627 \u0639\u062f\u0648\u0649"],
  [46, "\u064a\u0642\u0648\u0644 \u0633\u0645\u0639\u062a \u0627\u0644\u0646\u0628\u064a"],
  [47, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0627\u0644\u0646\u0628\u064a"],
  [49, "\u0644\u0627 \u0639\u062f\u0648\u0649 \u0648\u0644\u0627 \u0637\u064a\u0631\u0629"],
  [53, "\u0642\u0627\u0644\u062a \u0639\u0627\u0626\u0634\u0629 \u0633\u0623\u0644 \u0623\u0646\u0627\u0633"],
  [55, "\u0623\u062e\u0628\u0631\u0646\u064a \u0631\u062c\u0644\u060c \u0645\u0646 \u0623\u0635\u062d\u0627\u0628 \u0627\u0644\u0646\u0628\u064a"],
  [57, "\u0642\u0627\u0644\u062a \u0623\u0645\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [59, "\u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-132.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-132.json");
