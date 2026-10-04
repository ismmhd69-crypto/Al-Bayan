const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = ['721ffe37-4a1a-4c0d-8467-4cb25726f8ed','7b80c277-d4af-46b7-906d-f1df3a12aba2','fe699bc7-f974-4313-83ee-f9a272539926','32bb4945-9daa-4983-94b4-ae813ee28d82','7f7b26aa-a656-475d-b233-ab2790510600','c3cda6fe-0494-4579-b8a1-bd3add45f80c'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const tr = all.filter(x => ids.includes(x.id));
const hasArabic = text => Array.from(text).some(c => { const n = c.codePointAt(0); return n >= 0x600 && n <= 0x6ff; });
const hasUmlaut = text => Array.from(text).some(c => [0xe4,0xf6,0xfc,0xc4,0xd6,0xdc,0xdf].includes(c.codePointAt(0)));
if (tr.length !== 6) throw new Error('translation count ' + tr.length);
for (const x of tr) for (const [lang, text] of [['en', x.en], ['de', x.de]]) {
  if (!text.trim() || hasArabic(text) || text.length < 40) throw new Error('bad text ' + x.id + ' ' + lang);
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
    const sourceNumbers = (sourceMap.get(x.id).replace(/\[quran[^\]]*\]/g, '').match(/\d+/g) || []);
    for (const n of sourceNumbers) if (!x[lang].includes(n)) throw new Error('missing source number ' + n + ' in ' + x.id + ' ' + lang);
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
