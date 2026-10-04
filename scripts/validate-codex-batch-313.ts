import fs from 'node:fs';
const rows = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-313.json', 'utf8')) as any[];
if (rows.length !== 30) throw new Error('count ' + rows.length);
const nums = (s: string) => [...s.matchAll(/\d+/g)].map((x) => x[0]).filter((x, i, a) => a.indexOf(x) === i).sort().join(',');
for (const row of rows) {
  for (const [lang, value] of [['en', row.translations.en], ['de', row.translations.de]] as const) {
    if (!value.trim()) throw new Error(row.url + ' ' + lang + ' empty');
    if (/[\u0600-\u06ff]/u.test(value)) throw new Error(row.url + ' ' + lang + ' Arabic');
    if (/\[quran\s/u.test(value)) throw new Error(row.url + ' tag');
    if (nums(row.text_original) !== nums(value)) throw new Error(row.url + ' ' + lang + ' numbers');
    const ratio = value.length / Math.max(1, row.text_original.length);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(row.url + ' ' + lang + ' ratio ' + ratio.toFixed(2));
  }
  if (!/[äöüÄÖÜß]/u.test(row.translations.de)) throw new Error(row.url + ' umlaut');
}
console.log('validated=' + rows.length);
