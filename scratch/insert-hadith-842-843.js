const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['b8455814-7dc3-44e6-a026-1afc8478985b','4a3765e8-729a-40e7-b76b-b4163e746b2b','c2018667-28fb-43e5-9ac1-6340621c3843','d4e5e132-42c1-491f-aee1-d1d8ad18b78c','6f394475-508b-4893-a765-8df488ac9f36','d16db1be-c635-41aa-b5be-3d31095108a1'];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const main = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
(async () => {
  const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids).in('lang', ['en', 'de']);
  if (existingError) throw existingError;
  const existingKeys = new Set(existing.map((row) => `${row.source_id}:${row.lang}`));
  const rows = main.filter((row) => ids.includes(row.id)).flatMap((row) => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]).filter((row) => !existingKeys.has(`${row.source_id}:${row.lang}`));
  if (rows.length !== 12) throw new Error(`Expected 12 missing rows, got ${rows.length}`);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
