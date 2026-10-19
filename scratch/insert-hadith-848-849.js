const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['bde1b94a-1665-45a0-a218-061663ac64f9','f59347e1-cee0-4cf2-a210-4e03fb2a7167','dfa0c628-08fb-46e6-b746-4bac5a655a82','040c5065-01b0-4913-b50a-fd09db621038','e000a31a-b29b-4dcc-8385-4d14d4e78c5c','8110c301-23a6-41b5-a676-8864729e1655'];
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
