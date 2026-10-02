import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-135.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "companion_words", "companion_words", "companion_words", "narration", "reference_only", "companion_words", "companion_words", "companion_words", "dialogue",
  "narration", "companion_words", "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "companion_words",
  "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "narration",
  "dialogue", "narration", "reference_only", "companion_words", "narration", "reference_only", "dialogue", "dialogue", "companion_words", "companion_words",
  "dialogue", "companion_words", "dialogue", "reference_only", "companion_words", "reference_only", "companion_words", "reference_only", "reference_only", "dialogue",
  "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue",
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
  [0, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [1, "\u0642\u0627\u0644\u062a \u0625\u0646 \u0643\u0627\u0646 \u0644\u064a\u0646\u0632\u0644"],
  [2, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0646\u0628\u064a \u0627\u0644\u0644\u0647"],
  [3, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [4, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0623\u0647\u0644 \u0627\u0644\u0643\u062a\u0627\u0628"],
  [6, "\u064a\u0642\u0648\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [7, "\u0642\u0627\u0644 \u0645\u0627 \u0631\u0623\u064a\u062a \u0645\u0646 \u0630\u064a \u0644\u0645\u0629"],
  [8, "\u064a\u0642\u0648\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [9, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [10, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [11, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0634\u0639\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [12, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [13, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0647 \u0623\u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [14, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [15, "\u0642\u0627\u0644 \u0633\u0626\u0644 \u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [16, "\u0642\u0627\u0644 \u0633\u0623\u0644\u062a \u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [17, "\u0642\u0627\u0644 \u0633\u0623\u0644\u062a \u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [18, "\u0642\u0627\u0644 \u0633\u0626\u0644 \u0623\u0646\u0633 \u0628\u0646 \u0645\u0627\u0644\u0643"],
  [19, "\u0642\u0627\u0644 \u064a\u0643\u0631\u0647 \u0623\u0646 \u064a\u0646\u062a\u0641 \u0627\u0644\u0631\u062c\u0644"],
  [21, "\u0623\u0646\u0647 \u0633\u0626\u0644 \u0639\u0646 \u0634\u064a\u0628 \u0627\u0644\u0646\u0628\u064a"],
  [22, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [23, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [25, "\u0633\u0645\u0639\u062a \u062c\u0627\u0628\u0631 \u0628\u0646 \u0633\u0645\u0631\u0629"],
  [26, "\u064a\u0642\u0648\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [27, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u062e\u0627\u062a\u0645\u0627 \u0641\u064a \u0638\u0647\u0631 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [29, "\u064a\u0642\u0648\u0644 \u0630\u0647\u0628\u062a \u0628\u064a \u062e\u0627\u0644\u062a\u064a"],
  [30, "\u0642\u0627\u0644 \u0631\u0623\u064a\u062a \u0627\u0644\u0646\u0628\u064a"],
  [31, "\u0623\u0646\u0647 \u0633\u0645\u0639\u0647 \u064a\u0642\u0648\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [33, "\u0642\u0627\u0644 \u0642\u0628\u0636 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [34, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [36, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0639\u0631\u0648\u0629 \u0643\u0645 \u0643\u0627\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [37, "\u0642\u0627\u0644 \u0642\u0644\u062a \u0644\u0639\u0631\u0648\u0629 \u0643\u0645 \u0644\u0628\u062b \u0627\u0644\u0646\u0628\u064a"],
  [38, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [39, "\u0642\u0627\u0644 \u0623\u0642\u0627\u0645 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [40, "\u0642\u0627\u0644 \u0643\u0646\u062a \u062c\u0627\u0644\u0633\u0627 \u0645\u0639 \u0639\u0628\u062f \u0627\u0644\u0644\u0647"],
  [41, "\u0623\u0646\u0647 \u0633\u0645\u0639 \u0645\u0639\u0627\u0648\u064a\u0629"],
  [42, "\u0642\u0627\u0644 \u0633\u0623\u0644\u062a \u0627\u0628\u0646 \u0639\u0628\u0627\u0633 \u0643\u0645 \u0623\u062a\u0649 \u0644\u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [44, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [46, "\u0642\u0627\u0644 \u0623\u0642\u0627\u0645 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [49, "\u0623\u0646 \u0631\u062c\u0644\u0627 \u0645\u0646 \u0627\u0644\u0623\u0646\u0635\u0627\u0631"],
  [51, "\u0642\u0627\u0644 \u0628\u0644\u063a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [52, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [54, "\u0633\u0623\u0644\u0648\u0627 \u0646\u0628\u064a \u0627\u0644\u0644\u0647"],
  [56, "\u0642\u0627\u0644 \u0633\u0626\u0644 \u0627\u0644\u0646\u0628\u064a"],
  [57, "\u0642\u0627\u0644 \u0645\u0631\u0631\u062a \u0645\u0639 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [58, "\u0642\u0627\u0644 \u0642\u062f\u0645 \u0646\u0628\u064a \u0627\u0644\u0644\u0647"],
  [59, "\u0623\u0646 \u0627\u0644\u0646\u0628\u064a"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-135.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-135.json");
