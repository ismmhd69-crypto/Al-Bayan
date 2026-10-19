const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  '63494fa7-e200-42e7-9739-4e12d1adde73',
  'b843626c-8b5f-4604-9170-883dce574158',
  'ab69f9aa-f085-47a4-9b4a-51e76410f20c',
  '532344ae-4612-49db-8cd2-40ec2a92bf4a',
  '15bc0c7e-8dfc-4983-a86c-ed9761516cfa',
  'ce5dae8d-5027-4861-8ad9-b4a9291e0675',
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
