import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const PROJECT = "jnietkyxgnocyizvjiel";
const API = `https://api.supabase.com/v1/projects/${PROJECT}/database/query/read-only`;
const collections = ["Sahih al-Bukhari", "Sahih Muslim"] as const;
type Collection = (typeof collections)[number];
type Rights = { id: string; owner: string; status: string; ai_processing_allowed: boolean; translation_index_allowed: boolean; expires_at: string | null };
type SourceRow = { id: string; kind: string; collection: Collection; url: string; reference: string | null; title: string | null; text_original: string; published: boolean; french_rows: number; french_blank_rows: number };

const collectionArg = process.argv.find((arg) => arg.startsWith("--collection="))?.slice("--collection=".length) ?? "Sahih al-Bukhari";
if (!collections.includes(collectionArg as Collection)) throw new Error("unsupported_hadith_collection");
const collection = collectionArg as Collection;
const limitArg = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.slice(8) ?? "6");
if (!Number.isInteger(limitArg) || limitArg < 1 || limitArg > 6) throw new Error("hadith_batch_limit_must_be_1_to_6");
const out = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6) ?? "data/french-batches/library/hadith-001.json";
const maxSourceChars = 2_000;
const directory = path.dirname(out);

async function query(sql: string) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("management_read_token_missing");
  const response = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`read_only_query_http_${response.status}`);
  return response.json() as Promise<unknown>;
}

async function main() {
  if (fs.existsSync(out)) throw new Error("output_path_already_exists");
  const priorDraftIds = new Set<string>();
  let cursorNumber = 0;
  let cursorSuffix = "";
  if (fs.existsSync(directory)) {
    const collectionPrefix = collection === "Sahih al-Bukhari" ? "hadith-bukhari-" : "hadith-muslim-";
    for (const name of fs.readdirSync(directory).filter((name) => name.startsWith(collectionPrefix) && /^hadith-(?:bukhari|muslim)-\d+\.json$/u.test(name))) {
      const prior = JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as { items?: Array<{ source_id?: string; url?: string; text_french?: string; draft_status?: string }>; needs_mo?: Array<{ source_id?: string; url?: string }> };
      const processed: Array<{ source_id?: string; url?: string }> = [];
      for (const item of prior.items ?? []) {
        if (item.text_french?.trim() || item.draft_status === "needs_mo_approved_french_quran_translation") processed.push(item);
        else throw new Error("prior_source_batch_has_pending_translations");
      }
      processed.push(...(prior.needs_mo ?? []));
      for (const item of processed) {
        if (item.source_id) priorDraftIds.add(item.source_id);
        const match = item.url?.match(/:(\d+)([a-z]*)$/iu);
        if (!match) continue;
        const number = Number(match[1]), suffix = match[2].toLowerCase();
        if (number > cursorNumber || number === cursorNumber && suffix.localeCompare(cursorSuffix) > 0) {
          cursorNumber = number;
          cursorSuffix = suffix;
        }
      }
    }
  }
  const [sourceResult, rightsResult] = await Promise.all([
    query(`select s.id, s.kind, s.collection, s.url, s.reference, s.title, s.text_original, s.published,
      count(t.id)::int as french_rows,
      count(t.id) filter (where nullif(btrim(t.text), '') is null)::int as french_blank_rows
      from public.sources s
      left join public.source_translations t on t.source_id=s.id and t.lang='fr'
      where s.kind='hadith' and s.collection='${collection}'
        and (substring(s.url from ':([0-9]+)[a-z]*$')::integer > ${cursorNumber}
          or (substring(s.url from ':([0-9]+)[a-z]*$')::integer = ${cursorNumber}
            and lower(coalesce(substring(s.url from ':[0-9]+([a-z]*)$'), '')) > '${cursorSuffix}'))
      group by s.id
      having count(t.id)=0 or count(t.id) filter (where nullif(btrim(t.text), '') is null)>0
      order by substring(s.url from ':([0-9]+)[a-z]*$')::integer nulls last, s.url, s.id
      limit 100`),
    query("select id, owner, status, ai_processing_allowed, translation_index_allowed, expires_at from editorial.source_rights order by owner"),
  ]);
  if (!Array.isArray(sourceResult) || !Array.isArray(rightsResult)) throw new Error("unexpected_read_only_query_result");
  const sources = sourceResult as SourceRow[];
  const rights = rightsResult as Rights[];
  const needsMo: Array<{ source_id: string; url: string; reason: string }> = [];
  const items = [];
  for (const row of sources) {
    const owner = new URL(row.url).hostname.replace(/^www\./u, "");
    const permission = rights.find((right) => right.owner === owner);
    if (row.french_rows > 0) {
      needsMo.push({ source_id: row.id, url: row.url, reason: "existing_blank_french_row_requires_separate_review" });
      continue;
    }
    if (!permission || permission.status !== "granted" || !permission.ai_processing_allowed || (permission.expires_at !== null && Date.parse(permission.expires_at) <= Date.now())) {
      needsMo.push({ source_id: row.id, url: row.url, reason: "source_rights_do_not_authorize_full_text_ai_processing" });
      continue;
    }
    items.push({
      source_id: row.id,
      kind: row.kind,
      collection: row.collection,
      url: row.url,
      reference: row.reference,
      title: row.title,
      source_published: row.published,
      text_original: row.text_original,
      source_hash_sha256: createHash("sha256").update(row.text_original, "utf8").digest("hex"),
      existing_french_rows: row.french_rows,
      rights: {
        owner: permission.owner,
        status: permission.status,
        ai_processing_allowed: permission.ai_processing_allowed,
        translation_index_allowed: permission.translation_index_allowed,
        expires_at: permission.expires_at,
      },
      text_french: "",
      draft_status: "source_export_waiting_for_translation",
      database_inserted: false,
      translation_published: false,
      human_reviewed: false,
    });
  }
  const candidates = items.filter((item) => !priorDraftIds.has(item.source_id));
  const selected: typeof items = [];
  for (const item of candidates) {
    if (item.text_original.length > maxSourceChars) {
      if (selected.length === 0) selected.push(item);
      break;
    }
    selected.push(item);
    if (selected.length >= limitArg) break;
  }
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify({
    batch_id: path.basename(out, ".json").toUpperCase().replace(/[^A-Z0-9]+/gu, "-"),
    content_type: "hadith",
    language: "fr",
    project_ref: PROJECT,
    exported_at: new Date().toISOString(),
    read_only_export: true,
    translation_index_enabled: false,
    public_enabled: false,
    human_reviewed: false,
    max_source_chars_for_multi_item_batch: maxSourceChars,
    items: selected,
    needs_mo: needsMo,
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ collection, eligible_local_drafts: selected.length, deferred_long_source: candidates.find((item) => item.text_original.length > maxSourceChars && item.source_id !== selected[0]?.source_id)?.source_id ?? null, needs_mo: needsMo.length, output: out, database_writes: 0 }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error && /^([a-z0-9_]+|read_only_query_http_[0-9]{3})$/u.test(error.message) ? error.message : "french_hadith_export_failed");
  process.exitCode = 1;
});
