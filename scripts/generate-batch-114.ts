import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-114.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "prophet_words", "prophet_words", "prophet_words", "reference_only", "reference_only", "reference_only", "dialogue", "prophet_words", "prophet_words",
  "narration", "dialogue", "reference_only", "prophet_words", "prophet_words", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only",
  "narration", "narration", "dialogue", "dialogue", "reference_only", "narration", "narration", "prophet_words", "reference_only", "reference_only",
  "reference_only", "prophet_words", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only",
  "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "dialogue", "prophet_words",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "أن النبي صلى الله عليه وسلم نهى عن بيع ثمر النخل"],
  [1, "أن رسول الله صلى الله عليه وسلم نهى عن بيع الثمرة"],
  [2, "فقال رسول الله صلى الله عليه وسلم"],
  [4, "أنه تقاضى ابن أبي حدرد دينا"],
  [11, "قال نهى رسول الله صلى الله عليه وسلم عن بيع فضل الماء"],
  [12, "يقول نهى رسول الله صلى الله عليه وسلم عن بيع ضراب"],
  [13, "أن رسول الله صلى الله عليه وسلم نهى عن ثمن الكلب"],
  [17, "قال سألت جابرا عن ثمن الكلب"],
  [18, "أن رسول الله صلى الله عليه وسلم أمر بقتل الكلاب"],
  [19, "قال أمر رسول الله صلى الله عليه وسلم بقتل الكلاب"],
  [20, "قال كان رسول الله صلى الله عليه وسلم يأمر"],
  [21, "أن رسول الله صلى الله عليه وسلم أمر بقتل الكلاب"],
  [23, "أن رسول الله صلى الله عليه وسلم قال"],
  [24, "عن رسول الله صلى الله عليه وسلم قال"],
  [25, "عن رسول الله صلى الله عليه وسلم قال"],
  [30, "دعا النبي صلى الله عليه وسلم غلاما لنا"],
  [31, "احتجم رسول الله صلى الله عليه وسلم"],
  [32, "قال سمعت رسول الله صلى الله عليه وسلم يخطب"],
  [33, "أنه سأل عبد الله بن عباس عما يعصر"],
  [35, "قالت لما نزلت الآيات"],
  [36, "قالت لما أنزلت الآيات"],
  [37, "أنه سمع رسول الله صلى الله عليه وسلم يقول"],
  [41, "قال رسول الله صلى الله عليه وسلم"],
  [43, "قال كنت بالشام في حلقة"],
  [47, "يقول سألت البراء بن عازب عن الصرف"],
  [48, "قال نهى رسول الله صلى الله عليه وسلم عن الفضة"],
  [51, "أن رسول الله صلى الله عليه وسلم بعث أخا بني عدي"],
  [52, "أن رسول الله صلى الله عليه وسلم استعمل رجلا على خيبر"],
  [53, "جاء بلال بتمر"],
  [54, "أتي رسول الله صلى الله عليه وسلم بتمر"],
  [55, "قال سألت ابن عباس عن الصرف"],
  [56, "قال سألت ابن عمر وابن عباس عن الصرف"],
  [57, "يقول الدينار بالدينار"],
  [58, "قال لعن رسول الله صلى الله عليه وسلم"],
  [59, "قال لعن رسول الله صلى الله عليه وسلم"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [3, 5, 6, 7, 8, 9, 10, 14, 15, 16, 22, 26, 27, 28, 29, 34, 38, 39, 40, 42, 44, 45, 46, 49, 50]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(53, "لم يذكر ابن سهل");

fs.writeFileSync("data/hadith-split/marks-114.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-114.json");
