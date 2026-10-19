const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['f3eaa706-1eab-4cfd-b2af-06f23e8bc4d5','063f7465-128b-4b15-9ae0-8e4e2c3bb36b','7374de4d-7dc4-4d07-a154-2df727d2ed3e','7024ccdc-f685-4bce-aa9a-a0dd29624f24','f6d6d729-6af7-4dfe-94d8-aaa88cfbcd9c','65b9e6d0-77c6-4dc6-91d3-8ad28d067848'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-840-841.json', 'utf8'));
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
