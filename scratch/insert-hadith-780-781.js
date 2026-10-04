process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const fs = require('fs');
const ids = ['4afdd066-b9d7-44df-b92b-4701ccc2d579','e250cad6-2271-4aaf-b9f1-a4b11a86c0a4','b5ec5748-8118-4384-b761-5adb1752df19','37c01695-5c78-4d2c-9f9b-dba0a9c465b6','3552e26f-3b09-4997-817e-b1f77c7a7f99','d332ed1b-e1a8-4bd5-8f02-a1cdaee0822b'];
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
