const fs = require('fs');
const path = require('path');
const mainPath = path.resolve('data/translations/hadith-batch-001-translated.json');
const draftPath = path.resolve('scratch/hadith-batch-876-877.json');
const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const ids = new Set(main.map(row => row.id));
for (const row of draft) { if (ids.has(row.id)) throw new Error(`duplicate id: ${row.id}`); main.push(row); ids.add(row.id); }
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n');
console.log(JSON.stringify({ added: draft.length, total: main.length }));
