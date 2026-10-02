import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-127.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "dialogue", "prophet_words", "prophet_words", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only", "reference_only",
  "reference_only", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words",
  "prophet_words", "dialogue", "narration", "prophet_words", "narration", "reference_only", "narration", "reference_only", "narration", "reference_only",
  "companion_words", "companion_words", "narration", "reference_only", "reference_only", "reference_only", "reference_only", "narration", "reference_only", "reference_only",
  "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "reference_only", "reference_only",
  "reference_only", "reference_only", "narration", "companion_words", "reference_only", "reference_only", "narration", "narration", "narration", "companion_words",
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));

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
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }

const starts: Array<[number, string]> = [
  [1, "قال كنا مع رسول الله صلى الله عليه وسلم فاستسقى"],
  [2, "عن رسول الله صلى الله عليه وسلم أنه قال"],
  [3, "قال قال رسول الله صلى الله عليه وسلم"],
  [11, "أن رسول الله صلى الله عليه وسلم قال"],
  [12, "أن رجلا أكل عند رسول الله صلى الله عليه وسلم"],
  [13, "قال نهى النبي صلى الله عليه وسلم"],
  [14, "أنه قال نهى رسول الله صلى الله عليه وسلم"],
  [16, "أن النبي صلى الله عليه وسلم زجر عن الشرب قائما"],
  [17, "عن النبي صلى الله عليه وسلم أنه نهى أن يشرب الرجل قائما"],
  [19, "أن النبي صلى الله عليه وسلم زجر عن الشرب قائما"],
  [20, "أن رسول الله صلى الله عليه وسلم نهى عن الشرب قائما"],
  [21, "قال سقيت رسول الله صلى الله عليه وسلم من زمزم"],
  [22, "أن النبي صلى الله عليه وسلم شرب من زمزم"],
  [23, "أن رسول الله صلى الله عليه وسلم شرب من زمزم"],
  [24, "قال سقيت رسول الله صلى الله عليه وسلم من زمزم"],
  [26, "أن رسول الله صلى الله عليه وسلم كان يتنفس في الإناء"],
  [28, "أن رسول الله صلى الله عليه وسلم أتي بشراب"],
  [30, "قال رأيت النبي صلى الله عليه وسلم يلعق"],
  [31, "قال كان رسول الله صلى الله عليه وسلم يأكل"],
  [32, "أن رسول الله صلى الله عليه وسلم كان يأكل بثلاث أصابع"],
  [37, "أن رسول الله صلى الله عليه وسلم كان إذا أكل طعاما"],
  [41, "أن جارا، لرسول الله صلى الله عليه وسلم فارسيا"],
  [42, "قال خرج رسول الله صلى الله عليه وسلم ذات يوم"],
  [43, "يقول لما حفر الخندق رأيت برسول الله صلى الله عليه وسلم"],
  [44, "يقول قال أبو طلحة لأم سليم"],
  [45, "قال بعثني أبو طلحة إلى رسول الله صلى الله عليه وسلم"],
  [47, "قال أمر أبو طلحة أم سليم أن تصنع"],
  [52, "يقول إن خياطا دعا رسول الله صلى الله عليه وسلم"],
  [53, "قال دعا رسول الله صلى الله عليه وسلم رجل"],
  [56, "قال رأيت رسول الله صلى الله عليه وسلم يأكل القثاء"],
  [57, "قال رأيت النبي صلى الله عليه وسلم مقعيا يأكل تمرا"],
  [58, "قال أتي رسول الله صلى الله عليه وسلم بتمر"],
  [59, "قال كان ابن الزبير يرزقنا التمر"],
];

for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-127.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-127.json");
