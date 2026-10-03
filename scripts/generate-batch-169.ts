import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-169.json', 'utf8'));
const kinds = Array(60).fill('prophet_statement');
for (const i of [0, 19, 26, 28, 37, 38, 50]) kinds[i] = 'companion_words';
for (const i of [7, 23, 41]) kinds[i] = 'narration';

const marks = batch.map((x: any, i: number) => {
  const marker = '\u200f"\u200f';
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
  3: '\u0648\u0641\u064a \u0631\u0648\u0627\u064a\u0629',
  13: '\u0628\u0646\u062d\u0648 \u062d\u062f\u064a\u062b',
  19: '\u0648\u0641\u064a \u0631\u0648\u0627\u064a\u0629',
  46: '\u0648\u0642\u0627\u0644 \u0627\u0628\u0646 \u0623\u0628\u064a \u0639\u0645\u0631',
  49: '\u0648\u0642\u0627\u0644 \u0627\u0628\u0646 \u0631\u0645\u062d',
  54: '\u0642\u0627\u0644 \u0639\u062b\u0645\u0627\u0646',
  56: '\u0642\u0627\u0644 \u0623\u0628\u0648 \u0628\u0643\u0631'
};
for (const [raw, needle] of Object.entries(tails)) {
  const i = Number(raw), c = compact(batch[i].text_original), p = c.text.lastIndexOf(compact(needle).text);
  if (p >= 0) marks[i].tail_start = batch[i].text_original.slice(c.map[p], c.map[p] + 100);
}

fs.writeFileSync('data/hadith-split/marks-169.json', JSON.stringify(marks, null, 2) + '\n');
