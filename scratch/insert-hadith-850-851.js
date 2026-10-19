const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['fbb5703e-f97a-4812-bcff-f08f0d86930a','09bac603-f945-4284-a0ad-438c3648bb74','8d140f62-0bdf-4c39-afcb-d853c711d265','2ae1a565-e95b-4b90-b60c-9afaa2e2dbb2','da082bf4-273f-4d3b-95f9-dcc6a4cb1f49','8d4e6085-cfdf-448b-a726-0fd547eeb233'];
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
