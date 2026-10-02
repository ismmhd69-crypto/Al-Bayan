import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-123.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "narration", "reference_only", "reference_only", "reference_only", "prophet_words", "prophet_words", "dialogue", "reference_only", "dialogue",
  "reference_only", "reference_only", "reference_only", "prophet_words", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only",
  "reference_only", "reference_only", "dialogue", "reference_only", "prophet_words", "prophet_words", "reference_only", "dialogue", "reference_only", "reference_only",
  "dialogue", "reference_only", "dialogue", "companion_words", "companion_words", "dialogue", "companion_words", "dialogue", "reference_only", "reference_only",
  "prophet_words", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "prophet_words", "dialogue", "reference_only", "reference_only",
  "reference_only", "reference_only", "prophet_words", "reference_only", "narration", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [1, "قال كان رسول الله صلى الله عليه وسلم يكره الشكال"], [5, "هذا ما حدثنا أبو هريرة"], [6, "قال سمعت رسول الله صلى الله عليه وسلم يقول"], [7, "قيل للنبي صلى الله عليه وسلم ما يعدل الجهاد"], [9, "قال كنت عند منبر رسول الله صلى الله عليه وسلم"],
  [13, "أن رسول الله صلى الله عليه وسلم قال"], [14, "عن رسول الله صلى الله عليه وسلم أنه قام فيهم"], [15, "قال جاء رجل إلى رسول الله صلى الله عليه وسلم"], [16, "عن النبي صلى الله عليه وسلم"], [17, "أتى النبي صلى الله عليه وسلم فقال"],
  [18, "قال رجل"], [22, "أن رسول الله صلى الله عليه وسلم قال"], [24, "هذا ما حدثنا أبو هريرة"], [25, "قال قال رسول الله صلى الله عليه وسلم"], [27, "قال جاء رجل إلى النبي صلى الله عليه وسلم"],
  [30, "أن رسول الله صلى الله عليه وسلم بعث إلى بني لحيان"], [32, "فقال فخذ من حسناته ما شئت"], [33, "يقول في هذه الآية لا يستوي القاعدون"], [34, "قال لما نزلت"], [35, "قال بعث رسول الله صلى الله عليه وسلم بُسيسة"],
  [36, "قال قال أنس عمي"], [37, "قال أتينا رسول الله صلى الله عليه وسلم"], [40, "أن النبي صلى الله عليه وسلم قال"], [42, "أن رسول الله صلى الله عليه وسلم كان يدخل على أم حرام"], [43, "قالت أتانا النبي صلى الله عليه وسلم يوما"],
  [46, "أن رسول الله صلى الله عليه وسلم قال"], [47, "قال قال رسول الله صلى الله عليه وسلم"], [52, "قال قال رسول الله صلى الله عليه وسلم"], [54, "أن رسول الله صلى الله عليه وسلم كان لا يطرق أهله"], [56, "قال قلت يا رسول الله إني أرسل الكلاب"],
  [57, "قال سألت رسول الله صلى الله عليه وسلم عن المعراض"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 2, 3, 4, 8, 10, 11, 12, 19, 20, 21, 23, 26, 28, 29, 31, 38, 39, 41, 44, 45, 48, 49, 50, 51, 53, 55, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-123.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-123.json");
