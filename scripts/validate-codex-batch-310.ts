import fs from 'node:fs';

const out = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-310.json', 'utf8')) as Array<{
  url: string;
  text_original: string;
  translations: { en: string; de: string };
}>;

if (out.length !== 23) throw new Error(`count ${out.length}`);

const nums = (s: string) => [...s.matchAll(/\d+/g)].map((x) => x[0]).filter((x, i, a) => a.indexOf(x) === i).sort().join(',');

for (const row of out) {
  for (const [lang, value] of [['en', row.translations.en], ['de', row.translations.de]] as const) {
    if (!value.trim()) throw new Error(`${row.url} ${lang} empty`);
    if (/[\u0600-\u06ff]/u.test(value)) throw new Error(`${row.url} ${lang} Arabic`);
    if (/\[quran\s/u.test(value)) throw new Error(`${row.url} tag`);
    if (nums(row.text_original) !== nums(value)) throw new Error(`${row.url} ${lang} numbers`);
    const ratio = value.length / Math.max(1, row.text_original.length);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`${row.url} ${lang} ratio ${ratio.toFixed(2)}`);
  }
  if (!/[äöüÄÖÜßÃ¤Ã¶Ã¼Ã„Ã–ÃœÃŸ]/u.test(row.translations.de)) throw new Error(`${row.url} umlaut`);
}

console.log(`validated=${out.length}`);
