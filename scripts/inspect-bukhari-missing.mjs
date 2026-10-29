import fs from 'node:fs';

const bukhari = JSON.parse(fs.readFileSync('data/german-batches/missing-hadiths-bukhari.json', 'utf8'));

console.log(`Total Bukhari: ${bukhari.length}`);
console.log('First 5 URLs:', bukhari.slice(0, 5).map(b => b.url));
console.log('Last 5 URLs:', bukhari.slice(-5).map(b => b.url));
