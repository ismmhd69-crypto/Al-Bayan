const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['fbb5703e-f97a-4812-bcff-f08f0d86930a','09bac603-f945-4284-a0ad-438c3648bb74','8d140f62-0bdf-4c39-afcb-d853c711d265','2ae1a565-e95b-4b90-b60c-9afaa2e2dbb2','da082bf4-273f-4d3b-95f9-dcc6a4cb1f49','8d4e6085-cfdf-448b-a726-0fd547eeb233'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-850-851.json', 'utf8'));
const arabic = /[\u0600-\u06ff]/;
const german = /[äöüÄÖÜß]/;
if (rows.length !== ids.length || new Set(rows.map((row) => row.id)).size !== ids.length || rows.some((row) => !ids.includes(row.id))) throw new Error('Draft count or IDs invalid');
for (const row of rows) {
  if (!row.en || !row.de || arabic.test(row.en) || arabic.test(row.de)) throw new Error(`Text validation failed for ${row.id}`);
  if (!german.test(row.de) || row.en.length < 40 || row.de.length < 40) throw new Error(`Language validation failed for ${row.id}`);
}
(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const { data: sources, error } = await db.from('sources').select('id,text_original').in('id', ids);
  if (error) throw error;
  if (sources.length !== ids.length) throw new Error(`Expected ${ids.length} source rows, got ${sources.length}`);
  for (const row of rows) {
    const source = sources.find((item) => item.id === row.id);
    const ratio = Math.max(row.en.length, row.de.length) / source.text_original.length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`Length ratio failed for ${row.id}: ${ratio}`);
  }
  console.log(JSON.stringify({ draft: rows.length, sources: sources.length, validated: true }));
})().catch((error) => { console.error(error); process.exit(1); });
