const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['6e407ac6-1b7d-48c7-86ca-092198002dd9','9a90bea1-f59b-4806-98ed-143c76201bcb','a462f714-93ff-43bd-9446-6123c4739b85','5324fd05-dea5-44ba-8cca-52c631836e42','59b856b0-4327-4811-9ae4-d9771eb2eec7','1737cd12-4b69-4480-a1f4-79f1ebb18779'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-838-839.json', 'utf8'));
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
