import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'hadith-translation-repair-2026-10-29', 'filler-repair-drafts.json');
const REF = 'jnietkyxgnocyizvjiel';
const TRANSLATOR = 'gpt-repair-2026-10-29';
const rows = JSON.parse(fs.readFileSync(DATA, 'utf8'));
if (new Set(rows.map(row => row.source_id)).size !== rows.length) throw new Error('Duplicate source IDs in the full repair file');
const batchArg = process.argv.find(a => a.startsWith('--batch='))?.split('=')[1];
const apply = process.argv.includes('--apply');
if (!batchArg || !/^\d{3}$/.test(batchArg)) throw new Error('Pass --batch=001 through --batch=005');
const batchNumber = Number(batchArg);
if (batchNumber < 1 || batchNumber > Math.ceil(rows.length / 30)) throw new Error(`Batch must be between 001 and ${String(Math.ceil(rows.length / 30)).padStart(3, '0')}`);
const start = (batchNumber - 1) * 30;
const batch = rows.slice(start, Math.min(start + 30, rows.length));
if (!batch.length) throw new Error(`Batch ${batchArg} has no rows`);

const arabicScript = /[\u0600-\u06ff]/u;
const chainStart = /^(?:و?حَدَّثَنَا|و?أَخْبَرَنَا|و?حَدَّثَنِي|و?أَخْبَرَنِي)/u;
const prophetHonorific = /صلى\s+الله\s+عليه\s+وسلم/u;
const companionHonorific = /رضي\s+الله\s+عن(?:ه|ها|هما|هم)/u;
for (const row of batch) {
  if (!/complete report preserves/i.test(row.before ?? '')) throw new Error(`${row.url}: current text does not contain the expected filler`);
  if (!row.after?.trim()) throw new Error(`${row.url}: translation is empty`);
  if (/complete report preserves/i.test(row.after)) throw new Error(`${row.url}: filler remains`);
  if (arabicScript.test(row.after)) throw new Error(`${row.url}: Arabic script remains in English`);
  if (chainStart.test(row.arabic) && !/(narrated to us|informed us|told us)/i.test(row.after)) throw new Error(`${row.url}: opening chain phrase is missing`);
  if (prophetHonorific.test(row.arabic) && !row.after.includes('(peace be upon him)')) throw new Error(`${row.url}: Prophet honorific is missing`);
  if (companionHonorific.test(row.arabic) && !/may Allah be pleased with (him|her|them)/i.test(row.after)) throw new Error(`${row.url}: Companion honorific is missing`);
  const ratio = row.after.length / Math.max(1, row.arabic.length);
  if (ratio < 0.6 || ratio > 3.5) throw new Error(`${row.url}: English/Arabic length ratio ${ratio.toFixed(2)}`);
  for (const match of row.arabic.matchAll(/quran sura="(\d+)" aya_start="(\d+)"/g)) {
    if (!row.after.includes(`(Quran ${match[1]}:${match[2]})`)) throw new Error(`${row.url}: missing Quran ${match[1]}:${match[2]}`);
  }
  if (!row.current_translation_id || !row.planned_version) throw new Error(`${row.url}: dry-run identity or version is missing`);
}
if (new Set(batch.map(x => x.source_id)).size !== batch.length) throw new Error('Duplicate source IDs in batch');

console.log(`Batch ${batchArg} dry run: ${batch.length} English translations; versions ${Math.min(...batch.map(x => x.planned_version))}-${Math.max(...batch.map(x => x.planned_version))}; ${batch.reduce((n,x)=>n+x.expected_old_published,0)} older published rows planned for unpublishing.`);
if (!apply) {
  console.log('No database writes made. Review the five sample pairs and wait for Mo\'s OK before applying.');
  process.exit(0);
}
if (process.env.REPAIR_TRANSLATIONS_APPROVED !== 'yes') throw new Error('Set REPAIR_TRANSLATIONS_APPROVED=yes only after Mo explicitly approves the sample translations.');
if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error('Management API token is unavailable');

