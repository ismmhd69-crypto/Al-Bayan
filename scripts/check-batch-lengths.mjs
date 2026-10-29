import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-001.json', 'utf8'));

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  console.log(`[${i+1}] ${item.url} | Arabic chars: ${item.text_original.length} | English chars: ${item.en_text ? item.en_text.length : 0}`);
}

