import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-153.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "companion_words", "prophet_words", "prophet_words", "dialogue", "companion_words", "dialogue", "dialogue", "companion_words", "prophet_words",
  "prophet_words", "companion_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "narration", "dialogue", "dialogue", "narration",
  "prophet_words", "prophet_words", "narration", "dialogue", "narration", "dialogue", "dialogue", "companion_words", "dialogue", "dialogue",
  "prophet_words", "companion_words", "dialogue", "prophet_words", "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue",
  "dialogue", "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "prophet_words", "prophet_words",
  "reference_only", "prophet_words", "prophet_words", "prophet_words", "dialogue", "dialogue", "companion_words", "companion_words", "dialogue", "companion_words",
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
  [0, "قال آلى رسول الله"], [1, "قال لما نزلت"], [2, "أن النبي صلى الله عليه وسلم واصل"], [3, "أن النبي صلى الله عليه وسلم بعث رجلا"], [4, "رسول الله صلى الله عليه وسلم في الخميلة"],
  [5, "رأيت عثمان"], [6, "قال للنبي صلى الله عليه وسلم"], [7, "قال جاء رجل إلى النبي"], [8, "قالت أرسل النبي"], [9, "قال نهى رسول الله"],
  [10, "قالت نهى رسول الله"], [11, "لم يكن النبي صلى الله عليه وسلم"], [12, "قال سمعت أبا سعيد"], [13, "قال قال النبي صلى الله عليه وسلم"], [14, "قال أمر النبي صلى الله عليه وسلم"],
  [15, "قال سمعت رسول الله صلى الله عليه وسلم"], [16, "أن رسول الله صلى الله عليه وسلم خرج"], [17, "أنه سأل عائشة"], [18, "قال سألت أبا سعيد"], [19, "كان رسول الله صلى الله عليه وسلم يجاور"],
  [20, "قالت كان رسول الله صلى الله عليه وسلم يجاور"], [21, "قال خرج النبي صلى الله عليه وسلم"], [22, "أن رسول الله صلى الله عليه وسلم كان يعتكف"], [23, "سأل النبي صلى الله عليه وسلم"], [24, "أن النبي صلى الله عليه وسلم أراد"],
  [25, "قال سألت أبا سعيد"], [26, "أتت النبي صلى الله عليه وسلم"], [27, "قال اعتكفنا مع رسول الله"], [28, "سوداء جاءت"], [29, "شكي إلى النبي صلى الله عليه وسلم"],
  [30, "قالا كنا تاجرين"], [31, "أنه مشى إلى النبي"], [32, "قال جاءت امرأة"], [33, "قال بعث رسول الله"], [34, "قال أرسل النبي"],
  [35, "ذكر للنبي صلى الله عليه وسلم"], [36, "دعا رجل بالبقيع"], [37, "أن رجلا أعتق غلاما"], [38, "أن رسول الله صلى الله عليه وسلم سئل"], [39, "قال سألت ابن عباس"],
  [40, "أرادت أن تشتري جارية"], [41, "قال كان الناس في عهد رسول الله"], [42, "أن رسول الله صلى الله عليه وسلم نهى"], [43, "قالت هند أم معاوية"], [44, "أنها قالت اختصم سعد"],
  [45, "قال كنت عند ابن عباس"], [46, "لما نزلت آيات سورة البقرة"], [47, "بينما هو جالس عند النبي"], [48, "سمعا رسول الله صلى الله عليه وسلم يسأل"], [49, "قال قدم رسول الله صلى الله عليه وسلم المدينة"],
  [51, "قال قدم النبي صلى الله عليه وسلم المدينة"], [52, "فليسلف في كيل معلوم"], [53, "يقول قدم النبي صلى الله عليه وسلم"], [54, "قلت يا رسول الله"], [55, "قال أقبلت إلى النبي"],
  [56, "قال غزوت مع النبي"], [57, "قال انطلق نفر"], [58, "قالت يا رسول الله"], [59, "يقول كان أبو طلحة"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(10, "قال أبو عبد الله");
setTail(29, "وقال ابن أبي حفصة");
setTail(38, "قال ابن شهاب لا أدري");
fs.writeFileSync("data/hadith-split/marks-153.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-153.json");
