import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-157.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "dialogue", "dialogue", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "narration",
  "narration", "narration", "dialogue", "prophet_words", "companion_words", "prophet_words", "prophet_words", "companion_words", "prophet_words", "prophet_words",
  "prophet_words", "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "companion_words", "prophet_words", "narration",
  "dialogue", "dialogue", "dialogue", "companion_words", "narration", "dialogue", "prophet_words", "prophet_words", "dialogue", "prophet_words",
  "dialogue", "dialogue", "narration", "prophet_words", "companion_words", "companion_words", "dialogue", "prophet_words", "narration", "companion_words",
  "prophet_words", "prophet_words", "unclear", "prophet_words", "dialogue", "dialogue", "companion_words", "prophet_words", "narration", "narration",
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
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { marks[i].tail_start = locate(batch[i].text_original, needle); }

const starts: Array<[number, string]> = [
  [0, "سألت النبي صلى الله عليه وسلم عن التفات الرجل"], [1, "إني أراك تحب الغنم"], [2, "أنه سمع النبي صلى الله عليه وسلم يخطب على المنبر"],
  [3, "أشار رسول الله صلى الله عليه وسلم بيده نحو اليمن"], [4, "أمر النبي صلى الله عليه وسلم بقتل الأبتر"], [5, "رفعه قال"],
  [6, "حدثنا رسول الله صلى الله عليه وسلم وهو الصادق المصدوق"], [7, "لأهون أهل النار عذابا"], [8, "قام رسول الله صلى الله عليه وسلم في الناس"],
  [9, "قال كنا مع النبي صلى الله عليه وسلم في دعوة"], [10, "قال دخل النبي صلى الله عليه وسلم البيت"], [11, "أن النبي صلى الله عليه وسلم لما رأى الصور"],
  [12, "وذكروا له الدجال بين عينيه مكتوب"], [13, "أن رسول الله صلى الله عليه وسلم أمر بقتل الوزغ"], [14, "قال لما نزلت"],
  [15, "قال أتي النبي صلى الله عليه وسلم يوما بلحم"], [16, "أن رسول الله صلى الله عليه وسلم طلع له أحد"], [17, "قال لقيني"],
  [18, "قال كان النبي صلى الله عليه وسلم يعوذ الحسن والحسين"], [19, "سمعت النبي صلى الله عليه وسلم"], [20, "أن النبي صلى الله عليه وسلم لما مر بالحجر"],
  [21, "قالت بينما أنا مع عائشة جالستان"], [22, "قال قال رسول الله صلى الله عليه وسلم ليلة أسري به"], [23, "أن النبي صلى الله عليه وسلم لما قدم المدينة وجدهم يصومون"],
  [24, "قال قسم النبي صلى الله عليه وسلم قسما"], [25, "قال استب رجل من المسلمين ورجل من اليهود"], [26, "قال خرج علينا النبي صلى الله عليه وسلم يوما"],
  [27, "قال لما نزلت"], [28, "أن نبي الله صلى الله عليه وسلم حدثهم عن ليلة أسري"], [29, "قال لا والله ما قال النبي صلى الله عليه وسلم لعيسى"],
  [30, "قالا لما نزل برسول الله صلى الله عليه وسلم"], [31, "عام حج على المنبر"], [32, "قالت سألت رسول الله صلى الله عليه وسلم عن الط"], [33, "سمعت رجلا"],
  [34, "قال عبد الله كأني أنظر إلى النبي"], [35, "يقول قدم وفد عبد القيس"], [36, "قال سمعت رسول الله صلى الله عليه وسلم يقول"], [37, "أن رسول الله صلى الله عليه وسلم قال على المنبر"],
  [38, "قال لنا ابن عباس ألا أخبركم بإسلام أبي ذر"], [39, "قال لما نزلت"], [40, "قالت استأذن حسان النبي"], [41, "قال كان النبي صلى الله عليه وسلم في السوق"],
  [42, "أن رسول الله صلى الله عليه وسلم دخل عليها مسرورا"], [43, "قال لم يكن النبي صلى الله عليه وسلم فاحشا"], [44, "كيف كانت صلاة رسول الله"],
  [45, "قال عطش الناس يوم الحديبية"], [46, "توفي وعليه دين"], [47, "الصفة كانوا أناسا فقراء"], [48, "قال أصاب أهل المدينة قحط"],
  [49, "قال أتينا أبا هريرة"], [50, "أن النبي صلى الله عليه وسلم خرج يوما"], [51, "قال أشرف النبي صلى الله عليه وسلم"],
  [53, "يقول سمعت الصادق"], [54, "قال شكونا إلى رسول الله"], [55, "أن النبي صلى الله عليه وسلم افتقد ثابت بن قيس"], [56, "قرأ رجل الكهف"],
  [57, "عن جابر بن سمرة"], [58, "قال خرج رسول الله صلى الله عليه وسلم في مرضه"], [59, "أخرج النبي صلى الله عليه وسلم ذات يوم"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(57, "وذكر وقال");
fs.writeFileSync("data/hadith-split/marks-157.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-157.json");
