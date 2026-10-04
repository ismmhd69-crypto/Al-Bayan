const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const ids = [
  'b6291717-d648-487c-8d75-2b7c7961d65e',
  '26ed455c-add4-4631-b44f-30b9ce55affe',
  '2f4c53bc-74ef-4ef3-8f7d-1c56a66f126f',
  '0b7855a3-a73e-496d-9896-e6589042e1d6',
  '12e1d57e-0129-4e60-a872-4d557049590d',
  '446d2049-1d84-417e-a1ae-1cf0b22eb8f1'
];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8').replace(/^\uFEFF/, ''));
const tr = all.filter((row) => ids.includes(row.id));
const hasArabic = (text) => Array.from(text).some((char) => {
  const code = char.codePointAt(0);
  return code >= 0x600 && code <= 0x6ff;
});
if (tr.length !== 6) throw new Error(`translation count ${tr.length}`);
for (const row of tr) for (const [lang, text] of [['en', row.en], ['de', row.de]]) {
  if (!text.trim() || hasArabic(text) || text.length < 40) throw new Error(`bad ${row.id} ${lang}`);
  if (lang === 'de' && !/[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]/u.test(text)) throw new Error(`no umlaut ${row.id}`);
}
(async () => {
  const { data: sources, error: sourceError } = await db.from('sources').select('id,text_original').in('id', ids);
  if (sourceError) throw sourceError;
  if ((sources ?? []).length !== 6) throw new Error(`source count ${(sources ?? []).length}`);
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
