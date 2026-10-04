import fs from 'node:fs';
const out=JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-298.json','utf8')) as Array<{id:string;url:string;text_original:string;translations:{en:string;de:string}}>;
if(out.length!==1)throw Error(`count ${out.length}`);
for(const r of out){for(const [l,v] of [['en',r.translations.en],['de',r.translations.de]] as const){if(!v.trim())throw Error(`${r.url} ${l} empty`);if(/[\u0600-\u06ff]/u.test(v))throw Error(`${r.url} ${l} Arabic`);if(/\[quran\s/u.test(v))throw Error(`${r.url} tag`);const q=v.length/Math.max(1,r.text_original.length);if(q<.6||q>3.5)throw Error(`${r.url} ${l} ratio ${q.toFixed(2)}`)}if(!/[äöüÄÖÜß]/u.test(r.translations.de))throw Error(`${r.url} umlaut`)}
console.log(`validated=${out.length}`);
