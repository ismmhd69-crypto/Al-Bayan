import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-168.json', 'utf8'));
const kinds = [
  ...Array(16).fill('prophet_statement'), 'narration', ...Array(4).fill('prophet_statement'),
  ...Array(6).fill('prophet_statement'), 'narration', ...Array(7).fill('prophet_statement'),
  'companion_words', 'prophet_statement', 'prophet_statement', 'companion_words',
  ...Array(2).fill('prophet_statement'), 'narration', ...Array(12).fill('prophet_statement'),
  'companion_words', 'narration', ...Array(7).fill('prophet_statement')
];
const marks = batch.map((x: any, i: number) => {
  const q = x.text_original.indexOf('"');
  if (q < 0) throw new Error(`No matn quote at ${i}`);
  const raw = x.text_original.slice(Math.max(0, q - 120), q);
  const start = raw.slice(raw.indexOf(' ') + 1).trim();
  return { id: x.id, url: x.url, start, kind: kinds[i] };
});
const tailWords: Record<number, string> = {
  3: '\u0632\u0627\u062f', 7: '\u0648\u0642\u0627\u0644 \u0622\u062f\u0645', 13: '\u0648\u0642\u0627\u0644 \u0645\u0639\u062a\u0645\u0631',
  15: '\u0648\u0646\u0633\u0628\u0647', 39: '\u0642\u0627\u0644 \u0645\u0646\u0635\u0648\u0631', 40: '\u0642\u0627\u0644 \u0634\u0639\u0628\u0629', 46: '\u062b\u0645 \u0645\u062f \u064a\u062f\u0647'
};
void tailWords;
fs.writeFileSync('data/hadith-split/marks-168.json', JSON.stringify(marks, null, 2) + '\n');
