const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'e530fcc0-cdfd-459e-8e00-e674d6d81c6f',
  '324eaa18-896b-4bb2-af3a-33ed8dedfd75',
  '24f050b4-0d0c-403b-9020-05754f8b633d',
  'db0eb586-b494-41d8-8537-35b99e74fc50',
  'f233c747-ba31-4888-aed8-834813b59966',
  '6b14989e-89e4-4437-a8af-fb07226a1a82',
];

(async () => {
  const { data: existing, error: existingError } = await db
    .from('source_translations')
    .select('source_id,lang')
    .in('source_id', ids)
    .in('lang', ['en', 'de']);
  if (existingError) throw existingError;
  if (existing.length) throw new Error(`Translation rows already exist: ${JSON.stringify(existing)}`);

  const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
  const byId = new Map(all.map((row) => [row.id, row]));
  const rows = ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) throw new Error(`Missing merged translation: ${id}`);
    return [
      { source_id: id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
      { source_id: id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
    ];
  });
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
