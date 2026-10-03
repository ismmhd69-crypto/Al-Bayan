import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-170.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [1, 4, 5, 6, 9, 12, 14, 16, 17, 18, 23, 26, 30, 32, 39, 42, 44, 51, 53, 54, 55, 56, 57, 58]) kinds[i] = 'narration';
for (const i of [10, 13, 25, 28, 43, 46]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

fs.writeFileSync('data/hadith-split/marks-170.json', JSON.stringify(marks, null, 2) + '\n');
