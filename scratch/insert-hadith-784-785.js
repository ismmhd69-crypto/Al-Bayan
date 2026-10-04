process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const fs = require('fs');
const ids = ['01663c42-ed26-448c-b899-6a3dcf627380','cba19d8a-8cf0-4cf2-9cc6-afc6c2328401','a4a21b1e-56f3-4876-9e27-0af3c8c472e6','d07b5108-30ca-4c29-85ea-d581878e2064','f9a51ca5-6556-4d85-9089-1fe7601cf5d9','547d0d20-1fa2-46a0-8cf1-2d3e92d795ee'];
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
