import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-112.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "companion_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "companion_words", "prophet_words", "prophet_words", "reference_only",
  "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "dialogue", "prophet_words", "reference_only", "companion_words", "companion_words",
  "prophet_words", "prophet_words", "reference_only", "companion_words", "companion_words", "companion_words", "prophet_words", "dialogue", "prophet_words", "reference_only",
  "reference_only", "reference_only", "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only",
  "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "dialogue", "prophet_words",
  "reference_only", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "reference_only", "narration", "prophet_words", "prophet_words", "dialogue",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [1, "أنه قال نهي عن بيعتين"],
  [2, "نهانا رسول الله صلى الله عليه وسلم عن بيعتين"],
  [4, "قال نهى رسول الله صلى الله عليه وسلم عن بيع الحصاة"],
  [5, "عن رسول الله صلى الله عليه وسلم أنه نهى"],
  [6, "قال كان أهل الجاهلية يتبايعون"],
  [7, "أن رسول الله صلى الله عليه وسلم نهى أن يستام"],
  [8, "أن رسول الله صلى الله عليه وسلم نهى عن التلقي"],
  [10, "أن رسول الله صلى الله عليه وسلم نهى عن النجش"],
  [11, "أن رسول الله صلى الله عليه وسلم نهى أن تتلقى السلع"],
  [13, "أنه نهى عن تلقي البيوع"],
  [14, "قال نهى رسول الله صلى الله عليه وسلم أن يتلقى"],
  [15, "قال نهى رسول الله صلى الله عليه وسلم أن تتلقى"],
  [16, "قال رسول الله صلى الله عليه وسلم"],
  [18, "نهينا أن يبيع"],
  [19, "قال قال أنس بن مالك نهينا"],
  [20, "من اشترى من الغنم فهو بالخيار"],
  [21, "أن رسول الله صلى الله عليه وسلم قال"],
  [23, "قال كنا في زمان رسول الله"],
  [24, "أنهم كانوا يضربون على عهد رسول الله"],
  [25, "قال قد رأيت الناس في عهد رسول الله"],
  [26, "أن رسول الله صلى الله عليه وسلم قال"],
  [27, "قال أبو هريرة أحللت بيع الصكاك"],
  [28, "نهى رسول الله صلى الله عليه وسلم عن بيع الصبرة"],
  [33, "أن رسول الله صلى الله عليه وسلم نهى"],
  [35, "قال رسول الله صلى الله عليه وسلم"],
  [40, "أن النبي صلى الله عليه وسلم نهى"],
  [41, "أن رسول الله صلى الله عليه وسلم نهى"],
  [42, "رسول الله صلى الله عليه وسلم عن بيع الثمر حتى يطيب"],
  [43, "نهى رسول الله صلى الله عليه وسلم عن بيع الثمر"],
  [44, "قال نهى رسول الله صلى الله عليه وسلم عن المحاقلة"],
  [46, "أن رسول الله صلى الله عليه وسلم نهى عن المخابرة"],
  [47, "أن رسول الله صلى الله عليه وسلم نهى عن المحاقلة"],
  [48, "قال نهى رسول الله صلى الله عليه وسلم عن المزابنة"],
  [49, "قال نهى رسول الله صلى الله عليه وسلم عن المحاقلة"],
  [51, "قال نهى رسول الله صلى الله عليه وسلم عن كراء الأرض"],
  [52, "أن رسول الله صلى الله عليه وسلم نهى عن كراء الأرض"],
  [53, "قال نهى رسول الله صلى الله عليه وسلم أن يؤخذ"],
  [54, "أن النبي صلى الله عليه وسلم نهى عن المخابرة"],
  [56, "أن رسول الله صلى الله عليه وسلم نهى عن كراء الأرض"],
  [57, "قال نهى رسول الله صلى الله عليه وسلم عن بيع الأرض"],
  [58, "قال نهى النبي صلى الله عليه وسلم عن بيع السنين"],
  [59, "سمع رسول الله صلى الله عليه وسلم ينهى"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 3, 9, 12, 17, 22, 29, 30, 31, 32, 34, 36, 37, 38, 39, 45, 50, 55]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(7, "وفي رواية الدورقي");
setTail(11, "وهذا لفظ ابن نمير");
setTail(16, "غير أن في رواية يحيى");
setTail(25, "قال ابن شهاب وحدثني");
setTail(26, "وفي رواية أبي بكر");
setTail(58, "وفي رواية ابن أبي شيبة");

fs.writeFileSync("data/hadith-split/marks-112.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-112.json");
