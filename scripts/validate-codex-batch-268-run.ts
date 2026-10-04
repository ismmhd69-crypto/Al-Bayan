import fs from 'node:fs';
const input=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-current.json','utf8')) as Array<{id:string,text_original:string}>;
const out=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-out-268-part.json','utf8')) as Array<{id:string,url:string,en:string,de:string}>;
if(out.length!==6) throw new Error(`count ${out.length}`);
for(const r of out){const s=input.find(x=>x.id===r.id);if(!s)throw new Error(`id ${r.id}`);for(const [l,v] of [['en',r.en],['de',r.de]] as const){if(!v.trim())throw new Error(`${r.url} ${l} empty`);if(/[\u0600-\u06ff]/u.test(v))throw new Error(`${r.url} ${l} Arabic`);if(/\[quran\s/u.test(v))throw new Error(`${r.url} tag`);const q=v.length/Math.max(1,s.text_original.length);if(q<.6||q>3.5)throw new Error(`${r.url} ratio ${q}`)}if(!/[äöüÄÖÜß]/u.test(r.de))throw new Error(`${r.url} umlaut`)}
console.log(`validated=${out.length}`);
