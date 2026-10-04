const fs = require('fs');
const mainPath = 'data/translations/hadith-batch-001-translated.json';
const draft = JSON.parse(fs.readFileSync('scratch/hadith-batch-786-787.json', 'utf8'));
const main = JSON.parse(fs.readFileSync(mainPath, 'utf8').replace(/^\uFEFF/, ''));
const existing = new Set(main.map(row => row.id));
for (const row of draft) {
  if (existing.has(row.id)) throw new Error(`duplicate id ${row.id}`);
  main.push(row);
}
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n');
console.log(JSON.stringify({ appended: draft.length, records: main.length, languageRows: main.length * 2 }));
