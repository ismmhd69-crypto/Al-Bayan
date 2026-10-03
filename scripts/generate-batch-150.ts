import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-150.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "prophet_words", "companion_words", "companion_words", "dialogue", "prophet_words", "narration", "companion_words", "prophet_words", "dialogue", "narration",
  "narration", "prophet_words", "dialogue", "companion_words", "dialogue", "companion_words", "narration", "prophet_words", "companion_words", "prophet_words",
  "prophet_words", "narration", "prophet_words", "narration", "narration", "dialogue", "narration", "narration", "narration", "dialogue",
  "narration", "narration", "narration", "narration", "narration", "narration", "narration", "narration", "dialogue", "dialogue",
  "dialogue", "narration", "dialogue", "narration", "narration", "narration", "dialogue", "narration", "dialogue", "dialogue",
  "dialogue", "companion_words", "prophet_words", "dialogue", "companion_words", "companion_words", "prophet_words", "narration", "narration", "narration",
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
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

const starts: Array<[number, string]> = [
  [0, "قالت كان النبي"], [1, "قال لأصحابه"], [2, "قال عبد الله كنا"], [3, "أنه قال لرسول الله"], [4, "كان يقول في دبر"],
  [5, "قال أخر رسول الله"], [6, "قال صليت وراء النبي"], [7, "قال في غزوة خيبر"], [8, "أن جدته"], [9, "قالت أعتّم"],
  [10, "قالت أعتّم رسول الله"], [11, "قال أشهد على أبي سعيد"], [12, "بينما هو يخطب"], [13, "كانت امرأة لعمر"], [14, "سمعت النبي صلى الله عليه وسلم"],
  [15, "أتي بمال"], [16, "خرج ذات ليلة"], [17, "قال قام رسول الله"], [18, "قال أصابت الناس سنة"], [19, "ذكر يوم الجمعة"],
  [20, "قال قال النبي صلى الله عليه وسلم"], [21, "صلى الصبح بغلس"], [22, "إن أول ما نبدأ"], [23, "صلى النبي"], [24, "قال كنا عند عبد الله"],
  [25, "جاء رجل إلى النبي"], [26, "أن رسول الله صلى الله عليه وسلم كان إذا رأى"], [27, "قال أصابت الناس سنة"], [28, "كنا عند رسول الله"], [29, "قالت خسفت الشمس"],
  [30, "أن رسول الله صلى"], [31, "أنها قالت أتيت"], [32, "قالت كسفت الشمس"], [33, "قال خسفت الشمس"], [34, "قالت فانصرف رسول الله"],
  [35, "قال خسفت الشمس"], [36, "أنها قالت صلى رسول"], [37, "قال سقط رسول الله"], [38, "أنه سأل نبي الله"], [39, "قال سألت النبي"],
  [40, "كانت بي بواسير"], [41, "قال كان الرجل في حياة النبي"], [42, "أن النبي صلى الله عليه وسلم استيقظ"], [43, "أن رسول الله صلى"], [44, "يقول إن كان النبي"],
  [45, "أن رسول الله صلى الله عليه وسلم قال له"], [46, "إن رجلا قال"], [47, "عن النبي صلى الله عليه وسلم في الرؤيا"], [48, "ذكر عند النبي صلى الله عليه وسلم رجل"], [49, "سأل عائشة"],
  [50, "أن النبي صلى الله عليه وسلم قال لبلال"], [51, "قال كان رسول الله صلى الله عليه وسلم يعلمنا"], [52, "قال رسول الله صلى الله عليه وسلم"], [53, "يحدث بأربع عن النبي"], [54, "كنا نسلم على النبي"],
  [55, "كنا نقول التحية"], [56, "أن النبي صلى الله عليه وسلم قال في الرجل"], [57, "أنه صلى صلاة"], [58, "قالت عائشة خسفت الشمس"], [59, "أن النبي صلى الله عليه وسلم رأى نخامة"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-150.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-150.json");
