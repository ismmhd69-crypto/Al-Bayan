import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-106.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "reference_only", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "narration", "narration", "companion_words",
  "dialogue", "narration", "narration", "narration", "narration", "narration", "narration", "companion_words", "companion_words", "reference_only",
  "dialogue", "companion_words", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only",
  "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "narration", "reference_only", "reference_only", "narration",
  "narration", "companion_words", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue",
  "narration", "narration", "narration", "narration", "reference_only", "companion_words", "reference_only", "companion_words", "dialogue", "reference_only"
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); const start = map[p]; return text.slice(start, start + Math.min(100, text.length - start)); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original as string, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "من وراء الحجاب"],
  [2, "رأى رجلا يسوق بدنة"],
  [4, "رجل يسوق بدنة مقلدة"],
  [5, "قال مر رسول الله صلى الله عليه وسلم برجل"],
  [6, "مر على النبي صلى الله عليه وسلم ببدنة"],
  [7, "يقول مر على النبي صلى الله عليه وسلم ببدنة"],
  [8, "بعث بثمان عشرة بدنة مع رجل"],
  [9, "أمر الناس أن يكون، آخر عهدهم بالبيت"],
  [10, "كنت مع ابن عباس إذ قال زيد بن ثابت تفتي"],
  [11, "دخل الكعبة هو وأسامة وبلال"],
  [12, "نزل بفناء الكعبة"],
  [13, "دخل رسول الله صلى الله عليه وسلم البيت"],
  [14, "أنه انتهى إلى الكعبة وقد دخلها النبي"],
  [15, "دخل رسول الله صلى الله عليه وسلم البيت هو"],
  [16, "رأيت رسول الله صلى الله عليه وسلم دخل الكعبة"],
  [17, "النبي صلى الله عليه وسلم دخل الكعبة"],
  [18, "أدخل النبي صلى الله عليه وسلم البيت"],
  [20, "ألم ترى أن قومك حين بنوا الكعبة"],
  [21, "قال عبد الله بن عبيد وفد الحارث بن عبد الله"],
  [23, "سألت رسول الله صلى الله عليه وسلم عن الجدر"],
  [24, "سألت رسول الله صلى الله عليه وسلم عن الحجر"],
  [25, "لقي ركبا بالروحاء فقال"],
  [27, "خطبنا رسول الله صلى الله عليه وسلم فقال"],
  [32, "سمعت ابن عباس، يقول سمعت النبي صلى الله عليه وسلم يخطب يقول"],
  [35, "أن ابن عمر علمهم أن رسول الله صلى الله عليه وسلم كان إذا استوى على بعيره"],
  [36, "كان رسول الله صلى الله عليه وسلم إذا سافر"],
  [39, "أن رسول الله صلى الله عليه وسلم أتي في معرسه"],
  [40, "أن النبي صلى الله عليه وسلم أتي وهو في معرسه"],
  [41, "بعثني أبو بكر الصديق في الحجة التي أمره عليها رسول الله"],
  [45, "قال رسول الله صلى الله عليه وسلم يوم الفتح"],
  [48, "لما فتح الله عز وجل على رسول الله صلى الله عليه وسلم مكة"],
  [49, "إن خزاعة قتلوا رجلا من بني ليث عام فتح مكة"],
  [50, "أن رسول الله صلى الله عليه وسلم دخل مكة"],
  [51, "أن النبي صلى الله عليه وسلم دخل يوم فتح مكة"],
  [52, "أن رسول الله صلى الله عليه وسلم خطب الناس"],
  [53, "كأني أنظر إلى رسول الله صلى الله عليه وسلم على المنبر"],
  [55, "خطب الناس فذكر مكة"],
  [57, "ركب إلى قصره بالعقيق"],
  [58, "رسول الله صلى الله عليه وسلم لأبي طلحة"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [1, 3, 19, 22, 26, 28, 29, 30, 31, 33, 34, 37, 38, 42, 43, 44, 46, 47, 54, 56, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }

const tails: Array<[number, string]> = [
  [8, "ثم ذكر بمثل حديث عبد الوارث"],
  [29, "وفي حديث همام ما تركتم"],
  [50, "وفي رواية قتيبة قال حدثنا أبو الزبير"],
  [53, "ولم يقل أبو بكر على المنبر"],
  [55, "قال فسكت مروان ثم قال قد سمعت"],
];
for (const [i, needle] of tails) if (marks[i].start !== null) setTail(i, needle);

fs.writeFileSync("data/hadith-split/marks-106.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-106.json");
