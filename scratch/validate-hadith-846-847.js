const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['dc119957-7e1b-4f1d-8738-3a0dcbb4e1f5','9a6eb166-01b7-4ef2-afd9-31957ab7c76c','286dae4c-3683-47cb-b0d3-d1a4f64bf827','98ddcbf8-7342-49f2-a49d-b7587c9416af','0bb4dd80-06d8-4621-97e6-4543aab9ef06','0e7e1052-3499-45a0-889f-f0a0e64aadfb'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-846-847.json', 'utf8'));
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
