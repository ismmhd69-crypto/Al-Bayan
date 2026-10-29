import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-002-valid.json', 'utf8'));

let out = '';
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  out += `\n// [${i+1}] ${item.id}: ${item.title}\n`;
  out += `// Arabic: ${item.text_original}\n`;
}
fs.writeFileSync('data/german-batches/batch-002-arabic-dump.txt', out, 'utf8');
console.log(`Wrote batch-002-arabic-dump.txt (${items.length} items)`);
