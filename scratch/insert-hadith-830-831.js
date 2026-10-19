const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');

const ids = [
  'ddfc228e-90dc-4614-9bfb-97302192dc5d',
  '942b9470-ba57-4f95-ac06-bba67555672f',
];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const main = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));

(async () => {
  const { data: existing, error: existingError } = await db
    .from('source_translations')
    .select('source_id,lang')
    .in('source_id', ids)
    .in('lang', ['en', 'de']);
  if (existingError) throw existingError;
  if (existing.length) throw new Error(`Existing translation rows found: ${JSON.stringify(existing)}`);

  const rows = main.filter((row) => ids.includes(row.id)).flatMap((row) => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
