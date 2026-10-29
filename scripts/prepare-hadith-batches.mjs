import fs from 'node:fs';
import path from 'node:path';

const outDir = 'data/german-batches/hadith-inputs';
fs.mkdirSync(outDir, { recursive: true });

function sliceBatches(sourceFile, prefix) {
  const items = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const BATCH_SIZE = 30;
  const numBatches = Math.ceil(items.length / BATCH_SIZE);
  console.log(`${prefix}: ${items.length} items -> ${numBatches} batches of up to ${BATCH_SIZE}`);

  for (let b = 1; b <= numBatches; b++) {
    const start = (b - 1) * BATCH_SIZE;
    const batchItems = items.slice(start, start + BATCH_SIZE);
    const filename = `${prefix}-batch-${String(b).padStart(3, '0')}.json`;
    fs.writeFileSync(path.join(outDir, filename), JSON.stringify(batchItems, null, 2), 'utf8');
  }
}

sliceBatches('data/german-batches/missing-hadiths-bukhari.json', 'bukhari');
sliceBatches('data/german-batches/missing-hadiths-muslim.json', 'muslim');
console.log('All input batches generated cleanly!');
