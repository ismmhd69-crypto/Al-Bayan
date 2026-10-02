import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";

const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-125.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "prophet_words", "reference_only", "reference_only", "dialogue", "dialogue", "prophet_words", "prophet_words", "reference_only", "narration", "dialogue",
  "dialogue", "reference_only", "prophet_words", "narration", "narration", "narration", "narration", "reference_only", "reference_only", "prophet_words",
  "dialogue", "dialogue", "dialogue", "reference_only", "dialogue", "companion_words", "companion_words", "reference_only", "reference_only", "prophet_words",
  "prophet_words", "companion_words", "companion_words", "prophet_words", "prophet_words", "reference_only", "reference_only", "companion_words", "reference_only", "companion_words",
  "reference_only", "reference_only", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "prophet_words",
  "companion_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "prophet_words", "reference_only", "prophet_words", "reference_only",
];

const marks = batch.map((x: any, i: number) => ({
  id: x.id,
  url: x.url,
  start: null as string | null,
  kind: kinds[i],
}));

function cleanMap(text: string) {
  const clean: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(text[i])) continue;
    clean.push(text[i]);
    map.push(i);
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
  marks[i].start = locate(batch[i].text_original, needle);
}

const starts: Array<[number, string]> = [
  [0, "يقول نهى رسول الله صلى الله عليه وسلم أن يقتل شىء من الدواب صبرا"],
  [3, "قال ضحى خالي أبو بردة قبل الصلاة"],
  [4, "أن خاله أبا بردة بن نيار"],
  [5, "رسول الله صلى الله عليه وسلم"],
  [6, "إن أول ما نبدأ به في يومنا هذا"],
  [8, "قال خطبنا رسول الله صلى الله عليه وسلم في يوم النحر بعد الصلاة"],
  [9, "قال خطبنا رسول الله صلى الله عليه وسلم في يوم نحر فقال"],
  [10, "قال ذبح أبو بردة قبل الصلاة فقال النبي صلى الله عليه وسلم"],
  [12, "أن رسول الله صلى الله عليه وسلم صلى ثم خطب فأمر من كان ذبح قبل الصلاة"],
  [13, "يقول صلى بنا النبي صلى الله عليه وسلم يوم النحر بالمدينة"],
  [14, "أن رسول الله صلى الله عليه وسلم قسم ضحايا بين أصحابه"],
  [15, "قال ضحى النبي صلى الله عليه وسلم بكبشين أملحين أقرنين"],
  [16, "قال ضحى رسول الله صلى الله عليه وسلم بكبشين أملحين أقرنين"],
  [19, "أن رسول الله صلى الله عليه وسلم أمر بكبش أقرن يطأ في سواد"],
  [20, "قلت يا رسول الله إنا لاقو العدو غدا وليست معنا مدى"],
  [21, "قال كنا مع رسول الله صلى الله عليه وسلم بذي الحليفة من تهامة"],
  [22, "قال قلنا يا رسول الله إنا لاقو العدو غدا وليس معنا مدى"],
  [24, "أنه قال يا رسول الله إنا لاقو العدو غدا وليس معنا مدى"],
  [25, "قال شهدت العيد مع علي بن أبي طالب فبدأ بالصلاة قبل الخطبة"],
  [26, "قال ثم صليت مع علي بن أبي طالب"],
  [29, "أن رسول الله صلى الله عليه وسلم نهى أن تؤكل لحوم الأضاحي بعد ثلاث"],
  [30, "قال نهى رسول الله صلى الله عليه وسلم عن أكل لحوم الضحايا بعد ثلاث"],
  [31, "قال كنا لا نمسك لحوم الأضاحي فوق ثلاث فأمرنا رسول الله صلى الله عليه وسلم"],
  [32, "قال كنا نتزودها إلى المدينة على عهد رسول الله صلى الله عليه وسلم"],
  [33, "يا أهل المدينة لا تأكلوا لحوم الأضاحي فوق ثلاث"],
  [34, "من ضحى منكم فلا يصبحن في بيته بعد ثالثة شيئا"],
  [37, "قال كنا في الحمام قبيل الأضحى فاطلى فيه ناس"],
  [39, "قال أصبت شارفا مع رسول الله صلى الله عليه وسلم في مغنم يوم بدر"],
  [42, "قال كنت ساقي القوم يوم حرمت الخمر في بيت أبي طلحة"],
  [43, "قال سألوا أنس بن مالك عن الفضيخ"],
  [44, "قال إني"],
  [45, "قال أنس"],
  [46, "قال كنت أسقي أبا طلحة وأبا دجانة ومعاذ بن جبل في رهط من الأنصار"],
  [47, "قال إني لأسقي أبا طلحة وأبا دجانة وسهيل ابن بيضاء من مزادة"],
  [48, "قال كنت أسقي أبا عبيدة بن الجراح"],
  [49, "يقول إن رسول الله صلى الله عليه وسلم نهى أن يخلط التمر والزهو ثم يشرب"],
  [50, "يقول لقد أنزل الله الآية التي حرم الله فيها الخمر"],
  [51, "الخمر من هاتين الشجرتين"],
  [52, "النبي صلى الله عليه وسلم نهى أن يخلط الزبيب والتمر والبسر والتمر"],
  [53, "عن رسول الله صلى الله عليه وسلم أنه نهى أن ينبذ التمر والزبيب جميعا"],
  [54, "عن رسول الله صلى الله عليه وسلم أنه نهى أن ينبذ الزبيب والتمر جميعا"],
  [55, "النبي صلى الله عليه وسلم نهى عن التمر والزبيب أن يخلط بينهما"],
  [56, "قال نهانا رسول الله صلى الله عليه وسلم أن نخلط بين الزبيب والتمر"],
  [58, "قال نهانا رسول الله صلى الله عليه وسلم أن نخلط بسرا بتمر"],
];

for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-125.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-125.json");
