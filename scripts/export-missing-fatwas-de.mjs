import fs from 'node:fs';

const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;

const query = `
select
  s.id,
  s.kind,
  s.collection,
  s.url,
  s.title,
  s.reference,
  s.text_original,
  s.published,
  sch.name_en as scholar_name,
  (select count(*) from public.source_translations t where t.source_id = s.id and t.lang = 'en') as en_count,
  (select text from public.source_translations t where t.source_id = s.id and t.lang = 'en' limit 1) as en_text
from public.sources s
left join public.scholars sch on sch.id = s.scholar_id
where s.kind = 'fatwa'
  and not exists (
    select 1 from public.source_translations t where t.source_id = s.id and t.lang = 'de'
  )
order by sch.name_en, s.collection, s.id;
`;

async function run() {
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
  console.log(`Fetched ${rows.length} missing German fatwas`);
  fs.mkdirSync('data/german-batches', { recursive: true });
  fs.writeFileSync('data/german-batches/missing-fatwas.json', JSON.stringify(rows, null, 2));
}

run();

