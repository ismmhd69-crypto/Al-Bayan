const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'b18e9650-534e-4a53-8cf0-4247583c18ad',
  '9fdcb497-a976-41c7-92f7-4dd8b4accb71',
  '184a4f1d-8a9d-416a-8f06-39b7c7f7c99a',
  'fbcd09f8-280b-4518-8b19-a3bcb07a873a',
  'd078fb9a-4de6-4d9d-a5af-9e7f48a4c121',
  '50d05852-03d1-4ae8-811c-50e1164df41a',
];

(async () => {
  const { data: existing, error: existingError } = await db
    .from('source_translations')
    .select('source_id,lang')
    .in('source_id', ids)
    .in('lang', ['en', 'de']);
  if (existingError) throw existingError;
  if (existing.length) throw new Error('Translation rows already exist: ' + JSON.stringify(existing));

  const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
  const byId = new Map(all.map((row) => [row.id, row]));
  const rows = ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) throw new Error('Missing merged translation: ' + id);
    return [
      { source_id: id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
      { source_id: id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
    ];
  });
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
