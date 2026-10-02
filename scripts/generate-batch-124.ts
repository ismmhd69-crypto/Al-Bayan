import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-124.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "reference_only", "reference_only", "reference_only", "reference_only", "prophet_words", "prophet_words", "prophet_words", "reference_only", "reference_only",
  "prophet_words", "reference_only", "prophet_words", "prophet_words", "dialogue", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only",
  "prophet_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "prophet_words", "reference_only", "companion_words", "dialogue",
  "dialogue", "prophet_words", "companion_words", "reference_only", "companion_words", "reference_only", "reference_only", "reference_only", "companion_words", "reference_only",
  "reference_only", "dialogue", "companion_words", "dialogue", "companion_words", "companion_words", "reference_only", "reference_only", "companion_words", "reference_only",
  "companion_words", "reference_only", "prophet_words", "reference_only", "reference_only", "companion_words", "reference_only", "reference_only", "companion_words", "companion_words",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "قال سألت رسول الله صلى الله عليه وسلم عن صيد المعراض"], [5, "قال نهى النبي صلى الله عليه وسلم عن أكل"], [6, "يقول نهى رسول الله صلى الله عليه وسلم عن أكل"], [7, "نهى عن أكل كل ذي ناب"], [10, "قال نهى رسول الله صلى الله عليه وسلم عن كل ذي ناب"],
  [12, "أن رسول الله صلى الله عليه وسلم نهى عن كل ذي ناب"], [13, "قال نهى رسول الله صلى الله عليه وسلم"], [14, "يقول بعثنا رسول الله صلى الله عليه وسلم"], [15, "يقول في جيش الخبط"], [16, "قال بعثنا النبي صلى الله عليه وسلم"],
  [17, "قال بعث رسول الله صلى الله عليه وسلم سرية"], [18, "يقول بعث رسول الله صلى الله عليه وسلم سرية"], [20, "قال حرم رسول الله صلى الله عليه وسلم لحوم الحمر"], [21, "قال سألت عبد الله بن أبي أوفى عن لحوم الحمر"], [22, "يقول أصابتنا مجاعة ليالي خيبر"],
  [23, "يقولان أصبنا حمرا فطبخناها"], [24, "قال قال البراء أصبنا يوم خيبر حمرا"], [25, "يقول نهينا عن لحوم الحمر الأهلية"], [26, "قال أمرنا رسول الله صلى الله عليه وسلم أن نلقي"], [28, "قال لا أدري إنما نهى عنه رسول الله صلى الله عليه وسلم"],
  [29, "قال لما فتح رسول الله صلى الله عليه وسلم خيبر"], [30, "قال لما كان يوم خيبر جاء جاء"], [31, "أن رسول الله صلى الله عليه وسلم نهى يوم خيبر"], [32, "يقول أكلنا زمن خيبر الخيل"], [34, "قالت نحرنا فرسا على عهد رسول الله صلى الله عليه وسلم"],
  [38, "قال قال لي الشعبي أرأيت حديث الحسن"], [41, "دخل مع رسول الله صلى الله عليه وسلم على ميمونة"], [42, "يقول أهدت خالتي أم حفيد"], [43, "قال دعانا عروس بالمدينة"], [44, "قال سألت جابرا عن الضب"],
  [45, "قال غزونا مع رسول الله صلى الله عليه وسلم سبع غزوات"], [48, "قال مررنا فاستنفجنا أرنبا"], [50, "قال رأى عبد الله بن المغفل رجلا من أصحابه"], [52, "قال نهى رسول الله صلى الله عليه وسلم عن الخذف"], [55, "قال دخلت مع جدي أنس بن مالك"],
  [58, "قال مر ابن عمر بنفر"], [59, "قال مر ابن عمر بفتيان"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [1, 2, 3, 4, 8, 9, 11, 19, 27, 33, 35, 36, 37, 39, 40, 46, 47, 49, 51, 53, 54, 56, 57]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-124.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-124.json");
