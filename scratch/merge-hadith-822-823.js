const fs = require('fs');

const mainPath = 'data/translations/hadith-batch-001-translated.json';
const draftPath = 'scratch/hadith-batch-822-823-fixed.json';
const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const existing = new Set(main.map((row) => row.id));
for (const row of draft) {
  if (existing.has(row.id)) throw new Error('Duplicate source id: ' + row.id);
}
const merged = main.concat(draft);
fs.writeFileSync(mainPath, JSON.stringify(merged, null, 2) + '\n');
console.log(JSON.stringify({ added: draft.length, total: merged.length }));
