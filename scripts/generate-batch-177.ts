import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-177.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]) kinds[i] = 'narration';
for (const i of [4, 11, 16, 21, 26, 27, 29, 36, 37, 40, 51, 58]) kinds[i] = 'dialogue';
for (const i of [1, 7, 10, 19, 32, 38, 41, 47, 50, 54]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync('data/hadith-split/marks-177.json', JSON.stringify(marks, null, 2) + '\n');
