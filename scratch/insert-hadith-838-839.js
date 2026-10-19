const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['6e407ac6-1b7d-48c7-86ca-092198002dd9','9a90bea1-f59b-4806-98ed-143c76201bcb','a462f714-93ff-43bd-9446-6123c4739b85','5324fd05-dea5-44ba-8cca-52c631836e42','59b856b0-4327-4811-9ae4-d9771eb2eec7','1737cd12-4b69-4480-a1f4-79f1ebb18779'];
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
