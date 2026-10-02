import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-113.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words",
  "companion_words", "reference_only", "reference_only", "prophet_words", "dialogue", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words",
  "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "prophet_words", "prophet_words", "companion_words",
  "reference_only", "companion_words", "dialogue", "reference_only", "narration", "reference_only", "narration", "reference_only", "dialogue", "dialogue",
  "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only",
  "narration", "companion_words", "narration", "narration", "dialogue", "dialogue", "reference_only", "prophet_words", "reference_only", "prophet_words",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "فقال نهى رسول الله صلى الله عليه وسلم عن بيع النخل"],
  [1, "أن رسول الله صلى الله عليه وسلم رخص في بيع العرايا"],
  [2, "أن رسول الله صلى الله عليه وسلم رخص لصاحب"],
  [3, "أن رسول الله صلى الله عليه وسلم رخص في العرية"],
  [5, "والعرية النخلة تجعل للقوم"],
  [6, "أن رسول الله صلى الله عليه وسلم رخص في بيع العرية"],
  [7, "أن رسول الله صلى الله عليه وسلم رخص في العرايا"],
  [9, "أن رسول الله صلى الله عليه وسلم رخص في بيع العرايا"],
  [10, "أنهم قالوا رخص رسول الله صلى الله عليه وسلم"],
  [13, "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة"],
  [14, "أن رسول الله صلى الله عليه وسلم رخص في بيع العرايا"],
  [15, "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة"],
  [16, "أن النبي صلى الله عليه وسلم نهى عن المزابنة"],
  [18, "قال نهى رسول الله صلى الله عليه وسلم عن المزابنة"],
  [19, "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة"],
  [21, "قال نهى رسول الله صلى الله عليه وسلم عن المزابنة"],
  [23, "أن رسول الله صلى الله عليه وسلم قال"],
  [27, "قال نهى رسول الله صلى الله عليه وسلم عن المحاقلة"],
  [28, "نهى رسول الله صلى الله عليه وسلم عن المزابنة"],
  [29, "كنا لا نرى بالخبر بأسا"],
  [31, "قال قال ابن عمر لقد منعنا"],
  [32, "كان يكري مزارعه على عهد رسول الله"],
  [34, "قال ذهبت مع ابن عمر إلى رافع"],
  [36, "عن النبي صلى الله عليه وسلم أنه نهى عن كراء الأرض"],
  [38, "كان يكري أرضيه حتى بلغه"],
  [39, "فقال نهى رسول الله صلى الله عليه وسلم عن كراء الأرض"],
  [40, "قال سألت رافع بن خديج عن كراء الأرض"],
  [41, "يقول كنا أكثر الأنصار حقلا"],
  [43, "قال كنا نحاقل الأرض على عهد رسول الله"],
  [48, "قال سألت عبد الله بن معقل عن المزارعة"],
  [50, "أن رسول الله صلى الله عليه وسلم عامل أهل خيبر"],
  [51, "قال أعطى رسول الله صلى الله عليه وسلم خيبر"],
  [52, "أن رسول الله صلى الله عليه وسلم عامل أهل خيبر"],
  [53, "عن رسول الله صلى الله عليه وسلم أنه دفع إلى يهود خيبر"],
  [54, "أن النبي صلى الله عليه وسلم دخل على أم مبشر"],
  [55, "يقول دخل النبي صلى الله عليه وسلم على أم معبد"],
  [57, "إن بعت من أخيك ثمرا"],
  [59, "أمر بوضع الجوائح"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [4, 8, 11, 12, 17, 20, 22, 24, 25, 26, 30, 33, 35, 37, 42, 44, 45, 46, 47, 49, 56, 58]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(1, "زاد ابن نمير");
setTail(6, "قال يحيى العرية");
setTail(59, "قال أبو إسحاق");

fs.writeFileSync("data/hadith-split/marks-113.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-113.json");
