import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-158.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "dialogue", "narration", "dialogue", "dialogue", "prophet_words", "prophet_words", "dialogue", "prophet_words", "prophet_words", "prophet_words",
  "companion_words", "prophet_words", "narration", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "dialogue", "prophet_words",
  "dialogue", "dialogue", "companion_words", "dialogue", "narration", "dialogue", "dialogue", "prophet_words", "dialogue", "companion_words",
  "narration", "prophet_words", "companion_words", "dialogue", "dialogue", "companion_words", "companion_words", "dialogue", "narration", "dialogue",
  "narration", "narration", "prophet_words", "prophet_words", "prophet_words", "dialogue", "prophet_words", "dialogue", "prophet_words", "companion_words",
  "companion_words", "prophet_words", "companion_words", "prophet_words", "prophet_words", "companion_words", "dialogue", "dialogue", "dialogue", "prophet_words",
];
const marks: any[] = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670\u200e\u200f]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text); const p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { marks[i].tail_start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [0, "أتى النبي صلى الله عليه وسلم وعنده أم سلمة"], [1, "يقول صبح رسول الله صلى الله عليه وسلم خيبر"], [2, "قال قلت للنبي صلى الله عليه وسلم وأنا في الغار"], [3, "قال أتت امرأة النبي صلى الله عليه وسلم"], [4, "قالت شخص بصر النبي صلى الله عليه وسلم"],
  [5, "أن النبي صلى الله عليه وسلم صعد أحدا"], [6, "بينا نحن عند رسول الله صلى الله عليه وسلم"], [7, "قال صعد النبي صلى الله عليه وسلم إلى أحد"], [8, "قال صعد النبي صلى الله عليه وسلم أحدا"], [9, "قال النبي صلى الله عليه وسلم لعلي"],
  [10, "قال ذهبت أسأل الزهري عن حديث المخزومية"], [11, "حدث عن النبي صلى الله عليه وسلم أنه كان يأخذه"], [12, "قال كان الرجل في حياة النبي صلى الله عليه وسلم"], [13, "أن النبي صلى الله عليه وسلم قال لها"], [14, "قال قال النبي صلى الله عليه وسلم لأهل نجران"],
  [15, "سمعت النبي صلى الله عليه وسلم على المنبر"], [16, "عن النبي صلى الله عليه وسلم أنه كان يأخذه"], [17, "قال رأيت النبي صلى الله عليه وسلم والحسن"], [18, "قال ضمني النبي صلى الله عليه وسلم"], [19, "أن النبي صلى الله عليه وسلم نعى زيدا"],
  [20, "قالت قال رسول الله صلى الله عليه وسلم يوما"], [21, "أن رسول الله صلى الله عليه وسلم لما كان في مرضه"], [22, "قال كان الناس يتحرون بهداياهم"], [23, "قالت الأنصار اقسم بيننا"], [24, "قال رأى النبي صلى الله عليه وسلم النساء"],
  [25, "قال جاءت امرأة من الأنصار"], [26, "من الأنصار قال يا رسول الله"], [27, "يقول قال النبي صلى الله عليه وسلم للأنصار"], [28, "قال دعا النبي صلى الله عليه وسلم الأنصار"], [29, "يقول مر أبو بكر والعباس"],
  [30, "يقول خرج رسول الله صلى الله عليه وسلم"], [31, "يقول أهديت للنبي صلى الله عليه وسلم حلة حرير"], [32, "قال كنت جالسا في مسجد المدينة"], [33, "قالت استأذنت هالة بنت خويلد"], [34, "قالت جاءت هند بنت عتبة"],
  [35, "قال لما بنيت الكعبة"], [36, "قال كانوا يرون أن العمرة"], [37, "يقول أتيت النبي صلى الله عليه وسلم"], [38, "قال انشق القمر"], [39, "حبيبة وأم سلمة ذكرتا"],
  [40, "قالت قدمت من أرض الحبشة"], [41, "قال كنا نسلم على النبي صلى الله عليه وسلم"], [42, "قال النبي صلى الله عليه وسلم حين مات النجاشي"], [43, "أن رسول الله صلى الله عليه وسلم نعى"], [44, "قال قال رسول الله صلى الله عليه وسلم حين أراد حنينا"],
  [45, "قال للنبي صلى الله عليه وسلم ما أغنيت عن عمك"], [46, "أنه سمع النبي صلى الله عليه وسلم"], [47, "أن عبادة بن الصامت"], [48, "أن النبي صلى الله عليه وسلم قال لها"], [49, "قال كنت مع النبي صلى الله عليه وسلم في الغار"],
  [50, "أنها قالت لما قدم رسول الله صلى الله عليه وسلم"], [51, "قال لما قدم رسول الله صلى الله عليه وسلم"], [52, "قال باع شريك لي دراهم"], [53, "قال قال النبي صلى الله عليه وسلم يوم بدر"], [54, "قال قال النبي صلى الله عليه وسلم يوم بدر"],
  [55, "يقول أصيب حارثة يوم بدر"], [56, "قال قال لنا رسول الله صلى الله عليه وسلم"], [57, "قال قال لنا رسول الله صلى الله عليه وسلم"], [58, "قال جاء جبريل إلى النبي صلى الله عليه وسلم"], [59, "أن النبي صلى الله عليه وسلم قال يوم بدر"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(0, "قال فقلت لأبي عثمان");
setTail(12, "قال سالم");
setTail(16, "أو كما قال");
setTail(31, "رواه قتادة");
setTail(32, "وقال لي خليفة");
setTail(37, "زاد بيان");
setTail(38, "وتابعه محمد بن مسلم");
setTail(40, "قال الحميدي");
setTail(46, "حدثنا إبراهيم بن حمزة");
fs.writeFileSync("data/hadith-split/marks-158.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-158.json");
