import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-110.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "companion_words", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "reference_only", "prophet_words", "reference_only",
  "dialogue", "reference_only", "dialogue", "companion_words", "companion_words", "reference_only", "dialogue", "dialogue", "dialogue", "reference_only",
  "dialogue", "dialogue", "reference_only", "reference_only", "companion_words", "dialogue", "dialogue", "companion_words", "companion_words", "dialogue",
  "dialogue", "reference_only", "dialogue", "dialogue", "reference_only", "companion_words", "companion_words", "narration", "companion_words", "companion_words",
  "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue", "companion_words",
  "companion_words", "reference_only", "dialogue", "dialogue", "reference_only", "companion_words", "dialogue", "reference_only", "dialogue", "dialogue",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { const text = batch[i].text_original, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "كان للنبي صلى الله عليه وسلم تسع نسوة"],
  [1, "قالت ما رأيت امرأة"],
  [3, "قالت كنت أغار"],
  [4, "أنها كانت تقول"],
  [5, "قال حضرنا مع ابن عباس جنازة"],
  [8, "قال رسول الله صلى الله عليه وسلم"],
  [10, "أنه طلق امرأة له"],
  [12, "طلق امرأته وهى حائض فسأل عمر"],
  [13, "قال ابن عمر فراجعتها"],
  [14, "أنه طلق امرأته تطليقة وهى حائض"],
  [16, "فسأل عمر النبي صلى الله عليه وسلم عن ذلك"],
  [17, "قال قلت لابن عمر رجل طلق"],
  [18, "قال طلقت امرأتي"],
  [20, "طلق امرأته حائضا فقال"],
  [21, "فقال طلق ابن عمر امرأته"],
  [24, "قال كان الطلاق على عهد رسول الله"],
  [25, "قال لابن عباس أتعلم"],
  [26, "قال لابن عباس هات من هناتك"],
  [27, "أنه كان يقول في الحرام"],
  [28, "قال إذا حرم الرجل"],
  [29, "أن النبي صلى الله عليه وسلم كان يمكث"],
  [30, "قالت كان رسول الله صلى الله عليه وسلم يحب"],
  [32, "قالت لما أمر رسول الله"],
  [33, "كان رسول الله صلى الله عليه وسلم يستأذننا"],
  [35, "قالت عائشة قد خيرنا رسول الله"],
  [36, "قال ما أبالي خيرت امرأتي"],
  [37, "أن رسول الله صلى الله عليه وسلم خير نساءه"],
  [38, "قالت خيرنا رسول الله"],
  [39, "قالت خيرنا رسول الله"],
  [41, "قال دخل أبو بكر يستأذن"],
  [42, "قال لما اعتزل نبي الله"],
  [43, "قال مكثت سنة وأنا أريد"],
  [45, "كنت أريد"],
  [46, "قال لم أزل حريصا"],
  [47, "طلقها البتة وهو غائب"],
  [48, "طلقها ثلاثا ثم انطلق إلى اليمن"],
  [49, "قال كتبت ذلك من فيها كتابا"],
  [50, "أن فاطمة بنت قيس أخبرته"],
  [52, "خرج مع علي بن أبي طالب إلى اليمن"],
  [53, "قال دخلت على فاطمة بنت قيس"],
  [55, "قال دخلنا على فاطمة بنت قيس"],
  [56, "قال كنت مع الأسود بن يزيد"],
  [58, "تقول إن زوجها طلقها ثلاثا"],
  [59, "تقول أرسل إلى زوجي أبو عمرو"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [2, 6, 7, 9, 11, 15, 19, 22, 23, 31, 34, 40, 44, 51, 54, 57]) { marks[i].start = null; marks[i].kind = "reference_only"; }
setTail(2, "وزاد في حديث شريك");
setTail(10, "قال مسلم جود الليث");
setTail(20, "قال لم أسمعه يزيد على ذلك");
setTail(46, "قال قتادة صغت قلوبكما");
setTail(50, "وقال عروة إن عائشة أنكرت");

fs.writeFileSync("data/hadith-split/marks-110.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-110.json");
