import fs from 'node:fs';
const mainPath = 'data/translations/hadith-batch-001-translated.json';
const draftPath = 'scratch/hadith-batch-912-913-draft.json';
const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const ids = new Set(main.map(x => x.id));
for (const row of draft) {
  if (ids.has(row.id)) throw new Error(`duplicate id ${row.id}`);
  main.push(row);
  ids.add(row.id);
}
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n', 'utf8');
console.log(`appended ${draft.length}; total ${main.length}`);
