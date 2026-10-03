import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-155.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "dialogue", "dialogue", "prophet_words", "prophet_words", "dialogue", "dialogue", "prophet_words", "narration", "dialogue",
  "companion_words", "companion_words", "dialogue", "companion_words", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue",
  "prophet_words", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue",
  "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue", "companion_words", "dialogue", "narration",
  "companion_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "narration", "prophet_words", "narration", "narration", "narration",
  "dialogue", "narration", "narration", "dialogue", "prophet_words", "companion_words", "prophet_words", "dialogue", "prophet_words", "prophet_words",
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
  [0, "حملت على فرس في سبيل الله"], [1, "جاءت امرأة رفاعة"], [2, "استأذن على أفلح"], [3, "قال قال النبي صلى الله عليه وسلم"], [4, "قال سئل النبي صلى الله عليه وسلم"],
  [5, "قال قدمت على النبي صلى الله عليه وسلم"], [6, "أنه تزوج أم يحيى"], [7, "قال سمع النبي صلى الله عليه وسلم"], [8, "من بني عمرو بن عوف"], [9, "قباء اقتتلوا"],
  [10, "قال لما صالح رسول الله صلى الله عليه وسلم"], [11, "استقبل والله الحسن بن علي"], [12, "سمع رسول الله صلى الله عليه وسلم صوت خصوم"], [13, "أنه كان له على عبد الله بن أبي حدرد"], [14, "أن بريرة جاءت عائشة"],
  [15, "قالت الأنصار للنبي صلى الله عليه وسلم"], [16, "أصاب أرضا بخيبر"], [17, "قال لو غض الناس"], [18, "قال قال رجل للنبي صلى الله عليه وسلم"], [19, "قال سألت رسول الله صلى الله عليه وسلم"],
  [20, "قال قام رسول الله صلى الله عليه وسلم"], [21, "توفيت أمه وهو غائب"], [22, "قال سمعت كعب بن مالك"], [23, "قال للنبي صلى الله عليه وسلم"], [24, "استفتى رسول الله صلى الله عليه وسلم"],
  [25, "أخا بني ساعدة توفيت أمه"], [26, "قال لرسول الله صلى الله عليه وسلم"], [27, "قال أمر النبي صلى الله عليه وسلم"], [28, "قال أصاب عمر بخيبر"], [29, "وجد مالا بخيبر"],
  [30, "لما قدم رسول الله صلى الله عليه وسلم المدينة"], [31, "حمل على فرس له"], [32, "أنها قالت يا رسول الله"], [33, "قال جاء رجل إلى رسول الله"], [34, "أن رسول الله صلى الله عليه وسلم كان في بعض المشاهد"],
  [35, "أتت النبي صلى الله عليه وسلم"], [36, "قال جاء رجل إلى النبي صلى الله عليه وسلم"], [37, "قال كنا ننقل لبن المسجد"], [38, "يقول جيء بأبي إلى النبي"], [39, "قال كان النبي صلى الله عليه وسلم أحسن الناس"],
  [40, "أنه بينما هو يسير مع رسول الله"], [41, "قال كان سعد يعلم بنيه"], [42, "أن النبي صلى الله عليه وسلم قال يوم الفتح"], [43, "كان النبي صلى الله عليه وسلم ينقل"], [44, "أن النبي صلى الله عليه وسلم كان في غزاة"],
  [45, "أن النبي صلى الله عليه وسلم لم يكن يدخل بيتا"], [46, "قال انصرفت من عند النبي"], [47, "أنه خرج مع النبي صلى الله عليه وسلم"], [48, "قال كان فزع بالمدينة"], [49, "قال كان بالمدينة فزع"],
  [50, "قال رجل للبراء بن عازب"], [51, "المدينة فزعوا"], [52, "قال كان للنبي صلى الله عليه وسلم ناقة"], [53, "قال له رجل يا أبا عمارة"], [54, "سأله نساؤه عن الجهاد"],
  [55, "قال رمي أبو عامر"], [56, "قال قال النبي صلى الله عليه وسلم يوم بدر"], [57, "بينا الحبشة يلعبون"], [58, "يقول ما رأيت النبي صلى الله عليه وسلم يفدي"], [59, "قال قال النبي صلى الله عليه وسلم وهو في قبة"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(4, "تابعه غندر");
setTail(52, "طوله موسى");
setTail(57, "وزاد علي");
fs.writeFileSync("data/hadith-split/marks-155.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-155.json");
