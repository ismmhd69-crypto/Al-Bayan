import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-317.json','utf8')) as any[];
if(rows.length!==30)throw new Error('count '+rows.length);
const nums=(s:string)=>[...s.matchAll(/\d+/g)].map(x=>x[0]).filter((x,i,a)=>a.indexOf(x)===i).sort().join(',');
for(const r of rows){for(const [l,v] of [['en',r.translations.en],['de',r.translations.de]] as const){if(!v.trim())throw new Error(r.url+' '+l+' empty');if(/[\u0600-\u06ff]/u.test(v))throw new Error(r.url+' '+l+' Arabic');if(/\[quran\s/u.test(v))throw new Error(r.url+' tag');if(nums(r.text_original)!==nums(v))throw new Error(r.url+' '+l+' numbers');const q=v.length/Math.max(1,r.text_original.length);if(q<.6||q>3.5)throw new Error(r.url+' '+l+' ratio '+q.toFixed(2));}if(!/[äöüÄÖÜß]/u.test(r.translations.de))throw new Error(r.url+' umlaut');}
console.log('validated='+rows.length);
