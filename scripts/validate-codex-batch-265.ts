import fs from "node:fs";
const rows: any[] = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-out-265-part.json", "utf8"));
const bad: any[] = [];
for (const row of rows) {
  for (const lang of ["en", "de"] as const) {
    const text = String(row[lang] ?? "");
    const ratio = text.length / row.text_original.length;
    if (!text.trim() || /[\u0600-\u06ff]/u.test(text) || /\[quran\s/u.test(text) || ratio < 0.6 || ratio > 3.5) bad.push({ url: row.url, lang, ratio });
  }
  if (!/[äöüÄÖÜß]/u.test(row.de)) bad.push({ url: row.url, lang: "de-umlaut" });
}
console.log(JSON.stringify({ count: rows.length, bad }, null, 2));
if (bad.length) process.exit(1);
