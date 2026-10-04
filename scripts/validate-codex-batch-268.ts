import fs from 'node:fs';
type InRow = { id: string; url: string; text_original: string };
type OutRow = { id: string; url: string; en: string; de: string };
const input = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-current.json', 'utf8')) as InRow[];
const output = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-out-268-part.json', 'utf8')) as OutRow[];
if (output.length !== 10) throw new Error(`Expected 10 output rows, got ${output.length}`);
for (const row of output) {
  const src = input.find((x) => x.id === row.id);
  if (!src) throw new Error(`Unknown id ${row.id}`);
  for (const [lang, text] of [['en', row.en], ['de', row.de]] as const) {
    if (!text?.trim()) throw new Error(`${row.url} ${lang} empty`);
    if (/[\u0600-\u06ff]/u.test(text)) throw new Error(`${row.url} ${lang} contains Arabic`);
    if (/\[quran\s/u.test(text)) throw new Error(`${row.url} ${lang} contains Quran tag`);
    const ratio = text.length / Math.max(1, src.text_original.length);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`${row.url} ${lang} ratio ${ratio.toFixed(2)}`);
  }
  if (!/[äöüÄÖÜß]/u.test(row.de)) throw new Error(`${row.url} German has no umlaut`);
}
console.log(`validated=${output.length}`);
