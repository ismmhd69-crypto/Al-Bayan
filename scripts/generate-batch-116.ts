import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-116.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "narration", "dialogue", "reference_only", "dialogue", "dialogue", "narration", "narration", "companion_words", "companion_words",
  "dialogue", "reference_only", "companion_words", "reference_only", "companion_words", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only",
  "dialogue", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "reference_only", "companion_words", "reference_only", "prophet_words",
  "reference_only", "dialogue", "dialogue", "dialogue", "companion_words", "reference_only", "companion_words", "dialogue", "reference_only", "reference_only",
  "prophet_words", "reference_only", "prophet_words", "reference_only", "reference_only", "prophet_words", "prophet_words", "reference_only", "reference_only", "reference_only",
  "companion_words", "companion_words", "reference_only", "reference_only", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "dialogue",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [1, "قال دخل النبي صلى الله عليه وسلم"], [2, "قال مرضت فأرسلت إلى النبي صلى الله عليه وسلم"], [4, "قال عادني النبي صلى الله عليه وسلم"], [5, "أن النبي صلى الله عليه وسلم دخل على سعد يعوده"],
  [6, "قالوا مرض سعد بمكة فأتاه رسول الله صلى الله عليه وسلم يعوده"], [7, "فقال مرض سعد بمكة فأتاه النبي صلى الله عليه وسلم يعوده"], [8, "لو أن الناس"], [9, "قال أصبت أرضا من أرض خيبر فأتيت رسول الله صلى الله عليه وسلم"],
  [10, "قال سألت عبد الله بن أبي أوفى هل أوصى رسول الله"], [12, "قالت ما ترك رسول الله صلى الله عليه وسلم"], [14, "قال ذكروا عند عائشة أن عليا كان وصيا"], [15, "قال قال ابن عباس يوم الخميس"],
  [16, "قال لما حضر رسول الله صلى الله عليه وسلم"], [20, "قال كانت ثقيف حلفاء لبني عقيل"], [22, "أن النبي صلى الله عليه وسلم رأى شيخا يهادى بين ابنيه"], [23, "أن النبي صلى الله عليه وسلم أدرك شيخا يمشي بين ابنيه"],
  [27, "قال سمع النبي صلى الله عليه وسلم عمر وهو يحلف بأبيه"], [29, "قال قال رسول الله صلى الله عليه وسلم"], [31, "قال أتيت النبي صلى الله عليه وسلم في رهط"], [32, "قال أرسلني أصحابي إلى رسول الله صلى الله عليه وسلم"],
  [33, "قال كنا عند أبي موسى فدعا بمائدته"], [34, "كان بين هذا الحى"], [36, "قال دخلت على أبي موسى وهو يأكل لحم دجاج"], [37, "قال أتينا رسول الله صلى الله عليه وسلم نستحمله"],
  [40, "أنه سمع النبي صلى الله عليه وسلم يقول ذلك"], [42, "قال قال لي رسول الله صلى الله عليه وسلم"], [45, "قال قال رسول الله صلى الله عليه وسلم"], [46, "عن النبي صلى الله عليه وسلم قال"],
  [50, "قال لما قفل النبي صلى الله عليه وسلم من حنين"], [51, "قال ذكر عند ابن عمر عمرة رسول الله صلى الله عليه وسلم"], [54, "قال لطمت مولى لنا فهربت"], [55, "قال عجل شيخ فلطم خادما له"],
  [56, "قال كنا نبيع البز في دار سويد بن مقرن"], [57, "قال قال لي محمد بن المنكدر ما اسمك"], [59, "قال أبو مسعود البدري كنت أضرب غلاما لي بالسوط"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 3, 11, 13, 17, 18, 19, 21, 24, 25, 26, 28, 30, 35, 38, 39, 41, 43, 44, 47, 48, 49, 52, 53, 58]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-116.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-116.json");
