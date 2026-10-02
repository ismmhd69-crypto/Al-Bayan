import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
type Spec = { token: string | null; kind: Kind; tail?: string };

const specs: Spec[] = [
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة والمحاقلة", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن المحاقلة والمزابنة", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم أرخص لصاحب العرية", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن بيع الثمر", kind: "prophet_words" },
  { token: "أن النبي صلى الله عليه وسلم رخص في بيع العرايا", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن بيع الثمر", kind: "prophet_words", tail: "وقال سفيان مرة أخرى" },
  { token: "أن رسول الله صلى الله عليه وسلم رخص في العرايا", kind: "prophet_words", tail: "قال موسى بن عقبة" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن بيع الثمار", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى أن تباع ثمرة النخل", kind: "prophet_words", tail: "قال أبو عبد الله" },
  { token: "نهى النبي صلى الله عليه وسلم أن تباع الثمرة", kind: "prophet_words" },
  { token: "عن النبي صلى الله عليه وسلم أنه نهى عن بيع الثمرة", kind: "prophet_words" },
  { token: "أن النبي صلى الله عليه وسلم اشترى طعاما", kind: "narration" },
  { token: "أن رسول الله صلى الله عليه وسلم استعمل رجلا", kind: "dialogue" },
  { token: "أن أيما نخل بيعت", kind: "companion_words", tail: "سمى له نافع" },
  { token: "نهى رسول الله صلى الله عليه وسلم عن المزابنة", kind: "prophet_words" },
  { token: "أنه قال نهى رسول الله صلى الله عليه وسلم", kind: "companion_words" },
  { token: "أن النبي صلى الله عليه وسلم نهى عن بيع ثمر التمر", kind: "dialogue" },
  { token: "كنت عند النبي صلى الله عليه وسلم", kind: "dialogue" },
  { token: "حجم رسول الله صلى الله عليه وسلم أبو طيبة", kind: "narration" },
  { token: "ومن كان غنيا", kind: "companion_words" },
  { token: "جعل رسول الله صلى الله عليه وسلم الشفعة", kind: "prophet_words" },
  { token: "قضى النبي صلى الله عليه وسلم بالشفعة", kind: "prophet_words" },
  { token: null, kind: "reference_only" },
  { token: "لصهيب اتق الله", kind: "dialogue" },
  { token: "أن رسول الله صلى الله عليه وسلم مر بشاة", kind: "dialogue" },
  { token: "قال كان", kind: "narration" },
  { token: "باع النبي صلى الله عليه وسلم المدبر", kind: "companion_words" },
  { token: "باعه رسول الله صلى الله عليه وسلم", kind: "companion_words" },
  { token: "إن الله ورسوله حرم بيع الخمر", kind: "prophet_words", tail: "قال أبو عاصم" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن ثمن الكلب", kind: "prophet_words" },
  { token: "إن رسول الله صلى الله عليه وسلم نهى عن ثمن الدم", kind: "companion_words" },
  { token: "اختلف عبد الله بن شداد", kind: "companion_words" },
  { token: "فقالا سله هل كان أصحاب النبي", kind: "dialogue" },
  { token: null, kind: "reference_only" },
  { token: "نهى النبي صلى الله عليه وسلم عن بيع النخل", kind: "dialogue", tail: "وقال معاذ" },
  { token: "نهي عن بيع النخل", kind: "companion_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن بيع الثمر", kind: "dialogue" },
  { token: "اشترى رسول الله صلى الله عليه وسلم طعاما", kind: "narration" },
  { token: "أن النبي صلى الله عليه وسلم اشترى من يهودي", kind: "narration" },
  { token: "أسلفوا في الثمار", kind: "prophet_words", tail: "وقال عبد الله بن الوليد" },
  { token: "فقالا كنا نصيب المغانم", kind: "dialogue" },
  { token: "كانوا يتبايعون الجزور", kind: "companion_words" },
  { token: "قضى رسول الله صلى الله عليه وسلم بالشفعة", kind: "prophet_words" },
  { token: "ما بعث الله نبيا", kind: "prophet_words" },
  { token: "واستأجر النبي صلى الله عليه وسلم وأبو بكر", kind: "narration" },
  { token: "واستأجر رسول الله صلى الله عليه وسلم وأبو بكر", kind: "narration" },
  { token: "فانطلقا فوجدا جدارا", kind: "prophet_words" },
  { token: "انطلق ثلاثة رهط", kind: "prophet_words" },
  { token: "كان رسول الله صلى الله عليه وسلم إذا أمر", kind: "narration" },
  { token: "نهى رسول الله صلى الله عليه وسلم أن يتلقى", kind: "prophet_words" },
  { token: "كنت رجلا قينا", kind: "companion_words" },
  { token: "حجم أبو طيبة النبي", kind: "companion_words" },
  { token: "احتجم النبي صلى الله عليه وسلم", kind: "narration" },
  { token: "احتجم النبي صلى الله عليه وسلم", kind: "narration" },
  { token: "كان النبي صلى الله عليه وسلم يحتجم", kind: "narration" },
  { token: "دعا النبي صلى الله عليه وسلم غلاما", kind: "narration" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن ثمن الكلب", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن كسب الإماء", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن عسب الفحل", kind: "prophet_words" },
];

function normalizeArabic(value: string): { value: string; sourceIndexes: number[] } {
  let normalized = "";
  const sourceIndexes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (/[ً-ٰٟـ]/.test(char) || /[\p{P}\p{S}\p{Cf}]/u.test(char)) continue;
    normalized += char;
    sourceIndexes.push(i);
  }
  return { value: normalized, sourceIndexes };
}

function exactSpan(text: string, token: string): string {
  const source = normalizeArabic(text);
  const needle = normalizeArabic(token).value;
  const normalizedStart = source.value.indexOf(needle);
  if (normalizedStart < 0) throw new Error(`Could not find source token: ${token}`);
  const start = source.sourceIndexes[normalizedStart];
  const end = source.sourceIndexes[normalizedStart + needle.length - 1] + 1;
  return text.slice(start, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-023.json", "utf8"));
if (batch.length !== specs.length) throw new Error(`Expected ${specs.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => {
  const spec = specs[index];
  const mark: any = { id: item.id, url: item.url, start: spec.token === null ? null : exactSpan(item.text_original, spec.token), kind: spec.kind };
  if (spec.tail) mark.tail_start = exactSpan(item.text_original, spec.tail);
  return mark;
});
fs.writeFileSync("data/hadith-split/marks-023.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-023.json`);
