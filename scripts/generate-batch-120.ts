import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-120.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "narration", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "narration", "reference_only", "reference_only", "dialogue",
  "reference_only", "companion_words", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "dialogue", "reference_only", "narration",
  "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "companion_words", "dialogue", "dialogue", "dialogue", "reference_only",
  "dialogue", "narration", "reference_only", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words",
  "reference_only", "companion_words", "reference_only", "dialogue", "prophet_words", "companion_words", "reference_only", "reference_only", "reference_only", "prophet_words",
  "dialogue", "reference_only", "narration", "dialogue", "reference_only", "narration", "prophet_words", "dialogue", "reference_only", "dialogue",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "أن رسول الله صلى الله عليه وسلم قسم في النفل للفرس"], [2, "قال لما كان يوم بدر"], [3, "يقول بعث رسول الله صلى الله عليه وسلم خيلا قبل نجد"], [5, "أنه قال بينا نحن في المسجد إذ خرج إلينا رسول الله"], [6, "فأجلى رسول الله صلى الله عليه وسلم بني النضير"],
  [9, "قال نزل أهل قريظة على حكم سعد بن معاذ"], [11, "قال وتحجر كلمه للبرء فقال"], [13, "قال لما قدم المهاجرون من مكة المدينة"], [14, "قال أصبت جرابا من شحم يوم خيبر"], [15, "يقول رمي إلينا جراب"],
  [17, "قال انطلقت في المدة التي كانت بيني وبين رسول الله"], [19, "كتب إلى كسرى"], [22, "شهدت مع رسول الله صلى الله عليه وسلم يوم حنين"], [25, "غزونا مع رسول الله صلى الله عليه وسلم"], [26, "حاصر رسول الله صلى الله عليه وسلم أهل الطائف"],
  [27, "أن رسول الله صلى الله عليه وسلم شاور حين بلغه إقبال أبي سفيان"], [28, "قال وفدت وفود إلى معاوية"], [30, "قال وفدنا إلى معاوية بن أبي سفيان"], [31, "قال دخل النبي صلى الله عليه وسلم مكة"], [34, "يقول كتب علي بن أبي طالب الصلح بين النبي صلى الله عليه وسلم وبين المشركين"],
  [35, "يقول لما صالح رسول الله صلى الله عليه وسلم أهل الحديبية"], [36, "قال لما أحصر النبي صلى الله عليه وسلم عند البيت صالحه أهل مكة"], [37, "صالحوا النبي صلى الله عليه وسلم"], [38, "قال قام سهل بن حنيف يوم صفين فقال"], [39, "يقول بصفين"],
  [41, "اتهموا رأيكم على دينكم"], [43, "قال كنا عند حذيفة فقال رجل"], [44, "أن رسول الله صلى الله عليه وسلم أفرد يوم أحد في سبعة"], [45, "يسأل عن جرح"],
  [49, "هذا ما حدثنا أبو هريرة"], [50, "قال بينما رسول الله صلى الله عليه وسلم يصلي عند البيت"], [52, "قال استقبل رسول الله صلى الله عليه وسلم البيت فدعا على ستة نفر"], [53, "أنها قالت لرسول الله صلى الله عليه وسلم يا رسول الله هل أتى عليك يوم"],
  [55, "يقول أبطأ جبريل على رسول الله صلى الله عليه وسلم"], [56, "يقول اشتكى رسول الله صلى الله عليه وسلم فلم يقم ليلتين"], [59, "قيل"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [1, 4, 7, 8, 10, 12, 16, 18, 20, 21, 23, 24, 29, 32, 33, 40, 42, 47, 48, 51, 57, 58]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-120.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-120.json");
