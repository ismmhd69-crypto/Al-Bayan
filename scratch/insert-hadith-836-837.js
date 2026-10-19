const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['9ab8b252-3cb4-4f84-8ab2-f9f762c0dcb8','1a6020e6-d1f6-4c1b-926c-1c37c0f3706e','c924f722-91f7-402b-99b2-6cac39ca5127','bd4fc599-5cd8-4b9a-9001-91158f75b9dc','ad3c4b21-f904-4eca-9fa4-22e2278b7d76','9fa986e4-4604-4c27-90a4-8cb74c5b225c'];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const main = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
(async () => {
  const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids).in('lang', ['en', 'de']);
  if (existingError) throw existingError;
  if (existing.length) throw new Error(`Existing translation rows found: ${JSON.stringify(existing)}`);
  const rows = main.filter((row) => ids.includes(row.id)).flatMap((row) => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
