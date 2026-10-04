import fs from 'node:fs';

const path = 'data/hadith-words-translations/codex-batch-310.json';
const rows = JSON.parse(fs.readFileSync(path, 'utf8')) as any[];
const skipped = new Set(['https://sunnah.com/muslim:979f', 'https://sunnah.com/muslim:982b', 'https://sunnah.com/muslim:982d', 'https://sunnah.com/muslim:983', 'https://sunnah.com/muslim:985a', 'https://sunnah.com/muslim:985b', 'https://sunnah.com/muslim:985c']);
const kept = rows.filter((row) => !skipped.has(row.url));
fs.writeFileSync(path, JSON.stringify(kept, null, 2) + '\n');
fs.writeFileSync('data/hadith-words-translations/codex-out-310.json', JSON.stringify(kept.map((row) => ({ id: row.id, en: row.translations.en, de: row.translations.de })), null, 2) + '\n');
console.log(`kept=${kept.length} skipped=${rows.length - kept.length}`);
