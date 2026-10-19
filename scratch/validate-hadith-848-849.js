const fs = require('fs');
process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const ids = ['bde1b94a-1665-45a0-a218-061663ac64f9','f59347e1-cee0-4cf2-a210-4e03fb2a7167','dfa0c628-08fb-46e6-b746-4bac5a655a82','040c5065-01b0-4913-b50a-fd09db621038','e000a31a-b29b-4dcc-8385-4d14d4e78c5c','8110c301-23a6-41b5-a676-8864729e1655'];
const rows = JSON.parse(fs.readFileSync('scratch/hadith-batch-848-849.json', 'utf8'));
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
