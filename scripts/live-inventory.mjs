import fs from 'node:fs';

const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('No SUPABASE_ACCESS_TOKEN in env');
  process.exit(1);
}

const query = `
select
  s.kind,
  coalesce(s.collection, 'none') as collection,
  coalesce(sch.name_en, 'none') as scholar_name,
  s.published as source_published,
  count(s.id) as total_sources,
  count(t.id) as de_translations,
  count(case when t.published = true then 1 end) as de_published_translations,
  count(s.id) - count(t.id) as missing_de
from public.sources s
left join public.scholars sch on sch.id = s.scholar_id
left join public.source_translations t on t.source_id = s.id and t.lang = 'de'
group by s.kind, s.collection, sch.name_en, s.published
order by s.kind, s.collection, sch.name_en, s.published;
`;

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
