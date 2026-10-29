import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-002-uthaymeen.json', 'utf8'));

for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const t = r.text_original.trim();
  const endsAbruptly = t.endsWith('..') || t.endsWith('،') || t.endsWith('و') || t.length < 50;
  console.log(`[${i+1}] ${r.id.slice(0, 8)} | len: ${t.length} | endsWith: "${t.slice(-15)}" | flag: ${endsAbruptly ? 'YES' : 'no'}`);
}

