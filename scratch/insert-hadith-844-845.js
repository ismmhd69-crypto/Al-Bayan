const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['22a702dd-c4f2-4c68-8021-c857e101e837','f6547dc4-fb76-4f29-a01f-f754b6cc8e69','879816a3-5b57-40d6-8e2f-81406dbb63bd','226c090d-5856-4928-a361-c59a17af06d9','e66cba57-7cf4-4b0c-ae42-eb42ab4b093b','d92886c6-3e28-4f6b-8ffc-3263eeeeaca6'];
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
  if (rows.length !== 12) throw new Error(`Expected 12 missing rows, got ${rows.length}`);
  const { error } = await db.from('source_translations').insert(rows);
  if (error) throw error;
  console.log(JSON.stringify({ inserted: rows.length }));
})().catch((error) => { console.error(error); process.exit(1); });
