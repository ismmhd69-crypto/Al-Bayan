import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-117.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "dialogue", "reference_only", "reference_only", "dialogue", "reference_only", "reference_only", "prophet_words", "reference_only", "reference_only",
  "narration", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "reference_only", "dialogue", "companion_words", "companion_words",
  "dialogue", "prophet_words", "reference_only", "reference_only", "narration", "dialogue", "companion_words", "narration", "reference_only", "companion_words",
  "reference_only", "narration", "reference_only", "dialogue", "reference_only", "narration", "companion_words", "reference_only", "dialogue", "reference_only",
  "prophet_words", "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "dialogue", "dialogue", "narration",
  "companion_words", "companion_words", "reference_only", "reference_only", "companion_words", "companion_words", "reference_only", "reference_only", "companion_words", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [1, "قال كنت أضرب غلاما لي فسمعت من خلفي صوتا"], [4, "قال مررنا بأبي ذر بالربذة"], [7, "قال رسول الله صلى الله عليه وسلم"], [10, "أعتق ستة مملوكين له عند موته"],
  [13, "أنهما قالا خرج عبد الله بن سهل"], [14, "انطلقا قبل خيبر"], [17, "خرجا إلى خيبر في زمان رسول الله صلى الله عليه وسلم"], [18, "من الأنصار من بني حارثة يقال له عبد الله"],
  [19, "أنه أخبره أن نفرا منهم انطلقوا إلى خيبر"], [20, "خرجا إلى خيبر من جهد أصابهم"], [21, "أن رسول الله صلى الله عليه وسلم أقر القسامة"], [24, "قال قدم على رسول الله صلى الله عليه وسلم قوم من عكل"],
  [25, "قال كنت جالسا خلف عمر بن عبد العزيز"], [26, "قال قدم على رسول الله صلى الله عليه وسلم ثمانية نفر"], [27, "قال أتى رسول الله صلى الله عليه وسلم نفر من عرينة"], [29, "قال إنما سمل النبي صلى الله عليه وسلم أعين أولئك"],
  [31, "قتل جارية من الأنصار"], [33, "وجد رأسها قد رض"], [35, "عض رجل ذراعه"], [36, "قال غزوت مع النبي صلى الله عليه وسلم غزوة تبوك"],
  [38, "جرحت إنسانا"], [40, "قال قام فينا رسول الله صلى الله عليه وسلم فقال"], [44, "عن النبي صلى الله عليه وسلم أنه قال"], [45, "قال لما كان ذلك اليوم قعد على بعيره"],
  [47, "قال خطبنا رسول الله صلى الله عليه وسلم يوم النحر"], [48, "إني لقاعد مع النبي صلى الله عليه وسلم إذ جاء رجل"], [49, "رمت إحداهما الأخرى"], [50, "قال قضى رسول الله صلى الله عليه وسلم في جنين امرأة"],
  [51, "قال اقتتلت امرأتان"], [54, "قال استشار عمر بن الخطاب الناس في إملاص المرأة"], [55, "قالت كان رسول الله صلى الله عليه وسلم يقطع السارق"], [58, "قالت لم تقطع يد سارق في عهد رسول الله"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 2, 3, 5, 6, 8, 9, 11, 12, 15, 16, 22, 23, 28, 30, 32, 34, 37, 39, 41, 42, 43, 46, 52, 53, 56, 57, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-117.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-117.json");
