const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const ids = [
  'ef3aadc2-900e-4685-b55c-7eb6c0743c13',
  '1208f016-6a3b-4dcf-a0f7-c824d1cfe9e1',
  '2c271018-62f0-4ed6-8341-537b1c3d75ca',
  '1fe652d9-62ba-40d9-828f-30d083050a81',
  '28ac7d5f-c4f0-4a26-8761-2027eefadd89'
];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8').replace(/^\uFEFF/, ''));
const tr = all.filter((row) => ids.includes(row.id));
const hasArabic = (text) => Array.from(text).some((char) => {
  const code = char.codePointAt(0);
  return code >= 0x600 && code <= 0x6ff;
});
if (tr.length !== 5) throw new Error(`translation count ${tr.length}`);
for (const row of tr) for (const [lang, text] of [['en', row.en], ['de', row.de]]) {
  if (!text.trim() || hasArabic(text) || text.length < 40) throw new Error(`bad ${row.id} ${lang}`);
  if (lang === 'de' && !/[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]/u.test(text)) throw new Error(`no umlaut ${row.id}`);
}
(async () => {
  const { data: sources, error: sourceError } = await db.from('sources').select('id,text_original').in('id', ids);
  if (sourceError) throw sourceError;
  if ((sources ?? []).length !== 5) throw new Error(`source count ${(sources ?? []).length}`);
  const sourceMap = new Map(sources.map((row) => [row.id, row.text_original]));
  for (const row of tr) for (const lang of ['en', 'de']) {
    const ratio = row[lang].length / sourceMap.get(row.id).length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`ratio ${row.id} ${lang} ${ratio}`);
  }
  const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids);
  if (existingError) throw existingError;
  if ((existing ?? []).length) throw new Error(`existing rows ${existing.length}`);
  const { count: before, error: beforeError } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (beforeError) throw beforeError;
  const rows = tr.flatMap((row) => ['en', 'de'].map((lang) => ({ source_id: row.id, lang, text: row[lang], origin: 'ai', translator: 'manual', published: false })));
  const { error: insertError } = await db.from('source_translations').insert(rows);
  if (insertError) throw insertError;
  const { count: after, error: afterError } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (afterError) throw afterError;
  console.log(JSON.stringify({ before, inserted: rows.length, after }));
})().catch((error) => { console.error(error); process.exit(1); });
