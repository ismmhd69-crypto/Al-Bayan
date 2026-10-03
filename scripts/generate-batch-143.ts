import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-143.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "reference_only", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "companion_words",
  "reference_only", "reference_only", "companion_words", "reference_only", "dialogue", "narration", "narration", "reference_only", "dialogue", "reference_only",
  "companion_words", "reference_only", "companion_words", "dialogue", "dialogue", "dialogue", "companion_words", "reference_only", "dialogue", "reference_only",
  "dialogue", "reference_only", "prophet_words", "dialogue", "dialogue", "narration", "narration", "dialogue", "reference_only", "companion_words",
  "companion_words", "reference_only", "companion_words", "reference_only", "narration", "companion_words", "companion_words", "prophet_words", "reference_only", "reference_only",
  "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue",
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
  [2, "أتى النبي صلى الله عليه وسلم"],
  [3, "قال أصاب رجل من امرأة"],
  [5, "قال جاء رجل إلى النبي"],
  [6, "قال بينما رسول الله"],
  [9, "قال ثم غزا رسول الله"],
  [12, "قالت كان رسول الله صلى الله عليه وسلم إذا أراد"],
  [14, "يقول خرجنا مع رسول الله"],
  [15, "يقول أتى النبي صلى الله عليه وسلم"],
  [16, "يقول جاء النبي صلى الله عليه وسلم"],
  [18, "قال اجتمع عند البيت"],
  [20, "أن النبي صلى الله عليه وسلم خرج إلى أحد"],
  [22, "من المنافقين في عهد رسول الله"],
  [23, "أن مروان قال"],
  [24, "قال قلنا لعمار"],
  [25, "قال قال رسول الله"],
  [26, "قال كان منا رجل"],
  [28, "قال جاء حبر إلى النبي"],
  [30, "يقول قال عبد الله جاء رجل"],
  [32, "أخذ رسول الله صلى الله عليه وسلم بيدي فقال"],
  [33, "عن رسول الله صلى الله عليه وسلم قال"],
  [34, "قال بينما أنا أمشي"],
  [35, "قال كنت أمشي مع النبي"],
  [36, "قال كان النبي صلى الله عليه وسلم في نخل"],
  [37, "قال كان لي على العاص بن وائل دين"],
  [39, "يقول قال أبو جهل"],
  [40, "قال خمس قد مضين"],
  [42, "بن كعب في قوله عز وجل"],
  [44, "مكة سألوا رسول الله صلى الله عليه وسلم"],
  [45, "قال انشق القمر"],
  [46, "قال إن القمر انشق"],
  [47, "قال قال رسول الله"],
  [53, "يقول قال رسول الله"],
  [54, "قال رسول الله صلى الله عليه وسلم يوما"],
  [55, "قال كنا عند النبي"],
  [56, "أتي رسول الله صلى الله عليه وسلم بجمار"],
  [58, "قال قال رسول الله"],
  [59, "قال قال رسول الله"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-143.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-143.json");
