const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['f3eaa706-1eab-4cfd-b2af-06f23e8bc4d5','063f7465-128b-4b15-9ae0-8e4e2c3bb36b','7374de4d-7dc4-4d07-a154-2df727d2ed3e','7024ccdc-f685-4bce-aa9a-a0dd29624f24','f6d6d729-6af7-4dfe-94d8-aaa88cfbcd9c','65b9e6d0-77c6-4dc6-91d3-8ad28d067848'];
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
  if (rows.length !== 2) throw new Error(`Expected exactly 2 missing rows, got ${rows.length}`);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
