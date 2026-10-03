import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-151.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "companion_words", "companion_words", "companion_words", "dialogue", "dialogue", "narration", "companion_words", "narration", "companion_words",
  "dialogue", "narration", "prophet_words", "dialogue", "dialogue", "dialogue", "companion_words", "companion_words", "dialogue", "companion_words",
  "prophet_words", "prophet_words", "narration", "companion_words", "narration", "narration", "prophet_words", "dialogue", "dialogue", "dialogue",
  "companion_words", "prophet_words", "dialogue", "companion_words", "dialogue", "dialogue", "companion_words", "prophet_words", "narration", "prophet_words",
  "dialogue", "dialogue", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "dialogue", "companion_words",
  "dialogue", "dialogue", "dialogue", "companion_words", "narration", "companion_words", "companion_words", "narration", "prophet_words", "companion_words",
];

const marks: any[] = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) {
  const clean: string[] = [], map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670\u200e\u200f]/.test(text[i])) continue;
    clean.push(text[i]); map.push(i);
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
  try { marks[i].start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Index ${i}: ${(error as Error).message}`); }
}
function setTail(i: number, needle: string) {
  try { marks[i].tail_start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Tail ${i}: ${(error as Error).message}`); }
}

const starts: Array<[number, string]> = [
  [0, "قال كان الناس يصلون"], [1, "قال كنت أسلم"], [2, "قال بعثني رسول الله"], [3, "قال صليت مع النبي"], [4, "أن رسول الله صلى الله عليه وسلم صلى الظهر"],
  [5, "قال صلى بنا النبي"], [6, "قال صلى النبي"], [7, "أن ابن عباس"], [8, "أن رسول الله صلى الله عليه وسلم بلغه"], [9, "أنها قالت صلى رسول الله"],
  [10, "قال مات إنسان"], [11, "قال مر النبي"], [12, "قال رسول الله صلى الله عليه وسلم في غسل ابنته"], [13, "قالت لما غسلنا بنت النبي"], [14, "قالت توفيت إحدى بنات النبي"],
  [15, "قال كان رجل واقف"], [16, "قالت إنما مر رسول الله"], [17, "قالت لما جاء النبي"], [18, "قال مر بنا جنازة"], [19, "فمروا عليهما بجنازة"],
  [20, "قال نعى لنا رسول الله"], [21, "عن النبي صلى الله عليه وسلم قال في مرضه"], [22, "قال صلى النبي"], [23, "قالت لما اشتكى النبي"], [24, "أن النبي صلى الله عليه وسلم خرج"],
  [25, "قال خرج النبي"], [26, "قال كان رسول الله صلى الله عليه وسلم يدعو"], [27, "قال سئل رسول الله"], [28, "يقول سئل النبي"], [29, "قال للنبي صلى الله عليه وسلم"],
  [30, "قالت إن كان رسول الله"], [31, "قالت قال رسول الله"], [32, "أن النبي صلى الله عليه وسلم بعث معاذا"], [33, "قالت دخلت امرأة"], [34, "قال جاء رجل إلى النبي"],
  [35, "قلن للنبي صلى الله عليه وسلم"], [36, "قال بايعت رسول الله"], [37, "أن رسول الله صلى الله عليه وسلم قال"], [38, "قال صلى بنا النبي"], [39, "قال كان رسول الله صلى الله عليه وسلم إذا جاءه السائل"],
  [40, "أنها جاءت إلى النبي"], [41, "قال قال عمر"], [42, "كتب له التي أمر الله رسوله"], [43, "كتب له التي فرض رسول الله"], [44, "كتب له التي فرض رسول الله"],
  [45, "كتب له فريضة الصدقة"], [46, "كتب له هذا الكتاب"], [47, "كتب له"], [48, "أن رسول الله صلى الله عليه وسلم لما بعث معاذا"], [49, "قال انتهيت إلى النبي"],
  [50, "قالت قلت يا رسول الله"], [51, "أن ناسا من الأنصار سألوا رسول الله"], [52, "قال سألت رسول الله"], [53, "قال سمعت عمر"], [54, "قال كان رسول الله صلى الله عليه وسلم يؤتى"],
  [55, "كان يحدث أن عمر بن الخطاب"], [56, "قال سمعت عمر"], [57, "أن النبي صلى الله عليه وسلم أتي بلحم"], [58, "قال قال رسول الله صلى الله عليه وسلم"], [59, "قال كان الفضل رديف رسول الله"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(49, "رواه بكير");
setTail(57, "وقال أبو داود");
fs.writeFileSync("data/hadith-split/marks-151.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-151.json");
