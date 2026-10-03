import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-172.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [0, 2, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 21, 26, 27, 28, 31, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 56, 57, 58, 59]) kinds[i] = 'narration';
for (const i of [8, 9, 10, 11, 22, 24, 25, 29, 40, 55]) kinds[i] = 'dialogue';
for (const i of [20, 30, 32, 45, 52]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync('data/hadith-split/marks-172.json', JSON.stringify(marks, null, 2) + '\n');
