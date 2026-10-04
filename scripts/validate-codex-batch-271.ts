import fs from 'node:fs';
const input=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-271-part.json','utf8')) as Array<{id:string,text_original:string}>;
const out=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-out-271-part.json','utf8')) as Array<{id:string,url:string,en:string,de:string}>;
if(out.length!==10)throw Error(`count ${out.length}`);
const nums=(s:string)=>[...s.replace(/\[quran\s+sura="(\d+)"\s+aya_start="(\d+)"\s+aya_end="\d+"\]/gu,'Quran $1:$2').matchAll(/\d+/g)].map(x=>x[0]).sort().join(',');
for(const r of out){const s=input.find(x=>x.id===r.id);if(!s)throw Error(`id ${r.id}`);for(const [l,v] of [['en',r.en],['de',r.de]] as const){if(!v.trim())throw Error(`${r.url} ${l} empty`);if(/[\u0600-\u06ff]/u.test(v))throw Error(`${r.url} ${l} Arabic`);if(/\[quran\s/u.test(v))throw Error(`${r.url} tag`);if(nums(s.text_original)!==nums(v))throw Error(`${r.url} ${l} numbers ${nums(s.text_original)} != ${nums(v)}`);const q=v.length/Math.max(1,s.text_original.length);if(q<.6||q>3.5)throw Error(`${r.url} ${l} ratio ${q.toFixed(2)}`)}if(!/[äöüÄÖÜß]/u.test(r.de))throw Error(`${r.url} umlaut`)}
console.log(`validated=${out.length}`);
