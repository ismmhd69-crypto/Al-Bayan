import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-154.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "companion_words", "prophet_words", "narration", "dialogue", "companion_words", "narration", "dialogue", "dialogue", "prophet_words",
  "prophet_words", "dialogue", "dialogue", "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "narration", "narration",
  "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "companion_words", "prophet_words", "dialogue", "dialogue", "narration",
  "companion_words", "companion_words", "prophet_words", "dialogue", "companion_words", "prophet_words", "dialogue", "dialogue", "dialogue", "companion_words",
  "narration", "companion_words", "companion_words", "narration", "prophet_words", "prophet_words", "dialogue", "prophet_words", "dialogue", "companion_words",
  "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "narration",
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
  [0, "قالت الأنصار للنبي"], [1, "قال عمرو قلت لطاوس"], [2, "إن النبي صلى الله عليه وسلم لم ينه عنه"], [3, "أن النبي صلى الله عليه وسلم كان يوما يحدث"], [4, "قال يقولون إن أبا هريرة"],
  [5, "قال أتي النبي صلى الله عليه وسلم بقدح"], [6, "أنها حلبت لرسول الله صلى الله عليه وسلم"], [7, "أن النبي صلى الله عليه وسلم صلى صلاة الكسوف"], [8, "قال أتي رسول الله صلى الله عليه وسلم بقدح"], [9, "قال أراد النبي صلى الله عليه وسلم أن يقطع"],
  [10, "دعا النبي صلى الله عليه وسلم الأنصار"], [11, "قال غزوت مع النبي"], [12, "قال أتيت النبي صلى الله عليه وسلم"], [13, "أن جابر بن عبد الله"], [14, "أتى النبي صلى الله عليه وسلم رجل"],
  [15, "قال قال رجل للنبي صلى الله عليه وسلم"], [16, "اختصما إلى النبي صلى الله عليه وسلم"], [17, "أنه كان له على عبد الله بن أبي حدرد"], [18, "فخرج ينظر"], [19, "قال مر النبي صلى الله عليه وسلم"],
  [20, "أن النبي صلى الله عليه وسلم بعث معاذا"], [21, "أن رسول الله صلى الله عليه وسلم أتي بشراب"], [22, "أخبرتها عن رسول الله"], [23, "قالت جاءت هند بنت عتبة"], [24, "قلنا للنبي صلى الله عليه وسلم"],
  [25, "كنت ساقي القوم"], [26, "أشرف النبي صلى الله عليه وسلم"], [27, "قال آلى رسول الله"], [28, "قال دخل النبي صلى الله عليه وسلم المسجد"], [29, "أن النبي صلى الله عليه وسلم كان عند بعض نسائه"],
  [30, "كتب له فريضة الصدقة"], [31, "قال سألت أبا المنهال"], [32, "أن رسول الله صلى الله عليه وسلم أعطاه غنما"], [33, "قالت يا رسول الله بايعه"], [34, "قال ولقد رهن النبي صلى الله عليه وسلم"],
  [35, "عن النبي صلى الله عليه وسلم أنه كان يقول"], [36, "قالت اشتريت بريرة"], [37, "من الأنصار استأذنوا رسول الله"], [38, "قال رأيت أبا سعيد"], [39, "جاءت تستعين عائشة"],
  [40, "قال كنت يوما جالسا"], [41, "قال سمعت أنسا"], [42, "أنه أهدى لرسول الله"], [43, "قال كان رسول الله صلى الله عليه وسلم"], [44, "قال أتي النبي صلى الله عليه وسلم بلحم"],
  [45, "قال ذكر عروة"], [46, "قالت قلت يا رسول الله"], [47, "إن ميمونة زوج النبي"], [48, "قالت قلت يا رسول الله"], [49, "أهدى لرسول الله"],
  [50, "قال استعمل النبي صلى الله عليه وسلم رجلا"], [51, "قال قسم رسول الله صلى الله عليه وسلم"], [52, "أن النبي صلى الله عليه وسلم أتي بشراب"], [53, "يقول بعت من النبي صلى الله عليه وسلم"], [54, "أن رسول الله صلى الله عليه وسلم أتي بشراب"],
  [55, "قال أهدي للنبي صلى الله عليه وسلم"], [56, "أتت النبي صلى الله عليه وسلم"], [57, "قدمت على أمي"], [58, "يقول حملت على فرس"], [59, "كان فزع بالمدينة"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(19, "وقال يحيى حدثنا سفيان");
setTail(29, "وقال ابن أبي مريم");
setTail(55, "وقال سعيد عن قتادة");
fs.writeFileSync("data/hadith-split/marks-154.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-154.json");
