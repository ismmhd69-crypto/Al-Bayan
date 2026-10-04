import fs from 'node:fs';

type Row = { id: string; url: string; text_original: string; translations: { en: string; de: string } };
const rows = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-302.json', 'utf8')) as Row[];
if (rows.length !== 30) throw new Error(`expected 30 rows, got ${rows.length}`);

const nums = (s: string) => [...s.matchAll(/\d+/g)].map(x => x[0]).filter((x, i, a) => a.indexOf(x) === i).sort().join(',');
for (const [i, row] of rows.entries()) {
  for (const [language, text] of [['en', row.translations.en], ['de', row.translations.de]] as const) {
    if (!text.trim()) throw new Error(`${i} ${language}: empty`);
    if (/[\u0600-\u06ff]/u.test(text)) throw new Error(`${i} ${language}: Arabic remains`);
    if (/\[quran\s/u.test(text)) throw new Error(`${i} ${language}: quran tag remains`);
    if (nums(text) !== nums(row.text_original)) throw new Error(`${i} ${language}: number mismatch`);
  }
  for (const [language, text] of [['en', row.translations.en], ['de', row.translations.de]] as const) {
    const ratio = text.length / Math.max(1, row.text_original.length);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`${i} ${language}: ratio ${ratio}`);
  }
  if (!/[äöüÄÖÜßÃ¤Ã¶Ã¼Ã„Ã–ÃœÃŸ]/u.test(row.translations.de)) throw new Error(`${i}: German umlaut missing`);
}
console.log(`validated=${rows.length}`);
