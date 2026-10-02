import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
type Spec = { token: string | null; kind: Kind; tail?: string };

const specs: Spec[] = [
  { token: null, kind: "reference_only" },
  { token: "أقبلت عير ونحن نصلي", kind: "companion_words" },
  { token: "أن النبي صلى الله عليه وسلم اشترى طعاما", kind: "narration" },
  { token: "لما استخلف أبو بكر", kind: "companion_words" },
  { token: "كان أصحاب رسول الله", kind: "companion_words", tail: "رواه همام" },
  { token: "قال النبي", kind: "prophet_words", tail: "وقال أبو مالك" },
  { token: "لما نزلت آخر البقرة", kind: "companion_words" },
  { token: "رأيت أبي اشترى", kind: "companion_words" },
  { token: "أن رجلا أقام سلعة", kind: "companion_words" },
  { token: "كانت لي شارف", kind: "companion_words" },
  { token: "إن الله حرم مكة", kind: "prophet_words", tail: "وقال عباس بن عبد المطلب" },
  { token: "كنت قينا في الجاهلية", kind: "companion_words" },
  { token: "إن خياطا دعا رسول الله", kind: "narration" },
  { token: "أن امرأة من الأنصار قالت", kind: "dialogue" },
  { token: "اشترى رسول الله", kind: "narration" },
  { token: "كنت مع النبي", kind: "dialogue" },
  { token: "كانت عكاظ", kind: "companion_words" },
  { token: "كان ها هنا رجل", kind: "dialogue", tail: "سمع سفيان عمرا" },
  { token: "خرجنا مع رسول الله", kind: "companion_words" },
  { token: "حجم أبو طيبة", kind: "companion_words" },
  { token: "احتجم النبي", kind: "narration" },
  { token: "أنها اشترت نمرقة", kind: "dialogue" },
  { token: "البيعان بالخيار", kind: "prophet_words", tail: "وزاد أحمد" },
  { token: "البيعان بالخيار", kind: "prophet_words", tail: "قال همام وجدت في كتابي" },
  { token: "كنا مع النبي صلى الله عليه وسلم في سفر", kind: "dialogue" },
  { token: "بعت من أمير المؤمنين", kind: "companion_words" },
  { token: "يغزو جيش الكعبة", kind: "dialogue" },
  { token: "صلاة أحدكم في جماعة", kind: "prophet_words" },
  { token: "خرج النبي صلى الله عليه وسلم في طائفة النهار", kind: "dialogue", tail: "قال سفيان قال عبيد الله" },
  { token: "أنهم كانوا يشترون الطعام", kind: "companion_words", tail: "قال وحدثنا ابن عمر" },
  { token: "أخبرني عن صفة رسول الله", kind: "companion_words", tail: "تابعه عبد العزيز" },
  { token: "توفي عبد الله بن عمرو", kind: "dialogue", tail: "وقال فراس" },
  { token: "رأيت الذين يشترون الطعام", kind: "companion_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى", kind: "prophet_words", tail: "قلت لابن عباس" },
  { token: "أما الذي نهى عنه النبي", kind: "companion_words" },
  { token: "من ابتاع طعاما فلا يبعه حتى يستوفيه", kind: "prophet_words", tail: "زاد إسماعيل" },
  { token: "لقد رأيت الناس", kind: "companion_words" },
  { token: "لقل يوم كان يأتي", kind: "dialogue" },
  { token: "نهى رسول الله صلى الله عليه وسلم أن يبيع", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن النجش", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى", kind: "prophet_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى", kind: "prophet_words" },
  { token: "نهي عن لبستين", kind: "companion_words" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى", kind: "prophet_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن لبستين", kind: "prophet_words" },
  { token: "لا تصروا الإبل والغنم", kind: "prophet_words", tail: "ويذكر عن أبي صالح" },
  { token: "من اشترى شاة محفلة", kind: "companion_words" },
  { token: "دخل على رسول الله", kind: "dialogue" },
  { token: "بايعت رسول الله", kind: "companion_words" },
  { token: "نهى رسول الله صلى الله عليه وسلم أن يبيع", kind: "prophet_words" },
  { token: "نهينا أن يبيع", kind: "companion_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن التلقي", kind: "prophet_words" },
  { token: "من اشترى محفلة", kind: "companion_words" },
  { token: "كنا نتلقى الركبان", kind: "companion_words", tail: "قال أبو عبد الله" },
  { token: "كانوا يبتاعون الطعام", kind: "companion_words" },
  { token: "جاءتني بريرة", kind: "dialogue" },
  { token: "أن رسول الله صلى الله عليه وسلم نهى عن المزابنة", kind: "prophet_words" },
  { token: "أن النبي صلى الله عليه وسلم نهى عن المزابنة", kind: "prophet_words" },
  { token: "فكل واحد منهما يقول هذا خير مني", kind: "companion_words" },
  { token: "نهى النبي صلى الله عليه وسلم عن الفضة", kind: "prophet_words" },
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
  const last = normalizedStart + needle.length - 1;
  const end = source.sourceIndexes[last] + 1;
  return text.slice(start, end);
}

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-022.json", "utf8"));
if (batch.length !== specs.length) throw new Error(`Expected ${specs.length} items, got ${batch.length}`);

const marks = batch.map((item: any, index: number) => {
  const spec = specs[index];
  const mark: any = { id: item.id, url: item.url, start: spec.token === null ? null : exactSpan(item.text_original, spec.token), kind: spec.kind };
  if (spec.tail) mark.tail_start = exactSpan(item.text_original, spec.tail);
  return mark;
});

fs.writeFileSync("data/hadith-split/marks-022.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log(`Wrote ${marks.length} marks to data/hadith-split/marks-022.json`);
