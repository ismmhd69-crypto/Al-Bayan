import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-001.json', 'utf8'));

for (let i = 0; i < 10; i++) {
  const item = items[i];
  console.log(`\n// [${i+1}] ${item.id} | ${item.url}`);
  console.log(`// Arabic: ${item.text_original.slice(0, 300)}...`);
  console.log(`// English: ${item.en_text ? item.en_text.slice(0, 300) : ''}...`);
}

