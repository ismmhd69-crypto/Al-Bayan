import fs from 'node:fs';
const rows = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-343.json', 'utf8')) as Array<{ id: string; text_original: string; translation_en: string; translation_de: string }>;
if (rows.length !== 30) throw new Error(`Expected 30 rows, got ${rows.length}`);
const nums = (s: string) => [...new Set([...s.matchAll(/\d+/g)].map((m) => m[0]))].sort().join(',');
for (const row of rows) {
  for (const [lang, value] of [['en', row.translation_en], ['de', row.translation_de]] as const) {
    if (!value.trim()) throw new Error(`${row.id} ${lang}: empty`);
    if (/[\u0600-\u06ff]/.test(value)) throw new Error(`${row.id} ${lang}: Arabic remains`);
    if (nums(row.text_original) !== nums(value)) throw new Error(`${row.id} ${lang}: numbers changed`);
    const ratio = value.length / row.text_original.length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`${row.id} ${lang}: ratio ${ratio}`);
    if (/\[quran\b/i.test(value)) throw new Error(`${row.id} ${lang}: Quran tag remains`);
  }
  if (!/[äöüÄÖÜß]/.test(row.translation_de)) throw new Error(`${row.id} de: no German umlaut`);
}
console.log(`Validated ${rows.length} translations`);
