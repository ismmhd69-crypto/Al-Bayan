const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  '1e74408c-083a-426f-9efe-da3f8a1eb13b',
  'bf243e96-6f1e-43e9-98e0-5156fed42fb7',
  'b172630d-40ad-483d-a457-2729521b16b1',
  '1f126796-84c6-4e86-a3e0-0694faa8933d',
  '79b4411f-f348-4749-89f6-2468012dd4fe',
  '1bbab84a-012f-4bb4-9434-d647b70cd9b0',
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
