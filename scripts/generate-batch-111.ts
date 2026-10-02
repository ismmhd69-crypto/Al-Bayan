import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-111.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "dialogue", "companion_words", "companion_words", "companion_words", "dialogue", "dialogue", "dialogue", "dialogue", "reference_only",
  "dialogue", "reference_only", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only",
  "dialogue", "reference_only", "companion_words", "dialogue", "narration", "reference_only", "dialogue", "reference_only", "dialogue", "reference_only",
  "dialogue", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "reference_only",
  "prophet_words", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only",
  "companion_words", "dialogue", "prophet_words", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "دخلت أنا وأبو سلمة بن عبد الرحمن"],
  [1, "دخلت أنا وأبو سلمة على فاطمة بنت قيس"],
  [2, "قالت طلقني زوجي ثلاثا"],
  [3, "تزوج يحيى بن سعيد بن العاص"],
  [4, "أنها قالت ما لفاطمة خير"],
  [5, "قال عروة بن الزبير لعائشة"],
  [6, "قالت قلت يا رسول الله زوجي طلقني ثلاثا"],
  [7, "كتب إلى عمر بن عبد الله"],
  [8, "اجتمعا عند أبي هريرة"],
  [10, "قالت زينب دخلت على أم حبيبة"],
  [14, "تحدث عن النبي صلى الله عليه وسلم بمثل حديث الليث"],
  [17, "من الأنصار جاء إلى النبي صلى الله عليه وسلم"],
  [18, "قال سئلت عن المتلاعنين"],
  [20, "قال رسول الله صلى الله عليه وسلم للمتلاعنين"],
  [22, "قال لم يفرق المصعب بين المتلاعنين"],
  [23, "لاعن امرأته على عهد رسول الله"],
  [24, "قال لاعن رسول الله صلى الله عليه وسلم"],
  [26, "قال إنا ليلة الجمعة في المسجد"],
  [28, "أنه قال ذكر التلاعن عند رسول الله"],
  [30, "قال يا رسول الله أرأيت الرجل يجد مع امرأته"],
  [31, "قال قال سعد بن عبادة يا رسول الله"],
  [33, "قال جاء رجل من بني فزارة إلى النبي"],
  [34, "فقال يا رسول الله ولدت امرأتي غلاما أسود"],
  [35, "أنصلى الله عليه وسلم فقال يا رسول الله"],
  [40, "من أعتق شقيصا من مملوك فهو حر"],
  [42, "أن بريرة جاءت عائشة تستعينها"],
  [43, "أنها قالت جاءت بريرة إلى"],
  [44, "قالت دخلت على بريرة"],
  [46, "قالت كان في بريرة ثلاث قضيات"],
  [47, "أنها اشترت بريرة من أناس من الأنصار"],
  [48, "أرادت أن تشتري، بريرة"],
  [50, "قالت كان زوج بريرة عبدا"],
  [51, "أنها قالت كان في بريرة ثلاث سنن"],
  [52, "أن رسول الله صلى الله عليه وسلم نهى عن بيع الولاء"],
  [54, "من تولى قوما بغير إذن مواليه"],
  [55, "قال رسول الله صلى الله عليه وسلم"],
  [57, "أن رسول الله صلى الله عليه وسلم نهى عن الملامسة"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [9, 11, 12, 13, 15, 16, 19, 21, 25, 27, 29, 32, 36, 37, 38, 39, 41, 45, 49, 53, 56, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(14, "فإنها تحد عليه أربعة أشهر وعشرا");
setTail(20, "قال زهير في روايته");
setTail(34, "وزاد في آخر الحديث");
setTail(52, "قال مسلم الناس كلهم عيال");
setTail(54, "وحدثنيه إبراهيم بن دينار");
setTail(55, "وفي رواية ابن أبي شيبة");

fs.writeFileSync("data/hadith-split/marks-111.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-111.json");
