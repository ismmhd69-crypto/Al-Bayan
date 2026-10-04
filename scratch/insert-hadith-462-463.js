const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'e406c510-305c-43bf-9771-0a437bdcf872',
  '57cfa49d-7f26-42f8-b38c-4993d5eacbf2',
  'fef6c730-35d9-481d-8b59-12f09f03272d',
  '59b8a9c0-a930-4ab3-8ea0-f7bae683b7aa',
  'caca965d-9cfd-49b1-b9d8-58429c4b7f65',
  '632b95a3-a35d-42fb-a112-6cf0786e37d8'
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
    const source = sourceMap.get(x.id);
    const ratio = x[lang].length / source.length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`ratio ${x.id} ${lang} ${ratio}`);
    const sourceNumbers = source.replace(/\[quran[^\]]*\]/g, '').match(/\d+/g) || [];
    for (const number of sourceNumbers) {
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
