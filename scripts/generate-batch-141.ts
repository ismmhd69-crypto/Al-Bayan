import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-141.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "dialogue", "reference_only", "prophet_words", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words",
  "companion_words", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue",
  "dialogue", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "reference_only", "dialogue", "prophet_words", "prophet_words", "reference_only", "companion_words", "reference_only", "reference_only", "dialogue",
  "reference_only", "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only",
  "dialogue", "dialogue", "dialogue", "reference_only", "prophet_words", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue",
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
  [0, "قال جاء سراقة"],
  [1, "قال قيل يا رسول الله"],
  [3, "يقول قال رسول الله"],
  [4, "قال قال رسول الله"],
  [9, "يقول أنه سمع رسول الله"],
  [10, "قال جاء مشركو قريش"],
  [12, "قال قال رسول الله"],
  [14, "وقال رسول الله"],
  [17, "قالت أم حبيبة زوج النبي"],
  [19, "قالت أم حبيبة"],
  [20, "قال قال رسول الله"],
  [23, "لا يحدثكموه أحد بعدي"],
  [32, "قال كان رسول الله"],
  [33, "عن النبي صلى الله عليه وسلم قال"],
  [34, "عن النبي صلى الله عليه وسلم قال"],
  [36, "قال دخلنا على خباب"],
  [39, "قالت قال رسول الله"],
  [42, "عن أبي هريرة، قال قال رسول الله"],
  [44, "قال قال رسول الله"],
  [46, "رسول الله صلى الله عليه وسلم عاد رجلا"],
  [50, "قال جاء أعرابي إلى رسول الله"],
  [51, "سمع النبي صلى الله عليه وسلم وأتاه رجل"],
  [52, "كنا عند رسول الله"],
  [54, "أنه قال أشهد على أبي هريرة"],
  [55, "قال خرج معاوية على حلقة"],
  [57, "قال كنا مع النبي"],
  [59, "أنهم كانوا مع رسول الله"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-141.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-141.json");
