import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-129.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "dialogue", "companion_words", "companion_words", "companion_words",
  "reference_only", "narration", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only",
  "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words", "reference_only",
  "reference_only", "reference_only", "reference_only", "narration", "narration", "narration", "narration", "narration", "reference_only", "companion_words",
  "narration", "reference_only", "companion_words", "reference_only", "prophet_words", "prophet_words", "narration", "reference_only", "prophet_words", "reference_only",
  "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text); const p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "يقول نهاني النبي صلى الله عليه وسلم"], [1, "قال نهاني رسول الله صلى الله عليه وسلم"], [2, "قال نهاني - يعني النبي صلى الله عليه وسلم"], [4, "قال نهى أو نهاني يعني النبي صلى الله عليه وسلم"], [5, "قال قال علي نهاني رسول الله صلى الله عليه وسلم"],
  [6, "قلنا لأنس بن مالك أى"], [7, "قال كان أحب الثياب إلى رسول الله صلى الله عليه وسلم"], [8, "قال دخلت على عائشة"], [9, "أخرجت إلينا عائشة"], [11, "قالت خرج النبي صلى الله عليه وسلم ذات غداة"],
  [12, "قالت كان وسادة رسول الله صلى الله عليه وسلم"], [13, "قالت إنما كان فراش رسول الله صلى الله عليه وسلم"], [15, "قال قال لي رسول الله صلى الله عليه وسلم"], [16, "قال لما تزوجت قال لي رسول الله صلى الله عليه وسلم"], [22, "قال مررت على رسول الله صلى الله عليه وسلم"],
  [25, "بينما رجل يتبختر في بردين"], [26, "عن النبي صلى الله عليه وسلم أنه نهى عن خاتم الذهب"], [28, "أن رسول الله صلى الله عليه وسلم اصطنع خاتما من ذهب"], [33, "قال لما أراد رسول الله صلى الله عليه وسلم أن يكتب"], [34, "أن نبي الله صلى الله عليه وسلم كان أراد أن يكتب"],
  [35, "أن النبي صلى الله عليه وسلم أراد أن يكتب إلى كسرى"], [36, "أنه أبصر في يد رسول الله صلى الله عليه وسلم خاتما"], [37, "أنه، رأى في يد رسول الله صلى الله عليه وسلم خاتما"], [39, "قال كان خاتم رسول الله صلى الله عليه وسلم من ورق"], [40, "أن رسول الله صلى الله عليه وسلم لبس خاتم فضة"],
  [42, "قال كان خاتم النبي صلى الله عليه وسلم في هذه"], [44, "أن رسول الله صلى الله عليه وسلم نهى أن يأكل الرجل بشماله"], [45, "أن رسول الله صلى الله عليه وسلم نهى عن اشتمال الصماء"], [46, "أنه رأى رسول الله صلى الله عليه وسلم مستلقيا في المسجد"], [48, "أن النبي صلى الله عليه وسلم نهى عن التزعفر"],
  [50, "أنها قالت واعد رسول الله صلى الله عليه وسلم جبريل"], [52, "أن رسول الله صلى الله عليه وسلم أصبح يوما واجما"], [54, "قال سمعت رسول الله صلى الله عليه وسلم يقول"], [55, "قالت قدم رسول الله صلى الله عليه وسلم من سفر"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-129.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-129.json");
