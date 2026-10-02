import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-121.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "prophet_words", "dialogue", "companion_words", "dialogue", "reference_only", "narration", "reference_only", "prophet_words", "companion_words", "dialogue",
  "reference_only", "dialogue", "companion_words", "narration", "dialogue", "companion_words", "reference_only", "companion_words", "reference_only", "companion_words",
  "reference_only", "companion_words", "reference_only", "companion_words", "narration", "companion_words", "companion_words", "reference_only", "companion_words", "dialogue",
  "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "prophet_words", "companion_words", "prophet_words", "companion_words", "dialogue",
  "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only", "narration", "reference_only", "dialogue", "dialogue", "narration",
  "dialogue", "reference_only", "reference_only", "narration", "prophet_words", "reference_only", "reference_only", "reference_only", "companion_words", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "قال رسول الله صلى الله عليه وسلم"], [1, "قال خرجنا مع رسول الله صلى الله عليه وسلم إلى خيبر"], [2, "قال لما كان يوم خيبر قاتل أخي"], [3, "قال خرجنا مع رسول الله صلى الله عليه وسلم إلى خيبر"], [5, "قال كان رسول الله صلى الله عليه وسلم يوم الأحزاب ينقل معنا التراب"],
  [7, "أن رسول الله صلى الله عليه وسلم كان يقول"], [8, "قال كانوا يرتجزون ورسول الله صلى الله عليه وسلم معهم"], [9, "قدمنا الحديبية مع رسول الله صلى الله عليه وسلم"], [11, "أن ثمانين"], [12, "أن أم سليم"],
  [13, "قال كان رسول الله صلى الله عليه وسلم يغزو بأم سليم"], [14, "قال لما كان يوم أحد انهزم ناس من الناس عن النبي"], [15, "أن نجدة"], [17, "قال كتب نجدة"], [19, "قال كتب نجدة"],
  [21, "قالت غزوت مع رسول الله صلى الله عليه وسلم سبع غزوات"], [23, "يقول غزوت مع رسول الله صلى الله عليه وسلم تسع عشرة غزوة"], [24, "قال غزا رسول الله صلى الله عليه وسلم تسع عشرة غزوة"], [25, "أنه قال غزا مع رسول الله صلى الله عليه وسلم ست عشرة غزوة"], [26, "يقول غزوت مع رسول الله صلى الله عليه وسلم سبع غزوات"],
  [28, "قال خرجنا مع رسول الله صلى الله عليه وسلم في غزاة"], [29, "أنها قالت خرج رسول الله صلى الله عليه وسلم قبل بدر"], [30, "قال سمعت النبي صلى الله عليه وسلم يقول"], [31, "قال سمعت النبي صلى الله عليه وسلم يقول"], [33, "يقول سمعت رسول الله صلى الله عليه وسلم يقول"],
  [34, "قال النبي صلى الله عليه وسلم"], [35, "قال انطلقت إلى رسول الله صلى الله عليه وسلم ومعي أبي"], [36, "قال كتبت إلى جابر بن سمرة"], [37, "فقال سمعت رسول الله صلى الله عليه وسلم يقول"], [38, "قال حضرت أبي حين أصيب"],
  [39, "قال دخلت على حفصة فقالت"], [42, "قال قال رسول الله صلى الله عليه وسلم"], [45, "قال ذكر رسول الله صلى الله عليه وسلم الغلول فعظمه"], [47, "قال استعمل رسول الله صلى الله عليه وسلم رجلا"], [48, "قال استعمل رسول الله صلى الله عليه وسلم رجلا"],
  [49, "أن رسول الله صلى الله عليه وسلم استعمل رجلا"], [50, "قال سمعت رسول الله صلى الله عليه وسلم يقول"], [53, "نزل"], [54, "عن النبي صلى الله عليه وسلم قال"], [58, "قال إن خليلي أوصاني"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [4, 6, 10, 16, 18, 20, 22, 27, 32, 40, 41, 43, 44, 46, 51, 52, 55, 56, 57, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-121.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-121.json");
