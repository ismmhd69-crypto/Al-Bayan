const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = [
  '762474b8-1184-4647-b557-411a6ee29c75',
  'c9d588ee-3139-461e-a89e-39137eeee8de',
  '84ede768-c59d-4db0-b123-8ce50f855d40',
  '64989adc-b3cb-4564-b090-2081bc1ed9c7',
  'be0fe605-daf1-4632-af8a-94d221955ba0',
  '378f1a38-83ee-43e6-a60a-a1449dab405f',
];
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
