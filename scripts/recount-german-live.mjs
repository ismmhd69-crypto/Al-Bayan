import fs from 'node:fs';

process.loadEnvFile('.env');
const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;

const query = `
select
  s.kind,
  s.collection,
  count(*) as missing_count
from public.sources s
where not exists (
  select 1 from public.source_translations t where t.source_id = s.id and t.lang = 'de'
)
group by s.kind, s.collection
order by s.kind, s.collection;
`;

async function main() {
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
  console.log('Live missing German translations count:');
  console.table(rows);
}

main();

