import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-001-binbaz.json', 'utf8'));

// Exclude the 3 damaged ones for translation
const damagedIds = new Set([
  '4e6fee0f-2262-47a9-be75-292508b59dc9',
  'a219b561-748f-4387-af4d-a17968a16a52',
  '48777cd6-f614-44ad-9381-0d49c0790450'
]);

const valid = rows.filter(r => !damagedIds.has(r.id));
console.log(`Valid fatwas in batch 1: ${valid.length}`);
fs.writeFileSync('data/german-batches/fatwas-batch-001-valid.json', JSON.stringify(valid, null, 2));

