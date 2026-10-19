process.loadEnvFile('.env');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const draft = JSON.parse(fs.readFileSync('scratch/hadith-batch-910-911.json', 'utf8'));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = draft.map(row => row.id);
if (new Set(ids).size !== 6) throw new Error('draft does not contain six unique ids');
for (const row of draft) { if (!row.en || !row.de || /[\u0600-\u06ff]/.test(row.en + row.de) || !/[äöüÄÖÜß]/.test(row.de)) throw new Error(`text check failed: ${row.id}`); if (row.en.length < 40 || row.de.length < 40) throw new Error(`text too short: ${row.id}`); }
(async () => { const { data, error } = await db.from('sources').select('id,text_original').in('id', ids); if (error) throw error; if (data.length !== 6) throw new Error(`expected 6 source rows, found ${data.length}`); for (const row of draft) { const source = data.find(item => item.id === row.id); const ratio = Math.max(row.en.length, row.de.length) / source.text_original.length; if (ratio < 0.6 || ratio > 3.5) throw new Error(`length ratio failed: ${row.id}`); } console.log(JSON.stringify({ valid: true, count: draft.length })); })().catch(error => { console.error(error.message); process.exit(1); });
