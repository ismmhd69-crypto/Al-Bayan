const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
process.loadEnvFile('.env');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const ids = ['1eb41f5a-25bf-442a-a076-8aa90d8551ee','23a2930d-7fec-4514-b47b-3117c703324a','fad2cd55-6e8a-4b5c-9f1b-124324bfb660','25caeeab-9ccf-48d6-9ef5-c375e6c365e7','495b2108-eeb1-4cce-8c22-41184ac5f21c','3e566e94-32f2-4b2b-b775-ee8cca7bf554'];
const all = JSON.parse(fs.readFileSync('data/translations/hadith-batch-001-translated.json', 'utf8'));
const translations = all.filter(x => ids.includes(x.id));
const arabic = /[\u0600-\u06ff]/u;
(async () => {
  const { data: sources, error } = await db.from('sources').select('id,text_original').in('id', ids);
  if (error) throw error;
  const sourceMap = new Map(sources.map(x => [x.id, x.text_original]));
  const bad = [];
  for (const x of translations) for (const lang of ['en', 'de']) {
    const text = x[lang];
    const ratio = text.length / sourceMap.get(x.id).length;
    if (ratio < 0.6 || ratio > 3.5) bad.push(`${x.id} ${lang} ratio ${ratio.toFixed(2)}`);
    if (arabic.test(text)) bad.push(`${x.id} ${lang} Arabic`);
    for (const number of sourceMap.get(x.id).match(/\d+/g) || []) if (!text.includes(number)) bad.push(`${x.id} ${lang} missing ${number}`);
  }
  console.log(JSON.stringify({ checked: translations.length, rows: translations.length * 2, bad }));
  if (bad.length) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
