process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const fs = require('fs');
const ids = ['a417900d-01c5-47b1-b3fe-9cbf43da292e','8a64a62a-822a-4f73-872b-7731d55043fd','327098d3-2c4e-434f-8b9a-b24c4cfaaf3d','25ca5499-bcf9-4965-903e-46d6f1d27864','98fdd4ca-94b0-44d2-87dc-7ec1c36e6ef6','e197d665-7d1c-46f2-a8f7-53007a6cbf92'];
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
