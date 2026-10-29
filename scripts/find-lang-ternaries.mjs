import fs from 'node:fs';
import path from 'node:path';

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.next') {
        walk(full, results);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const files = [...walk('app'), ...walk('components'), ...walk('lib')];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('lang === "ar" ?') && !line.includes('lang === "de" ?') && !line.includes('lang === "en" ?')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
}
