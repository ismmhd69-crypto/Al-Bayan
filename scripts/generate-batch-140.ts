import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-140.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "dialogue",
  "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words", "dialogue", "dialogue", "reference_only", "reference_only",
  "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only",
  "reference_only", "reference_only", "narration", "narration", "prophet_words", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue",
  "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only",
  "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only",
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
  [2, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [3, "\u064a\u0642\u0648\u0644 \u062d\u062f\u062b\u062a\u0646\u064a \u0639\u0627\u0626\u0634\u0629"],
  [5, "\u0632\u0627\u062f \u0641\u064a \u0627\u0644\u062d\u062f\u064a\u062b \u0631\u0643\u0628\u062a \u0639\u0627\u0626\u0634\u0629"],
  [9, "\u0642\u0627\u0644\u062a \u062f\u062e\u0644 \u0639\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [15, "\u064a\u0642\u0648\u0644 \u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [16, "\u0642\u0627\u0644 \u0643\u0627\u0646\u062a \u0639\u0646\u062f \u0623\u0645 \u0633\u0644\u064a\u0645 \u064a\u062a\u064a\u0645\u0629"],
  [17, "\u0642\u0627\u0644 \u0643\u0646\u062a \u0623\u0644\u0639\u0628 \u0645\u0639 \u0627\u0644\u0635\u0628\u064a\u0627\u0646"],
  [21, "\u0642\u0627\u0644 \u0625\u0646 \u0645\u062d\u0645\u062f\u0627"],
  [23, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [25, "\u0633\u0645\u0639\u062a \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [27, "\u0642\u0627\u0644 \u0627\u0633\u062a\u0628 \u0631\u062c\u0644\u0627\u0646 \u0639\u0646\u062f \u0627\u0644\u0646\u0628\u064a"],
  [32, "\u0623\u0646 \u0631\u062c\u0644\u0627"],
  [33, "\u0639\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [34, "\u0639\u0646 \u0627\u0644\u0646\u0628\u064a"],
  [38, "\u0623\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [39, "\u0642\u0627\u0644 \u062c\u0627\u0621\u062a \u0627\u0645\u0631\u0623\u0629 \u0625\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [40, "\u0642\u0627\u0644 \u0623\u062a\u062a \u0627\u0645\u0631\u0623\u0629 \u0627\u0644\u0646\u0628\u064a"],
  [42, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0628\u0639\u0631\u0641\u0629"],
  [43, "\u0623\u0646 \u0623\u0639\u0631\u0627\u0628\u064a\u0627"],
  [44, "\u0642\u0627\u0644 \u0642\u0627\u0644 \u0631\u062c\u0644 \u064a\u0627 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [45, "\u0642\u0627\u0644 \u062c\u0627\u0621 \u0631\u062c\u0644 \u0625\u0644\u0649 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [47, "\u0642\u0627\u0644 \u0628\u064a\u0646\u0645\u0627 \u0623\u0646\u0627 \u0648\u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
  [55, "\u0642\u0627\u0644 \u062f\u062e\u0644\u062a \u0639\u0644\u0649 \u0623\u0628\u064a \u0633\u0631\u064a\u062d\u0629"],
  [56, "\u0642\u0627\u0644 \u0643\u0646\u0627 \u0641\u064a \u062c\u0646\u0627\u0632\u0629"],
  [58, "\u0642\u0627\u0644 \u0643\u0627\u0646 \u0631\u0633\u0648\u0644 \u0627\u0644\u0644\u0647"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-140.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-140.json");
