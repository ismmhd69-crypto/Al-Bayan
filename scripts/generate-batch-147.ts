import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-147.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "reference_only", "reference_only", "reference_only", "companion_words", "prophet_words", "reference_only", "dialogue", "reference_only", "dialogue", "prophet_words",
  "dialogue", "dialogue", "reference_only", "companion_words", "reference_only", "dialogue", "prophet_words", "companion_words", "dialogue", "dialogue",
  "dialogue", "companion_words", "reference_only", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "companion_words",
  "companion_words", "companion_words", "dialogue", "reference_only", "dialogue", "reference_only", "dialogue", "companion_words", "dialogue", "dialogue",
  "reference_only", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words",
  "dialogue", "companion_words", "companion_words", "reference_only", "companion_words", "reference_only", "dialogue", "dialogue", "dialogue", "dialogue",
];

const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
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
  const direct = strip(needle);
  const mojibake = Buffer.from(direct, "utf8").toString("latin1");
  const p = Math.max(clean.indexOf(direct), clean.indexOf(mojibake));
  if (p >= 0) return text.slice(map[p], map[p] + Math.min(100, text.length - map[p]));
  try {
    const decoded = Buffer.from(text, "latin1").toString("utf8");
    const decodedClean = strip(decoded);
    const decodedNeedle = direct;
    const decodedPos = decodedClean.indexOf(decodedNeedle);
    if (decodedPos >= 0) {
      const originalPos = Buffer.from(decodedClean.slice(0, decodedPos), "utf8").toString("latin1").length;
      return text.slice(originalPos, originalPos + Math.min(100, text.length - originalPos));
    }
  } catch {}
  throw new Error(`Could not locate: ${needle}`);
}
function setStart(i: number, needle: string) {
  try { marks[i].start = locate(batch[i].text_original, needle); }
  catch (error) { throw new Error(`Index ${i}: ${(error as Error).message}`); }
}

const starts: Array<[number, string]> = [
  [3, "قال كنا عند أسامة"], [4, "سمعت رسول الله صلى الله عليه وسلم يقول"], [6, "سمع النبي صلى الله عليه وسلم وعطس"],
  [8, "قال قال رسول الله"], [9, "عن النبي صلى الله عليه وسلم قال"], [10, "مدح رجل رجلا عند النبي"], [11, "ذكر عنده رجل"],
  [13, "قام رجل يثني على أمير"], [15, "خرجت أنا وأبي نطلب العلم"], [16, "وقال رسول الله"],
  [17, "أخبرني أنس"], [18, "اليهود"], [19, "قالت اليهود"], [20, "جاء رجل"], [21, "سأل عائشة عن قول الله"],
  [23, "عن عائشة"], [24, "عن عائشة"], [25, "عن عائشة"], [26, "عن عائشة"], [27, "عن عائشة"], [29, "قالت كان ذلك يوم الخندق"],
  [30, "قالت أنزلت في المرأة"], [31, "قالت نزلت في المرأة"], [32, "قالت لي عائشة"], [34, "قال اختلف أهل الكوفة"],
  [36, "قال أمرني عبد الرحمن"], [37, "قال نزلت هذه الآية بمكة"], [38, "قال قلت لابن عباس"], [39, "قال قال لي ابن عباس"],
  [41, "قال لقي ناس من المسلمين"], [42, "قال سمعت البراء"], [43, "قال ما كان بين إسلامنا"], [44, "قال كانت المرأة تطوف"],
  [45, "قال كان عبد الله"], [46, "جارية"], [47, "نفر من الجن أسلموا"], [48, "نفر من الإنس"],
  [49, "نزلت في نفر"], [50, "قال قلت لابن عباس سورة التوبة"], [51, "قال خطب عمر على منبر"], [52, "قال سمعت عمر بن الخطاب"],
  [54, "قال سمعت أبا ذر"], [56, "قالوا يا رسول الله"], [57, "أن رجلا"], [58, "أن رسول الله صلى الله عليه وسلم قال"],
  [59, "قالت كان رسول الله صلى الله عليه وسلم إذا أمرهم"],
];
for (const [i, needle] of starts) setStart(i, needle);
fs.writeFileSync("data/hadith-split/marks-147.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-147.json");
