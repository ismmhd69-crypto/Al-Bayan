import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-109.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "companion_words", "companion_words", "reference_only", "reference_only", "prophet_words", "prophet_words", "dialogue", "dialogue", "reference_only",
  "dialogue", "reference_only", "dialogue", "dialogue", "reference_only", "companion_words", "companion_words", "companion_words", "dialogue", "reference_only",
  "prophet_words", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only",
  "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "companion_words",
  "companion_words", "reference_only", "dialogue", "dialogue", "companion_words", "dialogue", "reference_only", "narration", "narration", "reference_only",
  "companion_words", "reference_only", "dialogue", "reference_only", "reference_only", "narration", "reference_only", "reference_only", "companion_words", "companion_words",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [1, "كانت اليهود تقول"],
  [2, "كانت تقول إذا أتيت المرأة"],
  [5, "قال رسول الله صلى الله عليه وسلم"],
  [6, "فإن الله كتب من هو خالق"],
  [7, "سئل النبي صلى الله عليه وسلم عن العزل"],
  [8, "ذكر العزل عند النبي صلى الله عليه وسلم"],
  [10, "قلنا لأبي سعيد هل سمعت رسول الله"],
  [12, "أتى رسول الله صلى الله عليه وسلم فقال"],
  [13, "قال سأل رجل النبي صلى الله عليه وسلم"],
  [15, "قال كنا نعزل والقرآن ينزل"],
  [16, "يقول لقد كنا نعزل على عهد رسول الله"],
  [17, "قال كنا نعزل على عهد رسول الله"],
  [18, "أنه أتى بامرأة مجح"],
  [20, "قالت حضرت رسول الله صلى الله عليه وسلم"],
  [22, "جاء إلى رسول الله صلى الله عليه وسلم فقال"],
  [23, "أن رسول الله صلى الله عليه وسلم كان عندها"],
  [25, "جاء يستأذن عليها وهو عمها"],
  [26, "قالت أتاني عمي من الرضاعة"],
  [27, "جاء أفلح أخو أبي القعيس يستأذن عليها"],
  [28, "قالت جاء عمي من الرضاعة"],
  [31, "قال قلت يا رسول الله ما لك تنوق"],
  [34, "قالت دخل على رسول الله صلى الله عليه وسلم"],
  [36, "قالت لرسول الله صلى الله عليه وسلم يا رسول الله"],
  [39, "أنها قالت كان فيما أنزل من القرآن"],
  [40, "قالت عمرة فقالت عائشة نزل في القرآن"],
  [42, "قالت جاءت سهلة بنت سهيل إلى النبي"],
  [43, "تقول لعائشة والله ما تطيب نفسي"],
  [44, "كانت تقول أبى سائر أزواج النبي"],
  [45, "قالت عائشة دخل على رسول الله"],
  [47, "أن رسول الله صلى الله عليه وسلم يوم حنين بعث"],
  [48, "أن نبي الله صلى الله عليه وسلم بعث يوم حنين"],
  [50, "قال أصابوا سبيا يوم أوطاس"],
  [52, "أنها قالت اختصم سعد بن أبي وقاص"],
  [55, "قالت دخل قائف ورسول الله صلى الله عليه وسلم شاهد"],
  [58, "قال إذا تزوج البكر على الثيب"],
  [59, "من السنة أن يقيم"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 3, 4, 9, 11, 14, 19, 21, 24, 29, 30, 32, 33, 35, 37, 38, 41, 46, 49, 51, 53, 54, 56, 57]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(5, "وقال ابن نمير");
setTail(7, "أقرب إلى النهى");
setTail(20, "زاد عبيد الله في حديثه");
setTail(22, "وقال زهير في روايته");
setTail(26, "وزاد قلت إنما أرضعتني");
setTail(33, "وفي رواية بشر بن عمر");
setTail(42, "زاد عمرو في حديثه");
setTail(48, "ولم يذكر إذا انقضت عدتهن");
setTail(52, "ولم يذكر محمد بن رمح");
setTail(56, "وزاد في حديث يونس");

fs.writeFileSync("data/hadith-split/marks-109.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-109.json");
