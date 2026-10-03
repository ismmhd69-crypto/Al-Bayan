import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-149.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "narration", "dialogue", "dialogue", "prophet_words", "narration", "dialogue", "companion_words", "dialogue", "dialogue",
  "companion_words", "dialogue", "narration", "dialogue", "dialogue", "narration", "companion_words", "dialogue", "dialogue", "dialogue",
  "prophet_words", "narration", "narration", "companion_words", "narration", "companion_words", "companion_words", "dialogue", "narration", "companion_words",
  "companion_words", "narration", "narration", "dialogue", "dialogue", "dialogue", "dialogue", "narration", "prophet_words", "dialogue",
  "dialogue", "narration", "companion_words", "narration", "narration", "narration", "narration", "narration", "narration", "narration",
  "dialogue", "narration", "dialogue", "narration", "narration", "dialogue", "prophet_words", "narration", "narration", "dialogue",
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
  [0, "رأى نخامة"], [1, "قال صلى بنا النبي"], [2, "أتاه في منزله"], [3, "أن أم حبيبة"], [4, "قال انخسفت الشمس"],
  [5, "أن عائشة"], [6, "قال أتيت النبي"], [7, "قال لي ابن عباس"], [8, "قالت يا رسول الله"], [9, "أسود"],
  [10, "قال بعث النبي"], [11, "قالت شكوت إلى رسول"], [12, "قال خرج رسول الله"], [13, "قال سأل رجل النبي"], [14, "جاء إلى النبي"],
  [15, "قال بينما رسول الله"], [16, "أن عمر بن عبد العزيز"], [17, "قال قدم وفد عبد القيس"], [18, "قال كنا جلوسا"], [19, "أصاب من امرأة"],
  [20, "قال كنا عند النبي"], [21, "قال صلى لنا رسول"], [22, "أن عائشة"], [23, "قالت أعتّم رسول الله"], [24, "صلاة العشاء إلى نصف الليل"],
  [25, "قال انتظرنا الحسن"], [26, "أن أصحاب الصفة"], [27, "أنه أخبره أن أبا سعيد"], [28, "إذا غزا بنا قوما"], [29, "أتيت النبي"],
  [30, "أتينا إلى النبي"], [31, "خرج وقد أقيمت"], [32, "قال أقيمت الصلاة"], [33, "سئل أنس"], [34, "أن عتبان بن مالك"],
  [35, "قال قدمنا على النبي"], [36, "قال استأذن النبي"], [37, "أنها قالت صلى رسول"], [38, "قال النبي صلى الله عليه وسلم"], [39, "أن رجلا"],
  [40, "قال قال رجل"], [41, "قال أقيمت الصلاة"], [42, "قالت كان رسول الله"], [43, "اتخذ حجرة"], [44, "ركب فرسا"],
  [45, "أنه قال خر رسول الله"], [46, "كان يرفع يديه"], [47, "قال رأيت رسول الله"], [48, "قال رأيت النبي"], [49, "يسكت بين التكبير"],
  [50, "قال خسفت الشمس"], [51, "قال صلى لنا النبي"], [52, "قالت سألت رسول"], [53, "أن النبي صلى"], [54, "نخامة في قبلة المسجد"],
  [55, "أنه انتهى إلى النبي"], [56, "قالت كان النبي"], [57, "وكان رسول الله"], [58, "سقط"], [59, "قال انطلقت إلى أبي سعيد"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-149.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-149.json");
