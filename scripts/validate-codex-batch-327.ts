import fs from "node:fs";
const rows=JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-327.json","utf8")) as any[];
if(rows.length!==30) throw new Error(`expected 30, got ${rows.length}`);
const nums=(s:string)=>[...s.matchAll(/\d+/g)].map(x=>x[0]).filter((x,i,a)=>a.indexOf(x)===i).sort().join(",");
for(const r of rows){for(const lang of ["en","de"]){const t=r.translations?.[lang];if(!t?.trim())throw new Error(`${r.url} empty ${lang}`);if(/[\u0600-\u06ff]/.test(t))throw new Error(`${r.url} Arabic ${lang}`);if(nums(r.text_original)!==nums(t))throw new Error(`${r.url} numbers ${lang}: ${nums(r.text_original)} != ${nums(t)}`);const ratio=t.length/Math.max(1,r.text_original.length);if(ratio<.6||ratio>3.5)throw new Error(`${r.url} ratio ${lang} ${ratio}`);if(lang==="de"&&!/[äöüÄÖÜß]/.test(t))throw new Error(`${r.url} German umlaut`);if(/\[quran\b/i.test(t))throw new Error(`${r.url} Quran tag`);}}
console.log(`validated=${rows.length}`);
