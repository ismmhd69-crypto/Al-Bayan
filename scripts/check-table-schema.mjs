const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;

const query = `
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='source_translations'
order by ordinal_position;
`;

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
