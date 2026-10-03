import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-152.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "dialogue", "prophet_words", "companion_words", "dialogue", "dialogue", "prophet_words", "prophet_words", "dialogue", "prophet_words",
  "prophet_words", "dialogue", "narration", "companion_words", "dialogue", "companion_words", "companion_words", "narration", "companion_words", "companion_words",
  "companion_words", "narration", "dialogue", "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "narration",
  "companion_words", "dialogue", "companion_words", "companion_words", "companion_words", "companion_words", "prophet_words", "dialogue", "narration", "prophet_words",
  "dialogue", "prophet_words", "narration", "companion_words", "dialogue", "dialogue", "companion_words", "dialogue", "companion_words", "dialogue",
  "narration", "companion_words", "prophet_words", "prophet_words", "dialogue", "companion_words", "dialogue", "companion_words", "prophet_words", "narration",
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
  [0, "أنها قالت يا رسول الله"], [1, "أنها قالت يا رسول الله"], [2, "يقول سمعت النبي"], [3, "قال كانوا يرون"], [4, "أنها قالت يا رسول الله"],
  [5, "قال لما بنيت الكعبة"], [6, "أن النبي صلى الله عليه وسلم قال لها"], [7, "قال قال رسول الله صلى الله عليه وسلم"], [8, "أنه قال يا رسول الله"], [9, "قال قال رسول الله صلى الله عليه وسلم"],
  [10, "قال قال النبي صلى الله عليه وسلم"], [11, "قالت شكوت إلى رسول الله"], [12, "أن النبي صلى الله عليه وسلم مر"], [13, "بعثه في الحجة التي"], [14, "قالت شكوت إلى رسول الله"],
  [15, "أنها قالت قدمت مكة"], [16, "قال أهل النبي"], [17, "أن النبي صلى الله عليه وسلم حيث أفاض"], [18, "أنه قال ردفْت رسول الله"], [19, "أنه دفع مع النبي"],
  [20, "أنه سمعه يقول دفع رسول الله"], [21, "تمتع رسول الله"], [22, "قالت قلت يا رسول الله"], [23, "كنا لا نأكل"], [24, "أنها قالت يا رسول الله"],
  [25, "أن النبي صلى الله عليه وسلم قيل له"], [26, "يا رسول الله يصدر الناس"], [27, "أتى النبي صلى الله عليه وسلم"], [28, "قال اعتمر رسول الله"], [29, "أن رسول الله صلى الله عليه وسلم كان إذا قفل"],
  [30, "فقالا لا يضرك"], [31, "أن رسول الله صلى الله عليه وسلم رآه"], [32, "قال انطلق أبي"], [33, "قال انطلقنا مع النبي"], [34, "قال كنا مع النبي"],
  [35, "أنه أهدى لرسول الله"], [36, "أن رسول الله صلى الله عليه وسلم قال للوزغ"], [37, "أنه قال لعمرو بن سعيد"], [38, "قال وقصت برجل"], [39, "قال سمعت النبي صلى الله عليه وسلم يخطب"],
  [40, "سئل رسول الله صلى الله عليه وسلم"], [41, "قال خطبنا النبي"], [42, "أن رسول الله صلى الله عليه وسلم دخل"], [43, "قال كنت مع رسول الله"], [44, "جاءت إلى النبي صلى الله عليه وسلم"],
  [45, "قالت يا رسول الله"], [46, "قال كان الفضل رديف النبي"], [47, "قالت قلت يا رسول الله"], [48, "قال سمعت أبا سعيد"], [49, "قال نذرت أختي"],
  [50, "قدم النبي صلى الله عليه وسلم المدينة"], [51, "أقبلنا مع النبي"], [52, "أشرف النبي صلى الله عليه وسلم"], [53, "قال حدثنا رسول الله"], [54, "جاء أعرابي النبي"],
  [55, "قال أراد بنو سلمة"], [56, "قال قال عمر"], [57, "قال بينا أنا أمشي"], [58, "أن رسول الله صلى الله عليه وسلم ذكر رمضان"], [59, "أن النبي صلى الله عليه وسلم آلى"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(10, "يعني ذلك المحصب");
setTail(36, "قال أبو عبد الله");
setTail(52, "تابعه معمر");
fs.writeFileSync("data/hadith-split/marks-152.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-152.json");
