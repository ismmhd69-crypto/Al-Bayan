import fs from 'node:fs';

const bukhari = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-bukhari.json', 'utf8'));
const muslim = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-muslim.json', 'utf8'));

function stats(items, name) {
  let longCount = 0; // > 3000 chars
  let medCount = 0;  // 1000 - 3000 chars
  let shortCount = 0; // < 1000 chars
  for (const it of items) {
    const len = it.text_original.length;
    if (len > 3000) longCount++;
    else if (len >= 1000) medCount++;
    else shortCount++;
  }
  console.log(`${name}: total ${items.length} | short (<1k): ${shortCount} | med (1k-3k): ${medCount} | long (>3k): ${longCount}`);
}

stats(bukhari, 'Bukhari');
stats(muslim, 'Muslim');
