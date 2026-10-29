import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-001-binbaz.json', 'utf8'));

rows.forEach((r, idx) => {
  console.log(`[${idx + 1}] ID: ${r.id} | ${r.title} | ${r.reference}`);
  console.log(`Arabic: ${r.text_original}`);
  console.log('---');
});

