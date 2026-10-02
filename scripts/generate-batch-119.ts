import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-119.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");
const kinds: Kind[] = [
  "reference_only", "reference_only", "reference_only", "dialogue", "dialogue", "reference_only", "narration", "prophet_words", "dialogue", "prophet_words",
  "companion_words", "companion_words", "reference_only", "prophet_words", "reference_only", "companion_words", "companion_words", "reference_only", "narration", "reference_only",
  "reference_only", "dialogue", "dialogue", "dialogue", "reference_only", "reference_only", "dialogue", "prophet_words", "reference_only", "narration",
  "narration", "narration", "narration", "narration", "dialogue", "dialogue", "companion_words", "reference_only", "companion_words", "narration",
  "companion_words", "reference_only", "reference_only", "companion_words", "companion_words", "companion_words", "reference_only", "reference_only", "dialogue", "dialogue",
  "dialogue", "companion_words", "companion_words", "dialogue", "companion_words", "reference_only", "dialogue", "companion_words", "reference_only", "reference_only",
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); return text.slice(map[p], map[p] + Math.min(100, text.length - map[p])); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
const starts: Array<[number, string]> = [
  [3, "أنه قال جاء رجل إلى النبي صلى الله عليه وسلم"], [4, "سأل رسول الله صلى الله عليه وسلم عن اللقطة"], [6, "أتى رجل رسول الله صلى الله عليه وسلم"], [7, "سئل رسول الله صلى الله عليه وسلم عن اللقطة الذهب"],
  [8, "سأل النبي صلى الله عليه وسلم عن ضالة الإبل"], [9, "قال سئل رسول الله صلى الله عليه وسلم عن اللقطة"], [10, "خرجت أنا وزيد بن صوحان"], [11, "خرجت مع زيد بن صوحان"],
  [13, "أن رسول الله صلى الله عليه وسلم نهى عن لقطة الحاج"], [15, "قال خرجنا مع رسول الله صلى الله عليه وسلم في غزوة"], [16, "قال كتبت إلى نافع أسأله عن الدعاء"], [18, "قال كان رسول الله صلى الله عليه وسلم إذا بعث أميرا"],
  [21, "قال قال أبو موسى أقبلت إلى النبي صلى الله عليه وسلم"], [22, "أن النبي صلى الله عليه وسلم بعثه ومعاذا إلى اليمن"], [23, "قال بعثني رسول الله صلى الله عليه وسلم ومعاذا إلى اليمن"], [26, "أن رسول الله صلى الله عليه وسلم كان في بعض أيامه التي لقي فيها العدو"],
  [27, "دعا رسول الله صلى الله عليه وسلم"], [29, "مقتولة فأنكر رسول الله صلى الله عليه وسلم"], [30, "قال وجدت امرأة مقتولة"], [31, "أن رسول الله صلى الله عليه وسلم حرق نخل بني النضير"],
  [32, "أن رسول الله صلى الله عليه وسلم قطع نخل بني النضير"], [33, "قال حرق رسول الله صلى الله عليه وسلم نخل بني النضير"], [34, "قال أخذ أبي من الخمس سيفا فأتى به النبي"], [35, "قال نزلت في أربع آيات أصبت سيفا"],
  [36, "أنه نزلت فيه آيات من القرآن"], [38, "قال بعث النبي صلى الله عليه وسلم سرية"], [39, "أن رسول الله صلى الله عليه وسلم بعث سرية"], [40, "قال بعث رسول الله صلى الله عليه وسلم سرية إلى نجد"],
  [43, "قال نفلنا رسول الله صلى الله عليه وسلم نفلا"], [44, "نفل رسول الله صلى الله عليه وسلم سرية"], [45, "أن رسول الله صلى الله عليه وسلم قد كان ينفل بعض من يبعث"], [48, "قال خرجنا مع رسول الله صلى الله عليه وسلم عام حنين"],
  [49, "بينا أنا واقف"], [50, "قال قتل رجل من حمير رجلا من العدو"], [51, "قال خرجت مع من خرج مع زيد بن حارثة"], [52, "قال غزونا مع رسول الله صلى الله عليه وسلم هوازن"],
  [53, "غزونا فزارة"], [54, "قال كانت أموال بني النضير مما أفاء الله"], [56, "أرسل إلى عمر بن الخطاب فجئته حين تعالى النهار"], [57, "أرسل إلى عمر بن الخطاب فقال"],
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [0, 1, 2, 5, 12, 14, 17, 19, 20, 24, 25, 28, 37, 41, 42, 46, 47, 55, 58, 59]) { marks[i].start = null; marks[i].kind = "reference_only"; }
fs.writeFileSync("data/hadith-split/marks-119.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-119.json");
