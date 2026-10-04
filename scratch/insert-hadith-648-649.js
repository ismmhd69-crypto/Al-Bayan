const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = [
  'f45d6ed2-2fe9-4c18-95c2-fe03ff0a9a8c',
  'ad6545ee-59bc-4f7d-991f-ea7c2588044a',
  'e1aa01c9-e655-4c93-a420-de2dfe4fd7f8',
  '094cfc2a-4e86-4fd0-91df-3a3c1e39423b',
  '19601f7c-2da1-4604-8e8e-b6e2fe7a4029',
  'af855e0b-f058-411e-a3cf-d9b6a463d581'
];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8').replace(/^\uFEFF/, ''));
const tr = all.filter(x => ids.includes(x.id));
const hasArabic = text => Array.from(text).some(c => { const n = c.codePointAt(0); return n >= 0x600 && n <= 0x6ff; });
if (tr.length !== 6) throw new Error(`translation count ${tr.length}`);
for (const x of tr) for (const [lang, text] of [['en', x.en], ['de', x.de]]) {
  if (!text.trim() || hasArabic(text) || text.length < 40) throw new Error(`bad ${x.id} ${lang}`);
  if (lang === 'de' && !/[äöüÄÖÜß]/u.test(text)) throw new Error(`no umlaut ${x.id}`);
}
(async () => {
  const { data: sources, error: e1 } = await db.from('sources').select('id,text_original').in('id', ids);
  if (e1) throw e1;
  if ((sources || []).length !== 6) throw new Error(`source count ${(sources || []).length}`);
  const sourceMap = new Map(sources.map(x => [x.id, x.text_original]));
  for (const x of tr) for (const lang of ['en', 'de']) {
    const ratio = x[lang].length / sourceMap.get(x.id).length;
    if (ratio < 0.6 || ratio > 3.5) throw new Error(`ratio ${x.id} ${lang} ${ratio}`);
  }
  const { data: existing, error: e2 } = await db.from('source_translations').select('source_id,lang').in('source_id', ids);
  if (e2) throw e2;
  if ((existing || []).length) throw new Error(`existing rows ${existing.length}`);
  const { count: before, error: e3 } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (e3) throw e3;
  const rows = tr.flatMap(x => ['en', 'de'].map(lang => ({ source_id: x.id, lang, text: x[lang], origin: 'ai', translator: 'manual', published: false })));
  const { error: e4 } = await db.from('source_translations').insert(rows);
  if (e4) throw e4;
  const { count: after, error: e5 } = await db.from('source_translations').select('*', { count: 'exact', head: true });
  if (e5) throw e5;
  console.log(JSON.stringify({ before, inserted: rows.length, after }));
})().catch(e => { console.error(e); process.exit(1); });
