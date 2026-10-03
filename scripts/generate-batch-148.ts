import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-148.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue", "companion_words", "dialogue", "dialogue",
  "companion_words", "dialogue", "dialogue", "dialogue", "narration", "narration", "dialogue", "dialogue", "dialogue", "dialogue",
  "companion_words", "prophet_words", "dialogue", "companion_words", "dialogue", "companion_words", "prophet_words", "dialogue", "narration", "narration",
  "companion_words", "dialogue", "prophet_words", "dialogue", "dialogue", "prophet_words", "prophet_words", "narration", "dialogue", "narration",
  "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words", "dialogue", "companion_words", "dialogue", "dialogue",
  "dialogue", "companion_words", "dialogue", "dialogue", "companion_words", "dialogue", "companion_words", "dialogue", "dialogue", "dialogue",
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
  [0, "أن رجلا"], [1, "أن رسول الله"], [2, "قال تخلف عنا النبي"], [3, "أن أبا مرة"], [4, "ضمني رسول الله"],
  [5, "أنه تمارى"], [6, "قالت أتيت عائشة"], [7, "قال كنت أنا وجار"], [8, "قال قال رجل"], [9, "قال تخلف رسول الله"],
  [10, "قال سمعت أبا حازم"], [11, "أنه قال لعمرو"], [12, "قلت للزبير"], [13, "قالت استيقظ النبي"], [14, "قال صلى بنا النبي"],
  [15, "بت في بيت خالتي"], [16, "قال جاء رجل"], [17, "قال كنت رجلا"], [18, "أن رجلا سأل"], [19, "أنه شكا إلى رسول"],
  [20, "أنه سمعه يقول دفع"], [21, "قال سمعت أنسا"], [22, "قال اتبعت النبي"], [23, "أنه سمع عبد الله"], [24, "قال تخلف النبي"],
  [25, "أنه رأى عثمان"], [26, "قالت قال النبي"], [27, "قال قال علي"], [28, "لما أفاض"], [29, "أنها قالت أتيت"],
  [30, "أن عائشة"], [31, "قال كنت مع النبي"], [32, "شرب لبنا"], [33, "رأى أعرابيا"], [34, "قالت جاءت امرأة"],
  [35, "سئل عن فأرة"], [36, "سئل عن فأرة"], [37, "قال أتيت النبي"], [38, "قال كنت رجلا"], [39, "قال أقيمت الصلاة"],
  [40, "أن أبا مرة"], [41, "أن عمر بن الخطاب"], [42, "قال استفتى عمر"], [43, "أنه قال يا رسول الله"], [44, "بينا أنا"],
  [45, "قالت خرجنا"], [46, "أن فاطمة بنت"], [47, "قالت بينا أنا"], [48, "أن فاطمة بنت"], [49, "أن أم حبيبة"],
  [50, "قال قال عمار"], [51, "فرض الله الصلاة"], [52, "قال كنت مع النبي"], [53, "قال قام رجل"], [54, "قال أهدي إلى النبي"],
  [55, "أن جدته"], [56, "قال لما دخل النبي"], [57, "قال صلى النبي"], [58, "رأى بصاقا"], [59, "رأى نخامة"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-148.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-148.json");