const payload = batch.map(row => ({
  source_id: row.source_id,
  current_translation_id: row.current_translation_id,
  current_text: row.before,
  expected_arabic: row.arabic,
  new_text: row.after,
  expected_version: row.planned_version,
  expected_old_published: row.expected_old_published,
}));
const payloadLiteral = `'${JSON.stringify(payload).replaceAll("'", "''")}'::jsonb`;
const query = `DO $repair$
DECLARE
  items jsonb := ${payloadLiteral};
  item record;
  item_count integer;
  seen_count integer;
  max_version integer;
  current_count integer;
  published_count integer;
  changed_count integer;
  inserted_count integer := 0;
BEGIN
  SELECT count(*) INTO item_count FROM jsonb_to_recordset(items) AS p(source_id uuid, current_translation_id uuid, current_text text, expected_arabic text, new_text text, expected_version integer, expected_old_published integer);
  SELECT count(DISTINCT source_id) INTO seen_count FROM jsonb_to_recordset(items) AS p(source_id uuid, current_translation_id uuid, current_text text, expected_arabic text, new_text text, expected_version integer, expected_old_published integer);
  IF item_count <> ${payload.length} OR seen_count <> item_count THEN RAISE EXCEPTION 'Batch count or uniqueness check failed'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(items) AS p(source_id uuid, current_translation_id uuid, current_text text, expected_arabic text, new_text text, expected_version integer, expected_old_published integer)
    LEFT JOIN public.sources s ON s.id = p.source_id
    WHERE s.id IS NULL OR s.kind <> 'hadith' OR s.text_original IS DISTINCT FROM p.expected_arabic
  ) THEN RAISE EXCEPTION 'A batch source is missing or is not a hadith'; END IF;
  FOR item IN SELECT * FROM jsonb_to_recordset(items) AS p(source_id uuid, current_translation_id uuid, current_text text, expected_arabic text, new_text text, expected_version integer, expected_old_published integer)
  LOOP
    SELECT count(*) INTO current_count FROM public.source_translations t
      WHERE t.id = item.current_translation_id AND t.source_id = item.source_id AND t.lang = 'en'
        AND t.origin = 'ai' AND t.published = true AND t.text = item.current_text;
    IF current_count <> 1 THEN RAISE EXCEPTION 'Current published English row changed for source %', item.source_id; END IF;
    SELECT COALESCE(max(t.version), 0) INTO max_version FROM public.source_translations t
      WHERE t.source_id = item.source_id AND t.lang = 'en';
    IF max_version + 1 <> item.expected_version THEN RAISE EXCEPTION 'Version changed for source %', item.source_id; END IF;
    SELECT count(*) INTO current_count FROM public.source_translations t
      WHERE t.source_id = item.source_id AND t.lang = 'en' AND t.published = true AND t.version <= max_version;
    IF current_count <> item.expected_old_published THEN RAISE EXCEPTION 'Published English row count changed for source %', item.source_id; END IF;
    UPDATE public.source_translations t SET published = false
      WHERE t.source_id = item.source_id AND t.lang = 'en' AND t.published = true AND t.version <= max_version;
    GET DIAGNOSTICS changed_count = ROW_COUNT;
    IF changed_count <> item.expected_old_published THEN RAISE EXCEPTION 'Unpublish count mismatch for source %', item.source_id; END IF;
    INSERT INTO public.source_translations(source_id, lang, text, origin, translator, version, published)
      VALUES (item.source_id, 'en', item.new_text, 'ai', '${TRANSLATOR}', item.expected_version, true);
    GET DIAGNOSTICS changed_count = ROW_COUNT;
    IF changed_count <> 1 THEN RAISE EXCEPTION 'Insert count mismatch for source %', item.source_id; END IF;
    inserted_count := inserted_count + changed_count;
    SELECT count(*) INTO published_count FROM public.source_translations t
      WHERE t.source_id = item.source_id AND t.lang = 'en' AND t.published = true;
    IF published_count <> 1 THEN RAISE EXCEPTION 'Published English invariant failed for source %', item.source_id; END IF;
  END LOOP;
  IF inserted_count <> item_count THEN RAISE EXCEPTION 'Batch insert count mismatch'; END IF;
  RAISE NOTICE 'Hadith translation repair batch ${batchArg} applied: % rows', inserted_count;
END;
$repair$;`;

const response = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const body = await response.text();
let result;
try { result = JSON.parse(body); } catch { result = null; }
if (!response.ok || (result && !Array.isArray(result) && typeof result === 'object' && result.error)) {
  throw new Error(`Batch ${batchArg} SQL request failed with HTTP ${response.status}: ${body.slice(0, 1500)}`);
}
console.log(`Management API accepted batch ${batchArg} SQL. Run the verification query before logging the batch.`);
