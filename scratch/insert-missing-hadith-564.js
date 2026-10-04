const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const tr = JSON.parse(fs.readFileSync('scratch/hadith-batch-564-565.json', 'utf8'));
const ids = tr.map((x) => x.id);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
(async () => {
  const source = await db.from('sources').select('id, text_original').in('id', ids);
  if (source.error) throw source.error;
  if (source.data.length !== 6) throw new Error(`Expected 6 sources, got ${source.data.length}`);
  const lengths = new Map(source.data.map((x) => [x.id, x.text_original.length]));
  for (const item of tr) for (const lang of ['en', 'de']) {
    const ratio = item[lang].length / lengths.get(item.id);
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`Length ratio ${item.id} ${lang}: ${ratio}`);
  }
  const existing = await db.from('source_translations').select('source_id, lang').in('source_id', ids);
  if (existing.error) throw existing.error;
  const set = new Set(existing.data.map((x) => `${x.source_id}|${x.lang}`));
  const before = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (before.error) throw before.error;
  const rows = tr.flatMap((item) => ['en', 'de'].map((lang) => ({ source_id: item.id, lang, text: item[lang], origin: 'ai', translator: 'manual', published: false }))).filter((x) => !set.has(`${x.source_id}|${x.lang}`));
  if (rows.length) { const inserted = await db.from('source_translations').insert(rows); if (inserted.error) throw inserted.error; }
  const after = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (after.error) throw after.error;
  console.log(JSON.stringify({ before: before.count, existing: existing.data.length, inserted: rows.length, after: after.count }));
})().catch((error) => { console.error(error); process.exit(1); });
