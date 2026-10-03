import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-142.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "narration", "narration", "prophet_words", "reference_only", "prophet_words",
  "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words",
  "prophet_words", "prophet_words", "prophet_words", "dialogue", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only",
  "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only",
  "prophet_words", "prophet_words", "reference_only", "dialogue", "reference_only", "prophet_words", "dialogue", "prophet_words", "dialogue", "dialogue",
  "companion_words", "reference_only", "dialogue", "prophet_words", "prophet_words", "reference_only", "prophet_words", "reference_only", "prophet_words", "prophet_words",
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
  [2, "قال قال لي رسول الله"],
  [3, "يقول إن أبا بكر الصديق قال لرسول الله"],
  [5, "عن النبي صلى الله عليه وسلم أنه تعوذ"],
  [6, "أن النبي صلى الله عليه وسلم كان يتعوذ"],
  [7, "سمعت رسول الله صلى الله عليه وسلم يقول"],
  [9, "أن رسول الله صلى الله عليه وسلم قال"],
  [11, "قال رسول الله صلى الله عليه وسلم لرجل"],
  [13, "أن النبي صلى الله عليه وسلم كان إذا أخذ مضجعه قال"],
  [19, "قال كان رسول الله صلى الله عليه وسلم إذا أمسى قال"],
  [20, "قال كان نبي الله صلى الله عليه وسلم إذا أمسى قال"],
  [21, "قال كان رسول الله صلى الله عليه وسلم إذا أمسى قال"],
  [22, "قال قال لي رسول الله"],
  [23, "أن النبي صلى الله عليه وسلم خرج من عندها"],
  [24, "اشتكت ما تلقى"],
  [27, "أتت النبي صلى الله عليه وسلم"],
  [31, "قال قال رسول الله"],
  [34, "عن النبي صلى الله عليه وسلم أنه قال"],
  [40, "عن النبي صلى الله عليه وسلم قال"],
  [41, "عن رسول الله صلى الله عليه وسلم أنه قال"],
  [43, "قال سمعت رسول الله صلى الله عليه وسلم يقول"],
  [45, "قال رسول الله صلى الله عليه وسلم"],
  [46, "قال قال رسول الله"],
  [47, "أن رسول الله صلى الله عليه وسلم قال"],
  [48, "أبو بكر فقال كيف أنت"],
  [49, "قال كنا عند رسول الله"],
  [50, "قال كنا عند النبي"],
  [52, "أنه قال قدم على رسول الله"],
  [53, "عن النبي صلى الله عليه وسلم قال"],
  [54, "قال سمعت رسول الله صلى الله عليه وسلم يقول"],
  [56, "عن النبي صلى الله عليه وسلم فيما يحكي عن ربه عز وجل قال"],
  [58, "سمعت رسول الله صلى الله عليه وسلم يقول"],
  [59, "عن النبي صلى الله عليه وسلم قال"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-142.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-142.json");
