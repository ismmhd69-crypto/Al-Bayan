import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-126.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "prophet_words", "prophet_words", "reference_only", "companion_words", "companion_words", "prophet_words", "prophet_words", "dialogue", "prophet_words",
  "dialogue", "prophet_words", "reference_only", "dialogue", "prophet_words", "reference_only", "prophet_words", "prophet_words", "prophet_words", "prophet_words",
  "prophet_words", "dialogue", "prophet_words", "reference_only", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "prophet_words",
  "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "prophet_words", "prophet_words", "prophet_words", "narration", "narration",
  "prophet_words", "dialogue", "reference_only", "reference_only", "narration", "narration", "narration", "narration", "dialogue", "dialogue",
  "narration", "dialogue", "reference_only", "reference_only", "dialogue", "dialogue", "companion_words", "companion_words", "dialogue", "dialogue",
];

const marks = batch.map((x: any, i: number) => ({
  id: x.id,
  url: x.url,
  start: null as string | null,
  kind: kinds[i],
}));

function cleanMap(text: string) {
  const clean: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(text[i])) continue;
    clean.push(text[i]);
    map.push(i);
  }
  return { clean: clean.join(""), map };
}

const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");

function locate(text: string, needle: string) {
  const { clean, map } = cleanMap(text);
  const p = clean.indexOf(strip(needle));
  if (p < 0) throw new Error(`Could not locate: ${needle}`);
  return text.slice(map[p], map[p] + Math.min(100, text.length - map[p]));
}

function setStart(i: number, needle: string) {
  marks[i].start = locate(batch[i].text_original, needle);
}

const starts: Array<[number, string]> = [
  [1, "قال رسول الله صلى الله عليه وسلم"],
  [2, "قال نهى النبي صلى الله عليه وسلم"],
  [4, "أنه كان يقول قد نهي"],
  [5, "أنه قال قد نهي"],
  [6, "أن رسول الله صلى الله عليه وسلم نهى عن الدباء"],
  [7, "أن رسول الله صلى الله عليه وسلم نهى عن الدباء"],
  [8, "عن النبي صلى الله عليه وسلم أنه نهى"],
  [9, "قال نهى رسول الله صلى الله عليه وسلم"],
  [10, "قال قلت للأسود هل سألت أم المؤمنين"],
  [11, "أن النبي صلى الله عليه وسلم نهى عن الدباء"],
  [13, "قال لقيت عائشة فسألتها عن النبيذ"],
  [14, "قالت نهى رسول الله صلى الله عليه وسلم"],
  [16, "أن رسول الله صلى الله عليه وسلم نهى عن"],
  [17, "أن رسول الله صلى الله عليه وسلم نهى عن"],
  [18, "أن نبي الله صلى الله عليه وسلم نهى أن ينتبذ"],
  [19, "قال نهى رسول الله صلى الله عليه وسلم عن الشرب"],
  [20, "قال أشهد على ابن عمر وابن عباس"],
  [21, "قال سألت ابن عمر عن نبيذ الجر"],
  [22, "أن رسول الله صلى الله عليه وسلم خطب الناس"],
  [24, "قال قلت لابن عمر نهى رسول الله"],
  [25, "قال قال رجل لابن عمر"],
  [26, "أن رجلا، جاءه فقال أنهى النبي"],
  [27, "أن رسول الله صلى الله عليه وسلم نهى عن الجر"],
  [28, "يقول كنت جالسا عند ابن عمر"],
  [29, "يقول نهى رسول الله صلى الله عليه وسلم"],
  [31, "قال نهى رسول الله صلى الله عليه وسلم عن الحنتمة"],
  [32, "قال قلت لابن عمر حدثني بما"],
  [34, "يقول عند هذا المنبر"],
  [35, "أن رسول الله صلى الله عليه وسلم نهى عن النقير"],
  [36, "يقول سمعت رسول الله صلى الله عليه وسلم"],
  [37, "نهى رسول الله صلى الله عليه وسلم عن الجر والمزفت والنقير"],
  [38, "أن النبي صلى الله عليه وسلم كان ينبذ له"],
  [39, "قال كان ينتبذ لرسول الله صلى الله عليه وسلم"],
  [40, "قال لما نهى رسول الله صلى الله عليه وسلم"],
  [41, "أن رجلا، قدم من جيشان"],
  [44, "يقول كان رسول الله صلى الله عليه وسلم ينتبذ له"],
  [45, "قال ذكروا النبيذ عند ابن عباس"],
  [46, "قال كان رسول الله صلى الله عليه وسلم ينقع له"],
  [47, "قال كان رسول الله صلى الله عليه وسلم ينبذ له"],
  [48, "قال سأل قوم ابن عباس عن بيع الخمر"],
  [49, "قال لقيت عائشة فسألتها عن النبيذ"],
  [50, "قالت كنا ننبذ لرسول الله صلى الله عليه وسلم"],
  [51, "قال دعا أبو أسيد الساعدي رسول الله"],
  [54, "قال ذكر لرسول الله صلى الله عليه وسلم"],
  [55, "قال لقد سقيت رسول الله صلى الله عليه وسلم"],
  [56, "قال قال أبو بكر الصديق لما خرجنا"],
  [57, "يقول لما أقبل رسول الله صلى الله عليه وسلم"],
  [58, "يقول جاء أبو بكر الصديق إلى أبي"],
  [59, "قال اشترى أبو بكر من أبي رحلا"],
];

for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-126.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-126.json");
