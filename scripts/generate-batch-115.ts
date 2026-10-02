import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-115.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "reference_only", "prophet_words", "reference_only", "dialogue", "dialogue", "narration", "narration", "narration", "reference_only",
  "reference_only", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue",
  "dialogue", "reference_only", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words", "dialogue", "reference_only",
  "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only",
  "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "prophet_words", "companion_words", "prophet_words",
  "reference_only", "reference_only", "reference_only", "companion_words", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }

const starts: Array<[number, string]> = [
  [2, "وهو يقول سمعت رسول الله صلى الله عليه وسلم يقول"],
  [4, "قال كان لرجل على رسول الله صلى الله عليه وسلم حق"],
  [5, "قال جاء عبد فبايع النبي صلى الله عليه وسلم"],
  [6, "قالت اشترى رسول الله صلى الله عليه وسلم"],
  [7, "قالت اشترى رسول الله صلى الله عليه وسلم"],
  [8, "أن رسول الله صلى الله عليه وسلم اشترى"],
  [13, "قال قضى رسول الله صلى الله عليه وسلم بالشفعة"],
  [17, "قال مرضت فأتاني رسول الله صلى الله عليه وسلم"],
  [18, "قال عادني النبي صلى الله عليه وسلم"],
  [19, "يقول عادني رسول الله صلى الله عليه وسلم"],
  [20, "يقول دخل على رسول الله صلى الله عليه وسلم"],
  [23, "قال آخر آية أنزلت من القرآن"],
  [24, "يقول آخر آية أنزلت آية الكلالة"],
  [25, "آخر، سورة أنزلت تامة"],
  [27, "قال آخر آية أنزلت يستفتونك"],
  [28, "أن رسول الله صلى الله عليه وسلم كان يؤتى"],
  [37, "إن أباه أتى به رسول الله صلى الله عليه وسلم"],
  [38, "قال أتى بي أبي إلى رسول الله صلى الله عليه وسلم"],
  [40, "قال وقد أعطاه أبوه غلاما"],
  [41, "قال تصدق على أبي ببعض ماله"],
  [42, "أمه بنت رواحة"],
  [43, "أن رسول الله صلى الله عليه وسلم قال"],
  [44, "قال انطلق بي أبي يحملني إلى رسول الله صلى الله عليه وسلم"],
  [45, "قال نحلني أبي نحلا"],
  [46, "قالت امرأة بشير انحل ابني"],
  [47, "أنه قال سمعت رسول الله صلى الله عليه وسلم يقول"],
  [48, "قال إنما العمرى التي أجاز رسول الله"],
  [49, "أن رسول الله صلى الله عليه وسلم قضى"],
  [53, "قال أعمرت امرأة بالمدينة"],
  [59, "قال عادني رسول الله صلى الله عليه وسلم"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 1, 3, 9, 10, 11, 12, 14, 15, 16, 21, 22, 26, 29, 30, 31, 32, 33, 34, 35, 36, 39, 50, 51, 52, 54, 55, 56, 57, 58]) { marks[i].start = null; marks[i].kind = "reference_only"; }

fs.writeFileSync("data/hadith-split/marks-115.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-115.json");
