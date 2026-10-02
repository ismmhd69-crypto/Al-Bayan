import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-107.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "narration", "narration", "dialogue", "dialogue", "dialogue", "prophet_words", "prophet_words", "prophet_words", "narration", "reference_only",
  "reference_only", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "narration", "dialogue", "reference_only",
  "reference_only", "reference_only", "prophet_words", "prophet_words", "narration", "narration", "narration", "narration", "reference_only", "narration",
  "narration", "companion_words", "narration", "reference_only", "dialogue", "prophet_words", "reference_only", "prophet_words", "prophet_words", "narration",
  "narration", "prophet_words", "reference_only", "dialogue", "prophet_words", "companion_words", "companion_words", "dialogue", "dialogue", "prophet_words",
  "narration", "narration", "reference_only", "prophet_words", "narration", "prophet_words", "prophet_words", "narration", "dialogue", "prophet_words",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "أن رسول الله صلى الله عليه وسلم غزا خيبر"],
  [1, "أنه أعتق صفية وجعل عتقها صداقها"],
  [2, "قال صارت صفية لدحية في مقسمه"],
  [3, "قال سألت أنسا أحرم رسول الله"],
  [4, "قال خطبنا علي بن أبي طالب"],
  [5, "فمن أخفر مسلما فعليه لعنة الله"],
  [6, "من تولى غير مواليه"],
  [7, "وذمة المسلمين واحدة يسعى بها أدناهم"],
  [8, "حرم رسول الله صلى الله عليه وسلم ما بين لابتى المدينة"],
  [11, "قال رسول الله صلى الله عليه وسلم"],
  [12, "قال رسول الله صلى الله عليه وسلم"],
  [13, "كما ينفي الكير الخبث"],
  [15, "قال رسول الله صلى الله عليه وسلم"],
  [16, "قال رسول الله صلى الله عليه وسلم"],
  [17, "قال خرجنا مع رسول الله صلى الله عليه وسلم"],
  [18, "قال خرجنا مع رسول الله صلى الله عليه وسلم"],
  [23, "تشَد الرحال إلى ثلاثة مساجد"],
  [24, "عن النبي صلى الله عليه وسلم بمثله"],
  [25, "أن رسول الله صلى الله عليه وسلم كان يزور قباء"],
  [26, "قال كان رسول الله صلى الله عليه وسلم يأتي مسجد قباء"],
  [27, "أن رسول الله صلى الله عليه وسلم كان يأتي قباء"],
  [29, "أن رسول الله صلى الله عليه وسلم كان يأتي قباء"],
  [30, "كان رسول الله صلى الله عليه وسلم يأتي قباء"],
  [31, "كان يأتي قباء كل سبت"],
  [32, "أن رسول الله صلى الله عليه وسلم كان يأتي قباء"],
  [34, "قال إني لأمشي مع عبد الله بن مسعود"],
  [35, "قال رسول الله صلى الله عليه وسلم"],
  [37, "قال رد رسول الله صلى الله عليه وسلم"],
  [38, "رد على عثمان بن مظعون"],
  [39, "أراد عثمان بن مظعون أن يتبتل"],
  [40, "أن النبي صلى الله عليه وسلم رأى امرأة"],
  [41, "كنا نغزو مع رسول الله صلى الله عليه وسلم"],
  [43, "قال كنا ونحن شباب فقلنا يا رسول الله"],
  [44, "قالا خرج علينا منادي رسول الله صلى الله عليه وسلم"],
  [45, "أن رسول الله صلى الله عليه وسلم أتانا"],
  [46, "فقال نعم استمتعنا على عهد رسول الله"],
  [47, "كنا نستمتع بالقبضة من التمر والدقيق"],
  [48, "فقال جابر فعلناهما مع رسول الله صلى الله عليه وسلم"],
  [49, "رخص رسول الله صلى الله عليه وسلم عام أوطاس"],
  [50, "غزا مع رسول الله صلى الله عليه وسلم فتح مكة"],
  [51, "قال خرجنا مع رسول الله صلى الله عليه وسلم عام الفتح"],
  [52, "قال رأيت رسول الله صلى الله عليه وسلم قائما"],
  [53, "قال أمرنا رسول الله صلى الله عليه وسلم بالمتعة"],
  [54, "أن نبي الله صلى الله عليه وسلم عام فتح مكة"],
  [55, "أن النبي صلى الله عليه وسلم نهى عن نكاح المتعة"],
  [56, "أن رسول الله صلى الله عليه وسلم نهى يوم الفتح"],
  [57, "أنه أخبره أن رسول الله صلى الله عليه وسلم نهى عن المتعة"],
  [58, "قام بمكة فقال"],
  [59, "أن رسول الله صلى الله عليه وسلم نهى عن متعة النساء"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [9, 10, 11, 14, 19, 20, 21, 22, 28, 33, 36, 42, 52]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(4, "وانتهى حديث أبي بكر وزهير");
setTail(13, "لم يذكرا الحديد");
setTail(34, "فذكر بمثل حديث أبي معاوية");
setTail(40, "ولم يذكر تدبر في صورة شيطان");
setTail(51, "فذكر بمثل حديث بشر");

fs.writeFileSync("data/hadith-split/marks-107.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-107.json");
