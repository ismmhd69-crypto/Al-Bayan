const REF = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;

const query = `
select origin, translator, published, count(*)
from public.source_translations
where lang = 'de'
group by origin, translator, published;
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
