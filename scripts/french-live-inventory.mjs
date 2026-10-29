import fs from 'node:fs';

const projectRef = 'jnietkyxgnocyizvjiel';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required');

// Read-only source and French-translation inventory. Includes published and
// unpublished source rows so translation coverage cannot hide unpublished gaps.
const query = `
select
  s.kind,
  coalesce(s.collection, 'none') as collection,
  coalesce(sch.name_en, 'none') as scholar_name,
  s.published as source_published,
  count(s.id)::int as total_sources,
  count(t.id)::int as french_rows,
  count(t.id) filter (where t.published)::int as french_published,
  count(t.id) filter (where not t.published)::int as french_unpublished,
  count(t.id) filter (where t.origin = 'ai')::int as french_ai,
  count(t.id) filter (where nullif(btrim(t.text), '') is null)::int as french_blank,
  (count(s.id) - count(t.id))::int as missing_french
from public.sources s
left join public.scholars sch on sch.id = s.scholar_id
left join public.source_translations t on t.source_id = s.id and t.lang = 'fr'
group by s.kind, s.collection, sch.name_en, s.published
order by s.kind, s.collection, sch.name_en, s.published;
`;

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query/read-only`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
if (!response.ok) throw new Error(`Read-only inventory query failed with HTTP ${response.status}`);

const rows = await response.json();
const result = { generated_at: new Date().toISOString(), project_ref: projectRef, read_only: true, rows };
fs.mkdirSync('data/french-batches', { recursive: true });
fs.writeFileSync('data/french-batches/source-inventory.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
const totals = rows.reduce((acc, row) => {
  acc.sources += row.total_sources;
  acc.french_rows += row.french_rows;
  acc.french_published += row.french_published;
  acc.french_unpublished += row.french_unpublished;
  acc.french_blank += row.french_blank;
  acc.missing_french += row.missing_french;
  return acc;
}, { sources: 0, french_rows: 0, french_published: 0, french_unpublished: 0, french_blank: 0, missing_french: 0 });
const byKind = rows.reduce((acc, row) => {
  acc[row.kind] = acc[row.kind] ?? { sources: 0, french_rows: 0, missing_french: 0 };
  acc[row.kind].sources += row.total_sources;
  acc[row.kind].french_rows += row.french_rows;
  acc[row.kind].missing_french += row.missing_french;
  return acc;
}, {});
console.log(JSON.stringify({ ...totals, by_kind: byKind }, null, 2));
