import fs from "node:fs";
import { createHash } from "node:crypto";

type HadithDraft = {
  source_id: string;
  collection: string;
  url: string;
  reference: string | null;
  text_original: string;
  source_hash_sha256: string;
  source_published: boolean;
  existing_french_rows: number;
  rights: { status: string; ai_processing_allowed: boolean; translation_index_allowed: boolean };
  text_french: string;
  database_inserted: boolean;
};
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "data/french-batches/library/hadith-bukhari-001.json";
const batch = JSON.parse(fs.readFileSync(file, "utf8")) as { content_type: string; language: string; items: HadithDraft[] };
const errors: string[] = [];
if (batch.content_type !== "hadith" || batch.language !== "fr") errors.push("batch_type_or_language_mismatch");
if (!batch.items.length || batch.items.length > 6) errors.push(`batch_size:${batch.items.length}`);
const ids = new Set<string>();
for (const item of batch.items) {
  if (ids.has(item.source_id)) errors.push(`duplicate_source:${item.source_id}`);
  ids.add(item.source_id);
  if (!item.text_original.trim() || !/[\u0600-\u06ff]/u.test(item.text_original)) errors.push(`missing_arabic_original:${item.source_id}`);
  const hash = createHash("sha256").update(item.text_original, "utf8").digest("hex");
  if (hash !== item.source_hash_sha256) errors.push(`source_hash_mismatch:${item.source_id}`);
  if (!item.text_french.trim()) errors.push(`empty_french_translation:${item.source_id}`);
  if (/<\/?[a-z][^>]*>/iu.test(item.text_french)) errors.push(`raw_markup_in_french:${item.source_id}`);
  if (item.existing_french_rows !== 0) errors.push(`existing_french_row_must_not_be_overwritten:${item.source_id}`);
  if (item.rights.status !== "granted" || !item.rights.ai_processing_allowed) errors.push(`source_rights_not_confirmed:${item.source_id}`);
  if (item.rights.translation_index_allowed === false && item.database_inserted) errors.push(`rights_disallow_translation_index:${item.source_id}`);
  if (item.database_inserted) errors.push(`local_checkpoint_must_not_claim_database_insert:${item.source_id}`);
  if (item.text_original.length > 2_000 && batch.items.length !== 1) errors.push(`long_hadith_must_be_single_item:${item.source_id}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`French hadith batch validated: ${batch.items.length} records; Arabic originals and hashes, IDs, unpublished AI-draft state, rights flags, and single-item long-text rule passed.`);
