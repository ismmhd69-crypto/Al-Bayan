import fs from 'node:fs';

const muslim = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-muslim.json', 'utf8'));

console.log(`Total Muslim: ${muslim.length}`);
console.log('First 5 URLs:', muslim.slice(0, 5).map(m => m.url));
console.log('Last 5 URLs:', muslim.slice(-5).map(m => m.url));
