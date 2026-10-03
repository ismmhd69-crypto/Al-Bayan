import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-173.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [0, 2, 4, 5, 6, 7, 8, 10, 11, 13, 14, 16, 18, 19, 20, 21, 26, 27, 28, 29, 31, 33, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 58]) kinds[i] = 'narration';
for (const i of [9, 12, 23, 24, 26, 27, 30, 40, 56, 57]) kinds[i] = 'dialogue';
for (const i of [1, 10, 11, 22, 32, 34, 35, 41, 49]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync('data/hadith-split/marks-173.json', JSON.stringify(marks, null, 2) + '\n');
