import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
type Spec = { token: string | null; kind: Kind; tail?: string };

const specs: Spec[] = [
  { token: "بينما رسول الله", kind: "dialogue" },
  { token: "أن يهوديا", kind: "narration" },
  { token: "أن رجلا أعتق", kind: "narration" },
  { token: "قال رسول الله", kind: "prophet_words" },
  { token: "أنه تقاضى", kind: "dialogue" },
  { token: "سمعت عمر", kind: "dialogue" },
  { token: "بعث رسول الله", kind: "dialogue" },
  { token: "بعث النبي", kind: "narration" },
  { token: "كنت قينا", kind: "companion_words" },
  { token: "أخذت صرة", kind: "dialogue" },
  { token: "جاء أعرابي", kind: "dialogue" },
  { token: "سئل النبي", kind: "dialogue" },
  { token: "جاء رجل", kind: "dialogue" },
  { token: "أن رسول الله", kind: "prophet_words" },
  { token: "لما فتح الله", kind: "dialogue" },
  { token: "أن رجلا سأل", kind: "dialogue" },
  { token: "كنت مع سلمان", kind: "companion_words" },
  { token: null, kind: "reference_only" },
  { token: "أن أعرابيا سأل", kind: "dialogue" },
  { token: "انطلقت فإذا أنا", kind: "companion_words" },
  { token: "قال رسول الله", kind: "prophet_words" },
  { token: "أمرنا النبي", kind: "companion_words" },
  { token: "الرجل تكون عنده المرأة", kind: "companion_words" },
  { token: "كنا بالمدينة", kind: "companion_words" },
  { token: "حين توفى الله نبيه", kind: "companion_words" },
  { token: "إياكم والجلوس", kind: "prophet_words" },
  { token: "بينا رجل بطريق", kind: "prophet_words" },
  { token: "لم أزل حريصا", kind: "companion_words" },
  { token: "لقد رأيت رسول الله", kind: "narration" },
  { token: "قضى النبي", kind: "prophet_words" },
  { token: "نهى النبي", kind: "prophet_words" },
  { token: "أن النبي", kind: "dialogue" },
  { token: "دخل النبي", kind: "narration" },
  { token: "أنها كانت اتخذت", kind: "narration" },
  { token: "بعث رسول الله", kind: "companion_words" },
  { token: "خفت أزواد القوم", kind: "dialogue" },
  { token: "كنا نصلي مع النبي", kind: "companion_words" },
  { token: "كنا مع النبي", kind: "dialogue" },
  { token: "نهى النبي", kind: "prophet_words" },
  { token: "كنا بالمدينة", kind: "companion_words" },
  { token: "عن قول الله", kind: "companion_words" },
  { token: "إنما جعل النبي", kind: "prophet_words" },
  { token: "قضى النبي", kind: "prophet_words" },
  { token: "أعطى رسول الله", kind: "narration" },
  { token: "قدم النبي", kind: "dialogue" },
  { token: "كنا مع النبي", kind: "dialogue" },
  { token: "أن النبي", kind: "narration" },
  { token: "اشترى رسول الله", kind: "narration" },
  { token: "أن النبي", kind: "prophet_words" },
  { token: "من حلف على يمين", kind: "companion_words" },
  { token: "سألت النبي", kind: "dialogue" },
  { token: "أمر النبي", kind: "companion_words", tail: "تابعه علي" },
  { token: "كنا نؤمر", kind: "companion_words" },
  { token: "أنه كان يفتي", kind: "companion_words", tail: "ورواه الليث" },
  { token: "قال النبي", kind: "prophet_words" },
  { token: "لما أقبل أبو هريرة", kind: "companion_words" },
  { token: "إن عتبة", kind: "dialogue" },
  { token: "أعتق رجل", kind: "companion_words" },
  { token: "نهى رسول الله", kind: "prophet_words" },
  { token: "أن النبي", kind: "dialogue" },
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

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-025.json", "utf8"));
if (batch.length !== specs.length) throw new Error(`Expected ${specs.length} items, got ${batch.length}`);
const marks = batch.map((item: any, index: number) => {
  const spec = specs[index];
  const mark: any = { id: item.id, url: item.url, start: spec.token === null ? null : exactSpan(item.text_original, spec.token), kind: spec.kind };
  if (spec.tail) mark.tail_start = exactSpan(item.text_original, spec.tail);
  return mark;
});

// Extend repeated openings from the first intended matn occurrence until unique.
for (let index = 0; index < marks.length; index++) {
  const text = batch[index].text_original;
  const base = marks[index].start;
  if (!base || text.split(base).length - 1 === 1) continue;
  const startIndex = text.indexOf(base);
  for (let length = base.length; length <= text.length - startIndex; length++) {
    const candidate = text.slice(startIndex, startIndex + length);
    if (text.split(candidate).length - 1 === 1) {
      marks[index].start = candidate;
      break;
    }
  }
}

fs.writeFileSync("data/hadith-split/marks-025.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-025.json`);
