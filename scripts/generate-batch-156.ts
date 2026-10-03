import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-156.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "narration", "prophet_words", "dialogue", "prophet_words", "dialogue", "dialogue", "prophet_words", "prophet_words", "prophet_words", "companion_words",
  "dialogue", "dialogue", "dialogue", "prophet_words", "prophet_words", "dialogue", "companion_words", "dialogue", "prophet_words", "prophet_words",
  "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue", "prophet_words", "prophet_words", "prophet_words",
  "dialogue", "prophet_words", "dialogue", "dialogue", "prophet_words", "dialogue", "dialogue", "dialogue", "prophet_words", "dialogue",
  "prophet_words", "dialogue", "prophet_words", "dialogue", "prophet_words", "prophet_words", "prophet_words", "dialogue", "prophet_words", "dialogue",
  "dialogue", "prophet_words", "dialogue", "dialogue", "prophet_words", "prophet_words", "dialogue", "narration", "prophet_words", "prophet_words",
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
function setStart(i: number, needle: string) {
  try { marks[i].start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Index ${i}: ${(error as Error).message}`); }
}
function setTail(i: number, needle: string) {
  try { marks[i].tail_start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Tail ${i}: ${(error as Error).message}`); }
}

const starts: Array<[number, string]> = [
  [0, "قال كان النبي صلى الله عليه وسلم يدعو في القنوت"],
  [1, "يقول دعا رسول الله صلى الله عليه وسلم يوم الأحزاب"],
  [2, "قال كان النبي صلى الله عليه وسلم يصلي في ظل الكعبة"],
  [3, "أن رسول الله صلى الله عليه وسلم كتب إلى قيصر"],
  [4, "قدم طفيل بن عمرو الدوسي وأصحابه على النبي صلى الله عليه وسلم"],
  [5, "أن رسول الله صلى الله عليه وسلم كتب إلى قيصر يدعوه إلى الإسلام"],
  [6, "فقرأته أن رسول الله صلى الله عليه وسلم في بعض أيامه"],
  [7, "قال كان بالمدينة فزع"],
  [8, "قال فزع الناس"],
  [9, "حملت على فرس في سبيل الله"],
  [10, "حمل على فرس في سبيل الله"],
  [11, "قال غزوت مع رسول الله صلى الله عليه وسلم غزوة تبوك"],
  [12, "أنها قالت يا رسول الله"],
  [13, "قال صبح النبي صلى الله عليه وسلم خيبر"],
  [14, "قال كان النبي صلى الله عليه وسلم إذا قفل"],
  [15, "حمل على فرس في سبيل الله"],
  [16, "حملت على فرس في سبيل الله فابتاعه"],
  [17, "قدموا على النبي صلى الله عليه وسلم فاجتووا المدينة"],
  [18, "قال ما حجبني النبي صلى الله عليه وسلم منذ أسلمت"],
  [19, "أن النبي صلى الله عليه وسلم بعث معاذا وأبا موسى إلى اليمن"],
  [20, "قال خرجت من المدينة ذاهبا نحو الغابة"],
  [21, "أن رسول الله صلى الله عليه وسلم دخل عام الفتح"],
  [22, "استأذنوا رسول الله صلى الله عليه وسلم فقالوا"],
  [23, "قال أتي النبي صلى الله عليه وسلم بمال من البحرين"],
  [24, "قال جاء رجل إلى النبي صلى الله عليه وسلم"],
  [25, "قال خطب رسول الله صلى الله عليه وسلم فقال"],
  [26, "فصاح النبي صلى الله عليه وسلم فقال"],
  [27, "أخذ تمرة من تمر الصدقة"],
  [28, "قال قام فينا النبي صلى الله عليه وسلم فذكر الغلول"],
  [29, "قال قال النبي صلى الله عليه وسلم يوم فتح مكة"],
  [30, "قال جاء مجاشع بأخيه مجالد بن مسعود إلى النبي صلى الله عليه وسلم"],
  [31, "أن النبي صلى الله عليه وسلم كان إذا قفل كبر ثلاثا"],
  [32, "قال كنت مع النبي صلى الله عليه وسلم في سفر"],
  [33, "يقول قدم وفد عبد القيس فقالوا يا رسول الله"],
  [34, "قال قام النبي صلى الله عليه وسلم خطيبا"],
  [35, "قال قال أعرابي للنبي صلى الله عليه وسلم"],
  [36, "أن النبي صلى الله عليه وسلم أهديت له أقبية"],
  [37, "قال بينما رسول الله صلى الله عليه وسلم يقسم غنيمة بالجعرانة"],
  [38, "النبي صلى الله عليه وسلم قال في أسارى بدر"],
  [39, "قال سألت رسول الله صلى الله عليه وسلم"],
  [40, "بينا هو مع رسول الله صلى الله عليه وسلم ومعه الناس"],
  [41, "قال لما كان يوم حنين آثر النبي صلى الله عليه وسلم أناسا في القسمة"],
  [42, "قال أتيت النبي صلى الله عليه وسلم في غزوة تبوك"],
  [43, "قدمت على أمي وهى مشركة"],
  [44, "قال النبي صلى الله عليه وسلم أراه"],
  [45, "أنه خاصمته أروى في حق زعمت أنه انتقصه لها"],
  [46, "قال عبد الله حدثنا رسول الله صلى الله عليه وسلم وهو الصادق المصدوق"],
  [47, "قال مر عمر في المسجد وحسان ينشد"],
  [48, "قال قال النبي صلى الله عليه وسلم لحسان"],
  [49, "سأل النبي صلى الله عليه وسلم كيف يأتيك الوحى"],
  [50, "النبي صلى الله عليه وسلم قال لها"],
  [51, "قال قال رسول الله صلى الله عليه وسلم لجبريل"],
  [52, "زوج النبي صلى الله عليه وسلم حدثته أنها قالت للنبي"],
  [53, "بينا نحن عند رسول الله صلى الله عليه وسلم إذ قال"],
  [54, "قال أهدي للنبي صلى الله عليه وسلم جبة سندس"],
  [55, "عن النبي صلى الله عليه وسلم قال لما مات إبراهيم"],
  [56, "قال قيل لأسامة لو أتيت فلانا فكلمته"],
  [57, "قال ذكر عند النبي صلى الله عليه وسلم رجل نام ليله حتى أصبح"],
  [58, "قال رأيت رسول الله صلى الله عليه وسلم يشير إلى المشرق"],
  [59, "عن النبي صلى الله عليه وسلم أنه صلى صلاة فقال"],
];
for (const [i, needle] of starts) setStart(i, needle);
setTail(13, "تابعه علي");
setTail(36, "تابعه الليث");
setTail(56, "رواه غندر");
setTail(59, "فذكره");

fs.writeFileSync("data/hadith-split/marks-156.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-156.json");
