const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  '4f812271-cd92-4dad-929f-0956c332136e',
  'cdcf44f0-4f1c-427b-a3ab-309d12c8a304',
  '46a96a56-2153-461e-bff1-b01af4bcd4ca',
  '72f037ad-74fb-4c77-a5b1-ea8ef28953c0',
  '98c4f75d-680f-4dc0-b540-eede146dcb3d',
  '60b76fbc-d682-422b-a14a-15d8c27e7070',
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
