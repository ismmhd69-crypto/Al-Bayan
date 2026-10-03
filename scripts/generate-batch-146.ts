import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-146.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only",
  "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "companion_words", "dialogue", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only",
  "dialogue", "companion_words", "reference_only", "companion_words", "reference_only", "companion_words", "dialogue", "dialogue", "companion_words", "companion_words",
  "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "dialogue", "companion_words", "companion_words", "companion_words",
  "dialogue", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words", "narration", "reference_only", "reference_only",
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
  [2, "قال قال رسول الله"],
  [3, "قال ما سأل أحد النبي"],
  [4, "قال ما سأل أحد النبي"],
  [6, "يقول سمعت عبد الله بن عمرو"],
  [8, "قال جلس إلى مروان"],
  [10, "أنه سأل فاطمة بنت قيس"],
  [11, "قال دخلنا على فاطمة بنت قيس"],
  [21, "وقال رسول الله صلى الله عليه وسلم"],
  [22, "أن رسول الله صلى الله عليه وسلم مر بالسوق"],
  [26, "رسول الله صلى الله عليه وسلم بعث أبا عبيدة"],
  [27, "عن رسول الله صلى الله عليه وسلم أنه قال"],
  [30, "سمع النبي صلى الله عليه وسلم يقول"],
  [31, "يقول والله إني لأول رجل من العرب"],
  [33, "قال خطبنا عتبة بن غزوان"],
  [35, "يقول لقد رأيتني سابع سبعة"],
  [36, "قالوا يا رسول الله هل نرى ربنا"],
  [37, "قال كنا عند رسول الله"],
  [38, "قالت ما شبع آل محمد"],
  [39, "قالت ما شبع رسول الله"],
  [40, "أنها قالت ما شبع آل محمد"],
  [41, "قالت ما شبع آل محمد"],
  [42, "قالت عائشة ما شبع آل محمد"],
  [43, "قالت ما شبع آل محمد"],
  [44, "قالت إن كنا آل محمد"],
  [46, "والله يا ابن أختي"],
  [47, "قالت توفي رسول الله"],
  [48, "قالت لقد مات رسول الله"],
  [49, "قالت توفي رسول الله"],
  [50, "قالت توفي رسول الله"],
  [52, "قال والذي نفسي بيده"],
  [53, "قال رأيت أبا هريرة يشير بإصبعه"],
  [54, "يقول ألستم في طعام وشراب ما شئتم"],
  [56, "يخطب قال ذكر عمر"],
  [57, "أن الناس نزلوا مع رسول الله"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-146.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-146.json");
