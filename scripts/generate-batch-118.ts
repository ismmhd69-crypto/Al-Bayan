import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-118.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "narration", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "companion_words", "reference_only", "dialogue",
  "companion_words", "reference_only", "reference_only", "dialogue", "reference_only", "prophet_words", "reference_only", "reference_only", "dialogue", "dialogue",
  "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "narration", "narration", "dialogue", "reference_only", "narration",
  "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "narration", "narration", "narration", "reference_only", "narration",
  "companion_words", "companion_words", "reference_only", "reference_only", "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "reference_only",
  "reference_only", "narration", "narration", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "أن رسول الله صلى الله عليه وسلم قطع سارقا في مجن"], [3, "أهمهم شأن المرأة المخزومية التي سرقت"], [4, "أن قريشا أهمهم شأن المرأة التي سرقت في عهد النبي"], [5, "قالت كانت امرأة مخزومية تستعير المتاع"],
  [7, "قال عمر بن الخطاب وهو جالس على منبر رسول الله"], [9, "أنه قال أتى رجل من المسلمين رسول الله صلى الله عليه وسلم"], [13, "قال رأيت ماعز بن مالك حين جيء به إلى النبي"],
  [15, "أن النبي صلى الله عليه وسلم قال لماعز بن مالك"], [18, "قال جاء ماعز بن مالك إلى النبي صلى الله عليه وسلم"], [19, "أتى رسول الله صلى الله عليه وسلم فقال"], [20, "من جهينة أتت نبي الله صلى الله عليه وسلم"],
  [22, "من الأعراب أتى رسول الله صلى الله عليه وسلم"], [24, "أخبره أن رسول الله صلى الله عليه وسلم أتي بيهودي"], [25, "أن رسول الله صلى الله عليه وسلم رجم في الزنى يهوديين"], [26, "جاءوا إلى رسول الله صلى الله عليه وسلم برجل"],
  [27, "قال مر على النبي صلى الله عليه وسلم بيهودي"], [29, "يقول رجم النبي صلى الله عليه وسلم رجلا"], [31, "قال سألت عبد الله بن أبي أوفى هل رجم رسول الله"], [35, "أن النبي صلى الله عليه وسلم أتي برجل قد شرب الخمر"],
  [36, "يقول أتي رسول الله صلى الله عليه وسلم برجل"], [37, "أن نبي الله صلى الله عليه وسلم جلد في الخمر"], [39, "كان يضرب في الخمر بالنعال"], [40, "قال شهدت عثمان بن عفان وأتي بالوليد"],
  [41, "قال ما كنت أقيم على أحد حدا فيموت فيه"], [44, "أنه قال إني لمن النقباء الذين بايعوا رسول الله"], [45, "قال بايعنا رسول الله صلى الله عليه وسلم"], [47, "بايعنا رسول الله صلى الله عليه وسلم بمثل"],
  [51, "أن رسول الله صلى الله عليه وسلم قضى باليمين"], [52, "أن رسول الله صلى الله عليه وسلم قضى بيمين"], [56, "قالت جاءت هند إلى النبي صلى الله عليه وسلم"], [57, "قالت جاءت هند بنت عتبة"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [1, 2, 6, 8, 10, 11, 12, 14, 16, 17, 21, 23, 28, 30, 32, 33, 34, 38, 42, 43, 46, 48, 49, 50, 53, 54, 55, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-118.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-118.json");
