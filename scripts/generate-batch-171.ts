import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-171.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [1, 3, 5, 6, 9, 10, 12, 17, 18, 19, 21, 22, 23, 26, 30, 31, 32, 33, 34, 36, 38, 42, 43, 44, 45, 48, 49, 51, 53, 54, 55, 56, 57]) kinds[i] = 'narration';
for (const i of [8, 24, 28, 40, 46, 58]) kinds[i] = 'dialogue';
for (const i of [7, 13, 20, 35]) kinds[i] = 'companion_words';

const marker = '\u200f"\u200f';
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf(marker);
  if (q < 0) throw new Error(`No hadith quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});

function compact(s: string) {
  const text: string[] = [], map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (/[\u064b-\u065f\u0670]/.test(s[i])) continue;
    text.push(s[i]); map.push(i);
  }
  return { text: text.join(''), map };
}
const tails: Record<number, string> = {
  16: '\u0628\u0646\u062d\u0648 \u062d\u062f\u064a\u062b\u0647\u0645',
  41: '\u0648\u0644\u0645 \u064a\u0630\u0643\u0631',
  47: '\u0648\u0644\u0645 \u064a\u0630\u0643\u0631 \u0645\u0627 \u0628\u0639\u062f\u0647',
  52: '\u0648\u0644\u0645 \u064a\u0630\u0643\u0631'
};
for (const [raw, needle] of Object.entries(tails)) {
  const i = Number(raw), c = compact(batch[i].text_original), p = c.text.lastIndexOf(compact(needle).text);
  if (p >= 0) marks[i].tail_start = batch[i].text_original.slice(c.map[p], c.map[p] + 100);
}

fs.writeFileSync('data/hadith-split/marks-171.json', JSON.stringify(marks, null, 2) + '\n');
