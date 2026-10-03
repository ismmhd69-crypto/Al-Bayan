import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-145.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only",
  "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "narration", "reference_only", "companion_words",
  "reference_only", "companion_words", "dialogue", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only",
  "prophet_words", "prophet_words", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only",
  "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only",
  "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "dialogue", "reference_only", "reference_only", "prophet_words", "dialogue",
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
  [1, "عن النبي صلى الله عليه وسلم قال"],
  [4, "أن النبي صلى الله عليه وسلم استيقظ"],
  [6, "قالت خرج رسول الله صلى الله عليه وسلم يوما"],
  [8, "قال دخل الحارث بن أبي ربيعة"],
  [10, "قالت عبث رسول الله صلى الله عليه وسلم"],
  [12, "قال انطلقت أنا وفرقد"],
  [14, "قال خرجت وأنا أريد"],
  [17, "قال قام فينا رسول الله"],
  [19, "أنه قال أخبرني رسول الله"],
  [21, "قال صلى بنا رسول الله"],
  [22, "قال قال جندب جئت يوم الجرعة"],
  [26, "قال اطلع النبي صلى الله عليه وسلم علينا"],
  [27, "قال كان النبي صلى الله عليه وسلم في غرفة"],
  [30, "يقول سمعت رسول الله صلى الله عليه وسلم يشير"],
  [31, "سمعت رسول الله صلى الله عليه وسلم يقول"],
  [32, "قالت سمعت رسول الله صلى الله عليه وسلم يقول"],
  [34, "قال قال رسول الله صلى الله عليه وسلم"],
  [37, "قال قال رسول الله صلى الله عليه وسلم"],
  [40, "عن النبي صلى الله عليه وسلم قال"],
  [42, "أن النبي صلى الله عليه وسلم قال"],
  [46, "قال كنا مع رسول الله صلى الله عليه وسلم"],
  [47, "قال كنا نمشي مع النبي صلى الله عليه وسلم"],
  [48, "قال لقيه رسول الله صلى الله عليه وسلم"],
  [50, "قال صحبت ابن صائد إلى مكة"],
  [51, "قال قال لي ابن صائد"],
  [52, "قال خرجنا حجاجا أو عمارا"],
  [53, "قال قال رسول الله صلى الله عليه وسلم لابن صائد"],
  [54, "قال رأيت جابر بن عبد الله يحلف بالله"],
  [55, "أن عمر بن الخطاب انطلق مع رسول الله صلى الله عليه وسلم"],
  [58, "قال قال رسول الله صلى الله عليه وسلم"],
  [59, "قال ذكر رسول الله صلى الله عليه وسلم الدجال ذات غداة"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-145.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-145.json");
