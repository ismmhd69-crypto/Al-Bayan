const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'b5588b43-809a-4910-88a1-09417ae69c57',
  '87523239-aac5-40e8-9342-ff3b4b8e436b',
  '5e134460-77d2-4949-9861-340eb8dc0539',
  '0d1a3d11-23dd-49b0-a2c7-73b09368b041',
  '342cc25d-a3b5-4616-bd34-a336dc474a99',
  '52cfb06b-dc3d-499d-8c34-e4e238afc0aa'
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
