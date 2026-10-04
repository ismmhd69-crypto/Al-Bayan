const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const ids = [
  '305bea43-a850-4114-bc5c-230d4ea0c07d',
  'b3786531-187c-4b1e-86b9-b00ea9a47617',
  '57a46480-264b-4cc9-b35a-7b6dcedf7283',
  'e2744d1e-0c31-4f59-b6f0-8be1983f4312',
  'e11b7b1f-f359-415c-a8a2-6f5a1147594d',
  'f292d2d6-559b-4ee1-8e5c-a82507cbf52b'
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
