import fs from "node:fs";

const inputPath = process.argv.find((a) => a.startsWith("--input="))?.split("=")[1] ?? "data/hadith-words-translations/codex-batch-001.json";
const outputPath = process.argv.find((a) => a.startsWith("--output="))?.split("=")[1] ?? "data/hadith-words-translations/codex-out-001.json";
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
const errors: string[] = [];
const byId = new Map(output.map((x: any) => [x.id, x]));
const arabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const quranTag = /\[\/?quran\b|\]\s*\{/iu;
const stripArabicMarks = (s: string) => s.replace(/[\u064b-\u065f\u0670]/gu, "");

if (input.length !== output.length) errors.push(`count mismatch ${input.length} vs ${output.length}`);
for (const item of input) {
  const out = byId.get(item.id);
  const n = item.url.split(":").pop();
  if (!out) { errors.push(`${n}: missing output`); continue; }
  for (const lang of ["en", "de"] as const) {
    const text = String(out[lang] ?? "");
    if (!text.trim()) errors.push(`${n}: ${lang} empty`);
    if (arabic.test(text)) errors.push(`${n}: ${lang} contains Arabic`);
    if (quranTag.test(text)) errors.push(`${n}: ${lang} contains Quran tag`);
    const numbers = stripArabicMarks(item.text_original).match(/\d+/gu) ?? [];
    for (const number of numbers) if (!new RegExp(`(^|[^0-9])${number}([^0-9]|$)`).test(text)) errors.push(`${n}: ${lang} missing number ${number}`);
    const ratio = text.length / Math.max(1, stripArabicMarks(item.text_original).length);
    if (ratio < 0.6 || ratio > 3.5) errors.push(`${n}: ${lang} length ratio ${ratio.toFixed(2)}`);
    if (lang === "de" && /\b\w*(?:ae|oe|ue)\w*\b/i.test(text) && !/[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]/u.test(text)) errors.push(`${n}: German uses transliterated umlauts without real umlauts`);
  }
}
console.log(`Validated ${input.length} translations`);
if (errors.length) { console.log(errors.join("\n")); process.exit(2); }
console.log("Errors: 0");
