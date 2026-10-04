import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-344.json','utf8')) as Array<{id:string;text_original:string;translation_en:string;translation_de:string}>;
if(rows.length!==30)throw new Error(`Expected 30 rows, got ${rows.length}`);
const nums=(s:string)=>[...new Set([...s.matchAll(/\d+/g)].map(m=>m[0]))].sort().join(',');
for(const r of rows){for(const [lang,v] of [['en',r.translation_en],['de',r.translation_de]] as const){if(!v.trim())throw new Error(`${r.id} ${lang}: empty`);if(/[\u0600-\u06ff]/.test(v))throw new Error(`${r.id} ${lang}: Arabic remains`);if(nums(r.text_original)!==nums(v))throw new Error(`${r.id} ${lang}: numbers changed`);const ratio=v.length/r.text_original.length;if(ratio<.6||ratio>3.5)throw new Error(`${r.id} ${lang}: ratio ${ratio}`);if(/\[quran\b/i.test(v))throw new Error(`${r.id} ${lang}: Quran tag remains`);}if(!/[äöüÄÖÜß]/.test(r.translation_de))throw new Error(`${r.id} de: no umlaut`);}
console.log(`Validated ${rows.length} translations`);
