const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'f1dfdf1b-ad76-4181-b9a6-6fd521841c78',
  '5d8e97cd-7d70-43d1-8b24-7eff3f3b64ba',
  '2a4f58fb-a5e7-4c86-8a9d-c7ca95a3ad8b',
  '9274125e-7b82-4bfc-b566-7707a2eb31d7',
  '655af17a-4189-4643-ab36-678375d4e9d3',
  '0e345572-479f-4f49-abe1-425a6f492a05'
];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const tr = all.filter(x => ids.includes(x.id));
const hasArabic = text => Array.from(text).some(c => {
  const n = c.codePointAt(0);
  return n >= 0x600 && n <= 0x6ff;
});
if (tr.length !== 6) throw new Error(`translation count ${tr.length}`);
for (const x of tr) for (const [lang, text] of [['en', x.en], ['de', x.de]]) {
  if (!text.trim() || hasArabic(text) || text.length < 40) throw new Error(`bad ${x.id} ${lang}`);
  if (lang === 'de' && !/[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]/u.test(text)) throw new Error(`no umlaut ${x.id}`);
}
(async () => {
  const { data: sources, error: e1 } = await db.from('sources').select('id,text_original').in('id', ids);
  if (e1) throw e1;
  if ((sources || []).length !== 6) throw new Error(`source count ${(sources || []).length}`);
  const sourceMap = new Map(sources.map(x => [x.id, x.text_original]));
  for (const x of tr) for (const lang of ['en', 'de']) {
    const ratio = x[lang].length / sourceMap.get(x.id).length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`ratio ${x.id} ${lang} ${ratio}`);
    for (const number of sourceMap.get(x.id).match(/\d+/g) || []) {
      if (!x[lang].includes(number)) throw new Error(`number ${number} missing in ${x.id} ${lang}`);
    }
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
