import fs from 'node:fs';

const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;

const query = `
select
  s.id,
  s.collection,
  s.url,
  s.reference,
  s.text_original,
  (select text from public.source_translations t where t.source_id = s.id and t.lang = 'en' limit 1) as en_text
from public.sources s
where s.kind = 'hadith'
  and not exists (
    select 1 from public.source_translations t where t.source_id = s.id and t.lang = 'de'
  )
order by s.collection, s.url, s.id;
`;

async function run() {
  console.log('Fetching missing German hadiths...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
  const rows = await res.json();
  console.log(`Total missing German hadiths: ${rows.length}`);
  const bukhari = rows.filter(r => r.collection === 'Sahih al-Bukhari');
  const muslim = rows.filter(r => r.collection === 'Sahih Muslim');
  console.log(`Bukhari: ${bukhari.length}, Muslim: ${muslim.length}`);
  fs.mkdirSync('data/german-batches', { recursive: true });
  fs.writeFileSync('data/german-batches/missing-hadiths-bukhari.json', JSON.stringify(bukhari, null, 2));
  fs.writeFileSync('data/german-batches/missing-hadiths-muslim.json', JSON.stringify(muslim, null, 2));
}

run();

