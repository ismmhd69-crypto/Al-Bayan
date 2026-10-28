import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'hadith-translation-repair-2026-10-29');
const REF = 'jnietkyxgnocyizvjiel';
const TRANSLATOR = 'gpt-repair-2026-10-29';
const expectedNew = process.argv.find(a => a.startsWith('--expected-new='))?.split('=')[1];
const baseline = JSON.parse(fs.readFileSync(path.join(DATA, 'live-baseline.json'), 'utf8')).result[0];
if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error('Management API token is unavailable');

const query = `select
  (select count(*) from public.sources where kind='hadith') as hadith_sources,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='en' and t.published=true) as published_english_hadith_rows,
  (select count(*) from public.sources s where s.kind='hadith' and (select count(*) from public.source_translations t where t.source_id=s.id and t.lang='en' and t.published=true) <> 1) as hadiths_without_exactly_one_published_english,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='de') as german_hadith_translation_rows,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='de' and t.published=true) as published_german_hadith_rows,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='en' and t.published=true and t.text ilike '%complete report preserves%') as published_english_filler_rows,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='en' and t.translator='${TRANSLATOR}' and t.published=true) as published_repair_rows,
  (select count(*) from public.source_translations t join public.sources s on s.id=t.source_id where s.kind='hadith' and t.lang='en' and t.origin='ai' and t.published=true and t.text !~* '(narrated to us|informed us|told us)') as published_english_chain_candidates`;

const response = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const body = await response.text();
if (!response.ok) throw new Error(`Verification query failed with HTTP ${response.status}: ${body.slice(0, 1000)}`);
const result = JSON.parse(body);
if (!Array.isArray(result) || result.length !== 1) throw new Error('Unexpected verification query response');
const current = result[0];
const checks = {
  hadith_source_count_unchanged: current.hadith_sources === baseline.hadith_sources,
  one_published_english_per_hadith: current.hadiths_without_exactly_one_published_english === 0 && current.published_english_hadith_rows === current.hadith_sources,
  no_published_english_filler: current.published_english_filler_rows === 0,
  german_row_counts_unchanged: current.german_hadith_translation_rows === baseline.german_hadith_translation_rows && current.published_german_hadith_rows === baseline.published_german_hadith_rows,
};
if (expectedNew !== undefined) checks.repair_row_count_matches = current.published_repair_rows === Number(expectedNew);
const report = { project_ref: REF, current, checks };
fs.writeFileSync(path.join(DATA, 'live-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => value !== true)) process.exit(1);
