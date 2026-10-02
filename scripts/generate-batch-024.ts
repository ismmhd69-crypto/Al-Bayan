import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
type Spec = { token: string | null; kind: Kind; tail?: string };

const specs: Spec[] = [
  { token: "أعطى رسول الله", kind: "companion_words", tail: "وقال عبيد الله" },
  { token: "كنا جلوسا عند النبي", kind: "dialogue" },
  { token: "بعثه مصدقا", kind: "companion_words", tail: "وقال جرير" },
  { token: "ولكل جعلنا موالي", kind: "companion_words" },
  { token: "قدم علينا عبد الرحمن", kind: "companion_words" },
  { token: "أن النبي", kind: "dialogue" },
  { token: "لم أعقل", kind: "companion_words", tail: "وقال أبو صالح" },
  { token: "أن رسول الله", kind: "narration" },
  { token: "أمرني رسول الله", kind: "companion_words" },
  { token: "أن النبي", kind: "dialogue" },
  { token: "كاتبت أمية", kind: "companion_words", tail: "قال أبو عبد الله" },
  { token: "أن رسول الله", kind: "dialogue" },
  { token: "كانت لهم غنم", kind: "companion_words", tail: "تابعه عبدة" },
  { token: "كان لرجل على النبي", kind: "dialogue" },
  { token: "أن رجلا أتى النبي", kind: "dialogue" },
  { token: "أن رسول الله", kind: "dialogue" },
  { token: "كنت مع النبي", kind: "dialogue" },
  { token: "وكلني رسول الله", kind: "dialogue" },
  { token: "جاء بلال إلى النبي", kind: "dialogue" },
  { token: "ليس على الولي", kind: "companion_words" },
  { token: "جيء بالنعيمان", kind: "dialogue" },
  { token: "أنا فتلت قلائد", kind: "companion_words" },
  { token: "قال رسول الله", kind: "prophet_words" },
  { token: "عن النبي", kind: "narration" },
  { token: "كنا أكثر أهل المدينة", kind: "companion_words" },
  { token: "أن النبي", kind: "narration" },
  { token: "عامل", kind: "narration" },
  { token: "أن رسول الله", kind: "narration" },
  { token: "كنا أكثر أهل المدينة حقلا", kind: "companion_words" },
  { token: "لولا آخر المسلمين", kind: "companion_words" },
  { token: "أن النبي", kind: "narration" },
  { token: "لقد نهانا رسول الله", kind: "dialogue" },
  { token: "كانوا يزرعونها", kind: "companion_words", tail: "وقال الربيع بن نافع" },
  { token: "كان يكري مزارعه", kind: "companion_words" },
  { token: "كنت أعلم في عهد رسول الله", kind: "companion_words" },
  { token: "أنهم كانوا يكرون الأرض", kind: "companion_words" },
  { token: "إنا كنا نفرح بيوم الجمعة", kind: "companion_words" },
  { token: "من حلف على يمين", kind: "prophet_words" },
  { token: "أن رجلا من الأنصار خاصم", kind: "dialogue" },
  { token: "خاصم الزبير رجل", kind: "dialogue", tail: "قال محمد بن العباس" },
  { token: "أن رجلا من الأنصار خاصم الزبير", kind: "dialogue" },
  { token: "بينا رجل يمشي", kind: "prophet_words", tail: "تابعه حماد" },
  { token: "الخيل لرجل", kind: "prophet_words" },
  { token: "جاء رجل إلى رسول الله", kind: "dialogue" },
  { token: "أصبت شارفا", kind: "companion_words" },
  { token: "رخص النبي", kind: "prophet_words" },
  { token: "نهى النبي", kind: "prophet_words" },
  { token: "رخص النبي", kind: "prophet_words" },
  { token: "أن رسول الله", kind: "prophet_words", tail: "قال أبو عبد الله" },
  { token: "أن النبي", kind: "narration" },
  { token: "كنت مع النبي", kind: "dialogue" },
  { token: "أن رجلا تقاضى رسول الله", kind: "dialogue" },
  { token: "أن رجلا أتى النبي", kind: "dialogue" },
  { token: "كان لرجل على النبي", kind: "dialogue" },
  { token: "أنه أخبره أن أباه", kind: "dialogue" },
  { token: "أن رسول الله", kind: "dialogue" },
  { token: null, kind: "reference_only" },
  { token: "أصيب عبد الله", kind: "dialogue" },
  { token: "كلكم", kind: "prophet_words" },
  { token: "سمعت رجلا قرأ آية", kind: "companion_words", tail: "قال شعبة أظنه قال" },
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

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-024.json", "utf8"));
if (batch.length !== specs.length) throw new Error(`Expected ${specs.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => {
  const spec = specs[index];
  const mark: any = { id: item.id, url: item.url, start: spec.token === null ? null : exactSpan(item.text_original, spec.token), kind: spec.kind };
  if (spec.tail) mark.tail_start = exactSpan(item.text_original, spec.tail);
  return mark;
});

// A few long records repeat the same opening words in later variant reports.
// Extend the first, intended matn opening until the source substring is unique.
for (const index of [3, 6, 15, 57, 58]) {
  const text = batch[index].text_original;
  const base = marks[index].start;
  if (!base) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length - 1 === 1) {
      marks[index].start = candidate;
      break;
    }
  }
}

fs.writeFileSync("data/hadith-split/marks-024.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-024.json`);
