import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-128.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "prophet_words", "reference_only", "reference_only", "dialogue", "reference_only", "narration", "reference_only", "dialogue", "reference_only",
  "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only",
  "narration", "reference_only", "reference_only", "narration", "reference_only", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "reference_only", "reference_only", "reference_only", "dialogue", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue",
  "reference_only", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words", "reference_only", "dialogue", "reference_only", "prophet_words",
  "companion_words", "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "prophet_words", "reference_only", "dialogue", "prophet_words",
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) {
  const clean: string[] = [], map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(text[i])) continue;
    clean.push(text[i]); map.push(i);
  }
  return { clean: clean.join(""), map };
}
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) {
  const { clean, map } = cleanMap(text); const p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate: ${needle}`);
  return text.slice(map[p], map[p] + Math.min(100, text.length - map[p]));
}
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }

const starts: Array<[number, string]> = [
  [1, "نهى رسول الله صلى الله عليه وسلم أن يقرن الرجل بين التمرتين"],
  [4, "قال كنا مع النبي صلى الله عليه وسلم بمر الظهران"],
  [6, "يقول أخذ رسول الله صلى الله عليه وسلم بيدي"],
  [8, "قال كنت جالسا في داري فمر بي رسول الله صلى الله عليه وسلم"],
  [11, "قال جاء رجل إلى رسول الله صلى الله عليه وسلم"],
  [12, "أن رجلا، من الأنصار بات به ضيف"],
  [13, "قال أقبلت أنا وصاحبان، لي"],
  [15, "قال كنا مع النبي صلى الله عليه وسلم ثلاثين ومائة"],
  [20, "قال ما عاب رسول الله صلى الله عليه وسلم طعاما قط"],
  [23, "قال ما رأيت رسول الله صلى الله عليه وسلم عاب طعاما قط"],
  [25, "قال دخلت على البراء بن عازب"],
  [34, "أن عمر، بن الخطاب رأى حلة سيراء"],
  [36, "رأى عمر عطارد"],
  [37, "قال وجد عمر بن الخطاب حلة من إستبرق"],
  [39, "أن عمر، رأى على رجل من آل عطارد"],
  [43, "قال سمعت أبا عثمان النهدي"],
  [45, "أن عمر، بن الخطاب خطب بالجابية"],
  [47, "يقول لبس النبي صلى الله عليه وسلم يوما قباء"],
  [49, "أن أكيدر، دومة أهدى إلى النبي صلى الله عليه وسلم"],
  [50, "قال كساني رسول الله صلى الله عليه وسلم حلة سيراء"],
  [52, "أن رسول الله صلى الله عليه وسلم رخص لعبد الرحمن بن عوف"],
  [54, "قال رخص رسول الله صلى الله عليه وسلم"],
  [56, "أن عبد الرحمن بن عوف والزبير بن العوام شكوا إلى رسول الله"],
  [58, "قال رأى النبي صلى الله عليه وسلم على ثوبين معصفرين"],
  [59, "أن رسول الله صلى الله عليه وسلم نهى عن لبس القسي"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-128.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-128.json");
