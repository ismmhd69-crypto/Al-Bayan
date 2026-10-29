import fs from 'node:fs';

const translated = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const missingBukhari = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-bukhari.json', 'utf8'));
const missingMuslim = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-muslim.json', 'utf8'));

const transMap = new Map(translated.map(t => [t.id, t]));

let bukhariMatch = 0;
let muslimMatch = 0;

for (const b of missingBukhari) {
  if (transMap.has(b.id) && transMap.get(b.id).de?.trim()) bukhariMatch++;
}
for (const m of missingMuslim) {
  if (transMap.has(m.id) && transMap.get(m.id).de?.trim()) muslimMatch++;
}

console.log(`Missing Bukhari (total ${missingBukhari.length}) matching hadith-batch-001-translated: ${bukhariMatch}`);
console.log(`Missing Muslim (total ${missingMuslim.length}) matching hadith-batch-001-translated: ${muslimMatch}`);
