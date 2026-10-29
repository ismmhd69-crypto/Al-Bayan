import fs from 'node:fs';

const all = JSON.parse(fs.readFileSync('data/german-batches/missing-fatwas.json', 'utf8'));

const binbaz = all.filter(f => f.scholar_name?.toLowerCase().includes('baz'));
const uthaymeen = all.filter(f => f.scholar_name?.toLowerCase().includes('uthaymeen'));

console.log(`Bin Baz: ${binbaz.length}, Uthaymeen: ${uthaymeen.length}`);

fs.writeFileSync('data/german-batches/fatwas-batch-001-binbaz.json', JSON.stringify(binbaz, null, 2));
fs.writeFileSync('data/german-batches/fatwas-batch-002-uthaymeen.json', JSON.stringify(uthaymeen, null, 2));
