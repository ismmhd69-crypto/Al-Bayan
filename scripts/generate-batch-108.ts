import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-108.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "companion_words", "prophet_words", "dialogue", "dialogue", "prophet_words", "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words",
  "prophet_words", "reference_only", "narration", "narration", "narration", "reference_only", "reference_only", "prophet_words", "reference_only", "prophet_words",
  "reference_only", "prophet_words", "prophet_words", "reference_only", "prophet_words", "prophet_words", "dialogue", "reference_only", "dialogue", "prophet_words",
  "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue", "dialogue", "companion_words",
  "dialogue", "companion_words", "companion_words", "reference_only", "unclear", "companion_words", "dialogue", "companion_words", "companion_words", "dialogue",
  "prophet_words", "prophet_words", "reference_only", "prophet_words", "companion_words", "dialogue", "companion_words", "dialogue", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "سمع علي بن أبي طالب"],
  [1, "أن النبي صلى الله عليه وسلم نهى"],
  [2, "أنه سمع ابن عباس"],
  [3, "أنه سمع علي بن أبي طالب"],
  [4, "أن رسول الله صلى الله عليه وسلم نهى"],
  [6, "أن رسول الله صلى الله عليه وسلم نهى"],
  [7, "نهى رسول الله صلى الله عليه وسلم أن يجمع"],
  [9, "نهى رسول الله صلى الله عليه وسلم أن تنكح"],
  [10, "نهى رسول الله صلى الله عليه وسلم أن يجمع"],
  [12, "أن النبي صلى الله عليه وسلم تزوج ميمونة"],
  [13, "تزوج رسول الله صلى الله عليه وسلم ميمونة"],
  [14, "أن رسول الله صلى الله عليه وسلم تزوجها"],
  [17, "أن النبي صلى الله عليه وسلم نهى"],
  [19, "أن رسول الله صلى الله عليه وسلم نهى عن الشغار"],
  [21, "أن رسول الله صلى الله عليه وسلم نهى عن الشغار"],
  [22, "نهى رسول الله صلى الله عليه وسلم عن الشغار"],
  [24, "نهى رسول الله صلى الله عليه وسلم عن الشغار"],
  [25, "قال رسول الله صلى الله عليه وسلم"],
  [26, "أن رسول الله صلى الله عليه وسلم قال"],
  [28, "سألت رسول الله صلى الله عليه وسلم"],
  [29, "الثيب أحق بنفسها"],
  [30, "قالت تزوجني رسول الله صلى الله عليه وسلم"],
  [31, "قالت تزوجني النبي صلى الله عليه وسلم"],
  [32, "أن النبي صلى الله عليه وسلم تزوجها"],
  [33, "قالت تزوجها رسول الله صلى الله عليه وسلم"],
  [34, "قالت تزوجني رسول الله صلى الله عليه وسلم"],
  [36, "قال كنت عند النبي صلى الله عليه وسلم"],
  [37, "قال جاء رجل إلى النبي صلى الله عليه وسلم"],
  [38, "قالت يا رسول الله جئت أهب لك نفسي"],
  [39, "أنه قال سألت عائشة زوج النبي"],
  [40, "أن النبي صلى الله عليه وسلم رأى"],
  [41, "قال عبد الرحمن تزوجت امرأة"],
  [42, "تزوج امرأة على وزن نواة"],
  [45, "قال ما رأيت رسول الله صلى الله عليه وسلم"],
  [46, "يقول ما أولم رسول الله صلى الله عليه وسلم"],
  [47, "قال لما تزوج النبي صلى الله عليه وسلم"],
  [48, "قال أنس أصبح رسول الله صلى الله عليه وسلم"],
  [49, "قال تزوج رسول الله صلى الله عليه وسلم"],
  [50, "إذا دعا أحدكم أخاه فليجب"],
  [51, "قال رسول الله صلى الله عليه وسلم"],
  [53, "قال رسول الله صلى الله عليه وسلم"],
  [54, "أنه كان يقول بئس الطعام"],
  [55, "قال قلت للزهري يا أبا بكر"],
  [56, "قال شر الطعام طعام الوليمة"],
  [57, "طلق امرأته فتزوجها"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [5, 8, 11, 15, 16, 18, 20, 23, 27, 35, 43, 52, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
marks[44].start = null;
setTail(0, "بمثل حديث يحيى بن يحيى");
setTail(7, "قال ابن شهاب فنرى");
setTail(12, "زاد ابن نمير");
setTail(17, "زاد عمرو في روايته");
setTail(22, "زاد ابن نمير");
setTail(34, "قال وكانت عائشة تستحب");
setTail(51, "ولم يذكر ابن المثنى");
setTail(55, "ثم ذكر بمثل حديث مالك");

fs.writeFileSync("data/hadith-split/marks-108.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-108.json");
