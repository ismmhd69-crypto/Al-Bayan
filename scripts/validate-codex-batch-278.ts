import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-278-part.json', 'utf8')) as Array<{ id: string; text_original: string }>;
const out = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-out-278-part.json', 'utf8')) as Array<{ id: string; url: string; en: string; de: string }>;

if (out.length !== 10) throw new Error(`count ${out.length}`);
const nums = (s: string) => [...s.replace(/\[quran\s+sura="(\d+)"\s+aya_start="(\d+)"\s+aya_end="\d+"\]/gu, 'Quran $1:$2').matchAll(/\d+/g)].map(x => x[0]).sort().join(',');

for (const r of out) {
  const s = input.find(x => x.id === r.id);
  if (!s) throw new Error(`id ${r.id}`);
  for (const [lang, value] of [['en', r.en], ['de', r.de]] as const) {
    if (!value.trim()) throw new Error(`${r.url} ${lang} empty`);
    if (/[\u0600-\u06ff]/u.test(value)) throw new Error(`${r.url} ${lang} Arabic`);
    if (/\[quran\s/u.test(value)) throw new Error(`${r.url} tag`);
    if (nums(s.text_original) !== nums(value)) throw new Error(`${r.url} ${lang} numbers`);
    const ratio = value.length / Math.max(1, s.text_original.length);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`${r.url} ${lang} ratio ${ratio.toFixed(2)}`);
  }
  if (!/[äöüÄÖÜß]/u.test(r.de)) throw new Error(`${r.url} umlaut`);
}

console.log(`validated=${out.length}`);
