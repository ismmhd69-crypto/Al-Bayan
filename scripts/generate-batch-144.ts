import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-144.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only",
  "dialogue", "reference_only", "companion_words", "reference_only", "dialogue", "reference_only", "reference_only", "prophet_words", "prophet_words", "reference_only",
  "dialogue", "reference_only", "prophet_words", "dialogue", "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "dialogue",
  "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words", "dialogue", "reference_only", "dialogue", "dialogue",
  "reference_only", "dialogue", "prophet_words", "reference_only", "prophet_words", "prophet_words", "reference_only", "reference_only", "dialogue", "prophet_words",
  "dialogue", "dialogue", "reference_only", "dialogue", "companion_words", "prophet_words", "companion_words", "dialogue", "reference_only", "dialogue",
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
  [0, "أن رسول الله صلى الله عليه وسلم خرج من عندها"],
  [1, "عن رسول الله صلى الله عليه وسلم أنه قال"],
  [2, "أن النبي صلى الله عليه وسلم قال"],
  [3, "قال النبي صلى الله عليه وسلم"],
  [4, "قال قال رسول الله"],
  [5, "قال قال رسول الله"],
  [6, "قال قال رسول الله"],
  [10, "قال رسول الله صلى الله عليه وسلم"],
  [12, "قال كنا جلوسا عند باب عبد الله"],
  [14, "قال كان عبد الله يذكرنا كل يوم خميس"],
  [17, "عن رسول الله صلى الله عليه وسلم قال"],
  [18, "أن رسول الله صلى الله عليه وسلم قال"],
  [20, "أن رسول الله صلى الله عليه وسلم قال"],
  [22, "يقول قال رسول الله صلى الله عليه وسلم"],
  [23, "قال سمعت النبي صلى الله عليه وسلم يقول"],
  [25, "يقول قال رسول الله صلى الله عليه وسلم"],
  [27, "أن النبي صلى الله عليه وسلم قال"],
  [29, "قال كنا مع رسول الله صلى الله عليه وسلم إذ سمع وجبة"],
  [35, "يرفعه قال"],
  [36, "أنه سمع النبي صلى الله عليه وسلم قال"],
  [38, "قال خطب رسول الله صلى الله عليه وسلم"],
  [39, "قالت سمعت رسول الله صلى الله عليه وسلم يقول"],
  [41, "قال قام فينا رسول الله صلى الله عليه وسلم خطيبا"],
  [42, "عن النبي صلى الله عليه وسلم"],
  [44, "قال سمعت رسول الله صلى الله عليه وسلم يقول"],
  [45, "أن رسول الله صلى الله عليه وسلم قال ذات يوم في خطبته"],
  [48, "قال قام فينا رسول الله صلى الله عليه وسلم ذات يوم خطيبا"],
  [49, "قال قال النبي صلى الله عليه وسلم"],
  [50, "قال بينما النبي صلى الله عليه وسلم في حائط"],
  [51, "قال قال نبي الله صلى الله عليه وسلم"],
  [53, "عن النبي صلى الله عليه وسلم قال"],
  [54, "قال نزلت في عذاب القبر"],
  [55, "إذا خرجت روح المؤمن"],
  [56, "قال كنا مع عمر"],
  [57, "أن رسول الله صلى الله عليه وسلم ترك قتلى بدر"],
  [59, "قالت قال رسول الله صلى الله عليه وسلم"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-144.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-144.json");
