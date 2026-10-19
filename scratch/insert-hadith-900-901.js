process.loadEnvFile('.env');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const draft = JSON.parse(fs.readFileSync('scratch/hadith-batch-900-901.json', 'utf8'));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = draft.map(row => row.id);
(async () => { const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids).in('lang', ['en', 'de']); if (existingError) throw existingError; const keys = new Set(existing.map(row => `${row.source_id}:${row.lang}`)); const rows = draft.flatMap(row => [{ source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false }, { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false }]).filter(row => !keys.has(`${row.source_id}:${row.lang}`)); if (rows.length) { const { error } = await db.from('source_translations').insert(rows); if (error) throw error; } console.log(JSON.stringify({ existing: existing.length, inserted: rows.length })); })().catch(error => { console.error(error.message); process.exit(1); });
