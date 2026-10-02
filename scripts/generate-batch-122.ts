import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-122.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "prophet_words",
  "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words",
  "reference_only", "dialogue", "prophet_words", "prophet_words", "prophet_words", "reference_only", "companion_words", "companion_words", "companion_words", "dialogue",
  "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "companion_words", "companion_words", "dialogue",
  "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "companion_words", "companion_words", "reference_only",
  "prophet_words", "narration", "reference_only", "narration", "reference_only", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [5, "بعث جيشا"], [7, "عن النبي صلى الله عليه وسلم قال"], [9, "قال قال رسول الله صلى الله عليه وسلم"], [13, "يقول كان الناس يسألون رسول الله"], [14, "قال حذيفة بن اليمان قلت يا رسول الله"],
  [19, "سمعت رسول الله"], [21, "أن رسول الله صلى الله عليه وسلم قال"], [22, "عن النبي صلى الله عليه وسلم أنه قال"], [23, "عن رسول الله صلى الله عليه وسلم قال"], [24, "سمعت رسول الله صلى الله عليه وسلم يقول"],
  [26, "قال كنا يوم الحديبية"], [27, "قال لم نبايع رسول الله"], [28, "قال كنا أربع عشرة مائة"], [29, "يسأل هل بايع النبي صلى الله عليه وسلم"], [30, "قال سألت جابر بن عبد الله"],
  [31, "قال لو كنا مائة ألف"], [32, "قال قلت لجابر كم كنتم"], [33, "قال كان أصحاب الشجرة"], [35, "قال لقد رأيتني يوم الشجرة"], [37, "قال كان أبي ممن بايع رسول الله"],
  [38, "قال لقد رأيت الشجرة"], [39, "قلت لسلمة"], [41, "قال أتاه آت فقال"], [42, "أنه دخل على الحجاج"], [43, "قال جئت بأخي أبي معبد"],
  [45, "سأل رسول الله"], [47, "قالت كانت المؤمنات إذا هاجرن"], [48, "قال عرضني رسول الله"], [50, "قال نهى رسول الله"], [51, "عن رسول الله صلى الله عليه وسلم أنه كان ينهى"],
  [53, "أن رسول الله صلى الله عليه وسلم سابق بالخيل"], [57, "قال رسول الله صلى الله عليه وسلم"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 1, 2, 3, 4, 6, 8, 10, 11, 12, 15, 16, 17, 18, 20, 25, 34, 36, 40, 44, 46, 49, 52, 54, 55, 56, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-122.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-122.json");
