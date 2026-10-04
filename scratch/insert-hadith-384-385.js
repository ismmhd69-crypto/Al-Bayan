const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = ['87587831-f3ec-4603-a48b-a1c74519ff60','13d559ff-af20-4d0e-b22e-af8724ec2032','a2334284-384c-41af-96f1-3bc365935624','a649250c-4fc6-4b57-a4b2-0e314f288809','e1c7229d-18e7-4069-b9cc-071915d7aa3e','9723f3c5-70bf-4ea6-9c2d-dd7b8a6dcbae'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const tr = all.filter(x => ids.includes(x.id));
const arabic = /[\u0600-\u06ff]/u;
if (tr.length !== 6) throw new Error(`translation count ${tr.length}`);
for (const x of tr) for (const [lang, text] of [['en', x.en], ['de', x.de]]) {
  if (!text.trim() || arabic.test(text) || text.length < 40) throw new Error(`bad ${x.id} ${lang}`);
  if (lang === 'de' && !/[äöüÄÖÜß]/u.test(text)) throw new Error(`no umlaut ${x.id}`);
}
(async () => {
  const { data: sources, error: e1 } = await db.from('sources').select('id,text_original').in('id', ids);
  if (e1) throw e1;
  if ((sources || []).length !== 6) throw new Error(`source count ${(sources || []).length}`);
  const sourceMap = new Map(sources.map(x => [x.id, x.text_original]));
  for (const x of tr) for (const lang of ['en', 'de']) {
    const ratio = x[lang].length / sourceMap.get(x.id).length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`ratio ${x.id} ${lang} ${ratio}`);
    for (const number of sourceMap.get(x.id).match(/\d+/g) || []) if (!x[lang].includes(number)) throw new Error(`number ${number} missing in ${x.id} ${lang}`);
  }
  const { data: existing, error: e2 } = await db.from('source_translations').select('source_id,lang').in('source_id', ids);
  if (e2) throw e2;
  if ((existing || []).length) throw new Error(`existing rows ${existing.length}`);
  const { count: before, error: e3 } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (e3) throw e3;
  const rows = tr.flatMap(x => ['en', 'de'].map(lang => ({ source_id: x.id, lang, text: x[lang], origin: 'ai', translator: 'manual', published: false })));
  const { error: e4 } = await db.from('source_translations').insert(rows);
  if (e4) throw e4;
  const { count: after, error: e5 } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (e5) throw e5;
  console.log(JSON.stringify({ before, inserted: rows.length, after }));
})().catch(e => { console.error(e); process.exit(1); });
