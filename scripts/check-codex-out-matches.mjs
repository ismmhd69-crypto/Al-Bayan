import fs from 'node:fs';
import path from 'node:path';

const dir = 'data/hadith-words-translations';
const missingBukhari = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-bukhari.json', 'utf8'));
const missingMuslim = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-muslim.json', 'utf8'));

const bukhariSet = new Set(missingBukhari.map(b => b.id));
const muslimSet = new Set(missingMuslim.map(m => m.id));

let foundBukhari = 0;
let foundMuslim = 0;
const sampleMatches = [];

const files = fs.readdirSync(dir).filter(f => f.includes('out') && f.endsWith('.json'));
console.log(`Checking ${files.length} out files...`);

for (const file of files) {
  try {
    const items = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const item of items) {
      if (item.de?.trim()) {
        if (bukhariSet.has(item.id)) {
          foundBukhari++;
          bukhariSet.delete(item.id);
          if (sampleMatches.length < 5) sampleMatches.push({ coll: 'Bukhari', file, item });
        }
        if (muslimSet.has(item.id)) {
          foundMuslim++;
          muslimSet.delete(item.id);
          if (sampleMatches.length < 10) sampleMatches.push({ coll: 'Muslim', file, item });
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}

console.log(`Found German translations in codex-out files:`);
console.log(`Bukhari matches: ${foundBukhari}`);
console.log(`Muslim matches: ${foundMuslim}`);
console.log('Sample matches:', JSON.stringify(sampleMatches.slice(0, 3), null, 2));
