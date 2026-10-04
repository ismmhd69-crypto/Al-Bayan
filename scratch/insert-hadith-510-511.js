const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = ['46949b3f-7f51-4210-900b-052b12332b2e','31cac329-ad5a-434e-81ca-b091a51ac237','44993408-0f1d-498a-bfab-8a9be24f0eb6','0cc01a22-76be-45a0-b7c4-9f7d41938b9c','f6414808-9110-4d7a-b2a9-e37afa3a0f40','e688cdc1-58cd-4e8c-af5f-225cbc8bbb5e'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const tr = all.filter(x => ids.includes(x.id));
const hasArabic = text => Array.from(text).some(c => { const n = c.codePointAt(0); return (n >= 0x600 && n <= 0x6ff) || (n >= 0x750 && n <= 0x77f) || (n >= 0x8a0 && n <= 0x8ff); });
const hasUmlaut = text => Array.from(text).some(c => [0xe4,0xf6,0xfc,0xc4,0xd6,0xdc,0xdf].includes(c.codePointAt(0)));
if (tr.length !== 6) throw new Error('translation count ' + tr.length);
for (const x of tr) for (const [lang, text] of [['en', x.en], ['de', x.de]]) {
  if (!text.trim() || hasArabic(text)) throw new Error('bad text ' + x.id + ' ' + lang);
  if (lang === 'de' && !hasUmlaut(text)) throw new Error('no German umlaut ' + x.id);
}
(async () => {
  const { data: sources, error } = await db.from('sources').select('id,text_original').in('id', ids);
  if (error) throw error;
  if (sources.length !== 6) throw new Error('source count ' + sources.length);
  const sourceMap = new Map(sources.map(x => [x.id, x.text_original]));
  for (const x of tr) for (const lang of ['en', 'de']) {
    const ratio = x[lang].length / sourceMap.get(x.id).length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error('ratio ' + x.id + ' ' + lang + ' ' + ratio);
  }
  const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids);
  if (existingError) throw existingError;
  if (existing.length) throw new Error('existing translations ' + JSON.stringify(existing));
  const { count: before, error: countError } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (countError) throw countError;
  const rows = tr.flatMap(x => ['en', 'de'].map(lang => ({ source_id: x.id, lang, text: x[lang], origin: 'ai', translator: 'manual', published: false })));
  const { error: insertError } = await db.from('source_translations').insert(rows);
  if (insertError) throw insertError;
  const { count: after, error: afterError } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (afterError) throw afterError;
  console.log(JSON.stringify({ before, inserted: rows.length, after }));
})().catch(error => { console.error(error); process.exit(1); });
