import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-002-uthaymeen.json', 'utf8'));

const damagedIds = new Set([
  'e942fb99-5c68-4433-a192-d89779835490', // in Needs Mo
  'f4f2f06c-8437-4d92-9a06-53ebdf80da8f', // truncated conditional
  '68de1710-d5e9-4cdc-8884-e874eefb55d8', // truncated conditional
]);

const valid = rows.filter(r => !damagedIds.has(r.id));
console.log(`Valid fatwas in batch 2: ${valid.length}`);
fs.writeFileSync('data/german-batches/fatwas-batch-002-valid.json', JSON.stringify(valid, null, 2));
