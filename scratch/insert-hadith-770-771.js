process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const fs = require('fs');
const ids = ['2b629f57-8d85-4666-95a0-5b14d837907e','4a201833-e228-42b6-bd30-72aad89a3f28','0ee78242-4449-43c5-a852-505a875e564b','caeabdd7-2529-4e29-bc5a-d182a3e52c7a','a18ce744-bb29-41a3-adda-7bacd6c3ba2b','f03856d6-b05f-41c2-bf86-7d81a6059730'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json','utf8').replace(/^\uFEFF/,''));
const tr = all.filter(x => ids.includes(x.id));
const fail = m => { throw new Error(m); };
(async () => {
  const { data: existing, error: ee } = await db.from('source_translations').select('source_id,lang').in('source_id', ids).in('lang', ['en','de']);
  if (ee) fail(ee.message);
  if (existing.length) fail(`existing translations ${JSON.stringify(existing)}`);
  const rows = tr.flatMap(row => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) fail(error.message);
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch(e => { console.error(e.stack || e); process.exit(1); });
