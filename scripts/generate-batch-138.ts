import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-138.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "companion_words", "reference_only", "reference_only", "dialogue",
  "dialogue", "reference_only", "companion_words", "dialogue", "companion_words", "reference_only", "companion_words", "companion_words", "companion_words", "dialogue",
  "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "companion_words", "dialogue", "companion_words", "dialogue", "reference_only",
  "companion_words", "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "companion_words",
  "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "prophet_words", "reference_only", "reference_only", "reference_only",
  "dialogue", "companion_words", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "dialogue",
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
  [0, "\u0642\u0627\u0644 \u0648\u0627\u0644\u0630\u064a \u0644\u0627 \u0625\u0644\u0647 \u063a\u064a\u0631\u0647"],
  [4, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0623\u0646\u0633\u0627"],
  [5, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [6, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0627\u0644\u0628\u0631\u0627\u0621"],
  [9, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [10, "\u064a\u0642\u0648\u0644 \u0644\u0645\u0627 \u0643\u0627\u0646 \u064a\u0648\u0645 \u0623\u062d\u062f"],
  [12, "\u0642\u0627\u0644 \u062c\u064a\u0621 \u0628\u0623\u0628\u064a \u064a\u0648\u0645 \u0623\u062d\u062f"],
  [13, "\u0623\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [14, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0630\u0631 \u062e\u0631\u062c\u0646\u0627"],
  [16, "\u0642\u0627\u0644 \u0623\u0628\u0648 \u0630\u0631 \u064a\u0627 \u0627\u0628\u0646 \u0623\u062e\u064a"],
  [17, "\u0642\u0627\u0644 \u062c\u0631\u064a\u0631 \u0628\u0646 \u0639\u0628\u062f \u0627\u0644\u0644\u0647"],
  [18, "\u0642\u0627\u0644 \u0645\u0627 \u062d\u062c\u0628\u0646\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [19, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0644\u064a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [21, "\u0623\u062a\u0649 \u0627\u0644\u062e\u0644\u0627\u0621"],
  [25, "\u0642\u0627\u0644 \u0645\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [26, "\u0642\u0627\u0644 \u0623\u062a\u0649 \u0639\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [27, "\u0642\u0627\u0644 \u0623\u0633\u0631 \u0625\u0644\u0649 \u0646\u0628\u064a \u0627\u0644\u0644\u0647"],
  [28, "\u0623\u0646 \u062d\u0633\u0627\u0646"],
  [30, "\u0623\u0646 \u062d\u0633\u0627\u0646 \u0628\u0646 \u062b\u0627\u0628\u062a"],
  [32, "\u0642\u0627\u0644 \u062f\u062e\u0644\u062a \u0639\u0644\u0649 \u0639\u0627\u0626\u0634\u0629"],
  [35, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [36, "\u0642\u0627\u0644 \u0643\u0646\u062a \u0623\u062f\u0639\u0648 \u0623\u0645\u064a"],
  [38, "\u0623\u0646 \u0639\u0627\u0626\u0634\u0629 \u0642\u0627\u0644\u062a"],
  [39, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0623\u0628\u0648 \u0647\u0631\u064a\u0631\u0629"],
  [40, "\u0642\u0627\u0644 \u0633\u0645\u0639\u062a \u0639\u0644\u064a\u0627"],
  [41, "\u0623\u0646\u0647 \u0633\u0645\u0639 \u062c\u0627\u0628\u0631"],
  [42, "\u0642\u0627\u0644 \u0643\u0646\u062a \u0639\u0646\u062f \u0627\u0644\u0646\u0628\u064a"],
  [43, "\u0642\u0627\u0644 \u0644\u0645\u0627 \u0641\u0631\u063a \u0627\u0644\u0646\u0628\u064a"],
  [44, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u0645\u0633\u0644\u0645\u0648\u0646"],
  [45, "\u0642\u0627\u0644 \u0641\u064a\u0646\u0627 \u0646\u0632\u0644\u062a"],
  [46, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [50, "\u064a\u0642\u0648\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [51, "\u0642\u0627\u0644 \u062e\u0631\u062c\u062a \u0645\u0639 \u062c\u0631\u064a\u0631"],
  [56, "\u0623\u0646 \u0627\u0644\u0623\u0642\u0631\u0639 \u0628\u0646 \u062d\u0627\u0628\u0633"],
  [59, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-138.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-138.json");
