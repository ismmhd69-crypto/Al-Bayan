import fs from 'node:fs';
const path='data/hadith-words-translations/codex-batch-probe9.json';
const rows=JSON.parse(fs.readFileSync(path,'utf8')) as any[];
const keep=new Set(['muslim:1056','muslim:1057a','muslim:1057b','muslim:1058a','muslim:1058b','muslim:1059a','muslim:1059b','muslim:1059c','muslim:1059d','muslim:1059e']);
const skipped=rows.filter(r=>!keep.has(r.url.replace('https://sunnah.com/',''))).map(r=>r.url);
fs.writeFileSync('data/hadith-words-translations/codex-needs-mo-skip-next.txt',fs.readFileSync('data/hadith-words-translations/codex-needs-mo-skip-next.txt','utf8')+skipped.join('\n')+'\n');
console.log('skipped='+skipped.length);
