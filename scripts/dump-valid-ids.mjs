import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-001-valid.json', 'utf8'));

items.forEach((item, i) => {
  console.log(`INDEX_${i+1}_ID: "${item.id}" | TITLE: ${item.title}`);
});
