process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const fs = require('fs');
const ids = ['bc1da5c1-68df-4de2-b5bd-85627468eb08','da647dc5-b9b6-496d-9b07-3708e80db8bf','cd69775c-bbe8-41ce-858b-094c9a1e0b2e','4202417f-a489-42e5-8614-779a2d588103','73ae6281-4f04-4b96-b9e4-948101502116','f8556fa2-81f8-4b0c-ade7-09fdd6cc960b'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json','utf8').replace(/^\uFEFF/,''));
const fail = m => { throw new Error(m); };
(async () => {
  const { data: existing, error: ee } = await db.from('source_translations').select('source_id,lang').in('source_id', ids).in('lang', ['en','de']);
  if (ee) fail(ee.message);
  if (existing.length) fail(`existing translations ${JSON.stringify(existing)}`);
  const rows = all.filter(x => ids.includes(x.id)).flatMap(row => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) fail(error.message);
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch(e => { console.error(e.stack || e); process.exit(1); });
