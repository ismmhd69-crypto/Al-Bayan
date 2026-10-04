const fs = require('fs');
const mainPath = 'data/translations/hadith-batch-001-translated.json';
const draftPath = 'scratch/hadith-batch-734-735.json';
const main = JSON.parse(fs.readFileSync(mainPath, 'utf8').replace(/^\uFEFF/, ''));
const draftText = fs.readFileSync(draftPath, 'utf8').split(/\r?\n/).map(line => {
  const match = line.match(/^(\s*"en": ")(.*)(",?\s*)$/);
  return match ? `${match[1]}${match[2].replaceAll('"', "'")}${match[3]}` : line;
}).join('\n');
const draft = JSON.parse(draftText);
const existing = new Set(main.map(row => row.id));
for (const row of draft) {
  if (existing.has(row.id)) throw new Error(`duplicate id ${row.id}`);
  main.push(row);
}
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n');
console.log(JSON.stringify({ appended: draft.length, records: main.length, languageRows: main.length * 2 }));
