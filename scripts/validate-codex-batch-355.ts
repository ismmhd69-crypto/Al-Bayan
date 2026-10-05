import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-355.json','utf8')) as Array<{id:string;url:string;text_original:string;translation_en:string;translation_de:string}>;
if(rows.length!==30)throw new Error(`count ${rows.length}`);
const nums=(s:string)=>[...new Set([...s.matchAll(/\d+/g)].map(x=>x[0]))].sort();
for(const r of rows){
 if(!r.id||!r.url||!r.translation_en.trim()||!r.translation_de.trim())throw new Error(`missing fields ${r.url}`);
 if(/[\u0600-\u06ff]/.test(r.translation_en)||/[\u0600-\u06ff]/.test(r.translation_de))throw new Error(`Arabic ${r.url}`);
 if(nums(r.text_original).join(',')!==nums(r.translation_en).join(','))throw new Error(`numbers ${r.url}`);
 if(r.translation_en.length/r.text_original.length<.6||r.translation_en.length/r.text_original.length>3.5)throw new Error(`ratio en ${r.url}`);
 if(r.translation_de.length/r.text_original.length<.6||r.translation_de.length/r.text_original.length>3.5)throw new Error(`ratio de ${r.url}`);
 if(!/[äöüÄÖÜß]/.test(r.translation_de))throw new Error(`German umlaut ${r.url}`);
 if(/\[quran\b/i.test(r.translation_en)||/\[quran\b/i.test(r.translation_de))throw new Error(`quran tag ${r.url}`);
}
console.log(`Validated ${rows.length} rows`);
