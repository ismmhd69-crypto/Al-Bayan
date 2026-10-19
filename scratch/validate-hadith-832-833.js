const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['63d1e8c5-d148-4ce6-8218-894289588c73'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-832-833.json', 'utf8'));
const arabic = /[\u0600-\u06ff]/;
const german = /[äöüÄÖÜß]/;
if (rows.length !== 1 || new Set(rows.map((row) => row.id)).size !== 1) throw new Error('Draft count or IDs invalid');
for (const row of rows) {
  if (!row.en || !row.de || arabic.test(row.en) || arabic.test(row.de)) throw new Error(`Text validation failed for ${row.id}`);
  if (!german.test(row.de) || row.en.length < 40 || row.de.length < 40) throw new Error(`Language validation failed for ${row.id}`);
}
(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const { data: sources, error } = await db.from('sources').select('id,text_original').in('id', ids);
  if (error) throw error;
  if (sources.length !== 1) throw new Error(`Expected 1 source row, got ${sources.length}`);
  const ratio = Math.max(rows[0].en.length, rows[0].de.length) / sources[0].text_original.length;
  if (ratio < 0.6 || ratio > 3.5) throw new Error(`Length ratio failed: ${ratio}`);
  console.log(JSON.stringify({ draft: rows.length, sources: sources.length, validated: true, ratio }));
})().catch((error) => { console.error(error); process.exit(1); });
