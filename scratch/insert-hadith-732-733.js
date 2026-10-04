process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = ['9f72293c-eb2d-4b1d-860e-cc548de7bd66','cf00a71c-7c94-4a6e-9ce3-ad0c33fb80a3','5abdde43-b375-4c4a-88e4-b09ebde240d8','7ce2c6e2-dd15-4c3f-aaed-8bef6c5ef3ab','b9cd95bd-5d7e-470f-8443-7ef63ba310d4','4cdf6f22-a233-417e-a1e6-c760c0c7cf5d'];
const tr = JSON.parse(require('fs').readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8').replace(/^\uFEFF/, '')).filter(x => ids.includes(x.id));
const hasArabic = s => Array.from(s).some(c => { const n = c.codePointAt(0); return n >= 0x600 && n <= 0x6ff; });
const fail = msg => { throw new Error(msg); };
(async () => {
  if (tr.length !== ids.length) fail(`translation count ${tr.length}`);
  for (const row of tr) {
    if (!row.en?.trim() || !row.de?.trim() || hasArabic(row.en) || hasArabic(row.de)) fail(`bad translation ${row.id}`);
    if (!/[äöüÄÖÜß]/u.test(row.de)) fail(`German umlaut missing ${row.id}`);
    if (row.en.length < 40 || row.de.length < 40) fail(`translation too short ${row.id}`);
  }
  const { data: sources, error: sourceError } = await db.from('sources').select('id,text_original').in('id', ids);
  if (sourceError) fail(sourceError.message);
  if (sources.length !== ids.length) fail(`source count ${sources.length}`);
  for (const source of sources) {
    const row = tr.find(x => x.id === source.id);
    const enRatio = row.en.length / source.text_original.length;
    const deRatio = row.de.length / source.text_original.length;
    if (enRatio < 0.6 || enRatio > 3.5 || deRatio < 0.6 || deRatio > 3.5) fail(`ratio ${source.id} ${enRatio} ${deRatio}`);
  }
  const { data: existing, error: existingError } = await db.from('source_translations').select('source_id,lang').in('source_id', ids);
  if (existingError) fail(existingError.message);
  if (existing.length) fail(`existing translations ${JSON.stringify(existing)}`);
  const rows = tr.flatMap(row => [
    { source_id: row.id, lang: 'en', text: row.en, origin: 'ai', translator: 'manual', published: false },
    { source_id: row.id, lang: 'de', text: row.de, origin: 'ai', translator: 'manual', published: false },
  ]);
  const { count: before, error: beforeError } = await db.from('source_translations').select('id', { count: 'exact', head: true });
  if (beforeError) fail(beforeError.message);
  const { error: insertError } = await db.from('source_translations').insert(rows);
  if (insertError) fail(insertError.message);
  const { count: after, error: afterError } = await db.from('source_translations').select('id', { count: 'exact', head: true });
  if (afterError) fail(afterError.message);
  console.log(JSON.stringify({ before, inserted: rows.length, after }));
})().catch(err => { console.error(err.stack || err); process.exit(1); });
