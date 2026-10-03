import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-174.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [0, 1, 2, 3, 4, 6, 8, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 47, 51, 52, 54, 55, 56, 57, 59]) kinds[i] = 'narration';
for (const i of [7, 9, 12, 18, 23, 25, 42, 46, 48, 49, 50, 58]) kinds[i] = 'dialogue';
for (const i of [5, 10, 13, 24, 30, 34, 41, 47, 53, 54]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync('data/hadith-split/marks-174.json', JSON.stringify(marks, null, 2) + '\n');
