import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { searchText } from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-10-02)";
const batchName = String(process.argv[2] ?? "").padStart(4, "0");
if (!/^\d{4}$/.test(batchName)) throw new Error("usage: import-approved-binbaz-sweep.ts <batch-number>");

type Candidate = { internalId: number; reference: number; title: string; url: string; quote: string };
type Decisions = { approved: Array<number | string>; rejected?: Record<string, string>; needsMo?: Record<string, string>; imported?: number };

async function count(db: any, table: "sources" | "source_search_documents") {
  const query = db.from(table).select("id", { count: "exact", head: true });
  const { count: total, error } = await query;
  if (error) throw error;
  return total ?? 0;
}

async function main() {
  const batchPath = `docs/binbaz-sweep-candidates/batch-${batchName}.json`;
  const decisionsPath = `docs/binbaz-sweep-candidates/batch-${batchName}-decisions.json`;
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8")) as { candidates: Candidate[] };
  const decisions = JSON.parse(fs.readFileSync(decisionsPath, "utf8")) as Decisions;
  const approved = new Set(decisions.approved.map(String));
  const items = batch.candidates.filter((c) => approved.has(String(c.internalId)) || approved.has(String(c.reference)));
  if (items.length !== approved.size) throw new Error(`approved IDs not all found in batch: ${items.length} of ${approved.size}`);
  for (const c of items) {
    if (!Number.isInteger(c.reference) || c.quote.length < 200 || c.quote.length > 600 || !c.url.includes(`/fatwas/${c.reference}/`)) {
      throw new Error(`candidate failed import shape checks: ${c.internalId}`);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment is missing");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const beforeSources = await count(db, "sources");
  const beforeDocs = await count(db, "source_search_documents");
  const existingUrls: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: existing, error: existingError } = await db.from("sources").select("url").eq("scholar_id", "ibn-baz").range(from, from + 999);
    if (existingError) throw existingError;
    existingUrls.push(...(existing ?? []).map((row) => row.url));
    if (!existing || existing.length < 1000) break;
  }
  const have = new Set(existingUrls);
  let inserted = 0;
  let skipped = 0;
  for (const c of items) {
    if (have.has(c.url)) {
      skipped++;
      continue;
    }
    const { data: source, error: sourceError } = await db.from("sources").insert({
      kind: "fatwa",
      scholar_id: "ibn-baz",
      title: c.title.slice(0, 300),
      reference: `binbaz.org.sa, fatwa ${c.reference}`,
      collection: "binbaz.org.sa",
      language: "ar",
      text_original: c.quote,
      url: c.url,
      rights_id: RIGHTS_ID,
      published: true,
    }).select("id").single();
    if (sourceError || !source) throw new Error(`source insert failed for ${c.reference}: ${sourceError?.message}`);
    const { error: docError } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: searchText(c.title, c.quote),
      approved: true,
      approved_by: APPROVED_BY,
      approved_at: new Date().toISOString(),
    });
    if (docError) throw new Error(`search document insert failed for ${c.reference}: ${docError.message}`);
    have.add(c.url);
    inserted++;
  }
  const afterSources = await count(db, "sources");
  const afterDocs = await count(db, "source_search_documents");
  if (afterSources - beforeSources !== inserted || afterDocs - beforeDocs !== inserted) {
    throw new Error(`count verification failed: sources +${afterSources - beforeSources}, docs +${afterDocs - beforeDocs}, expected ${inserted}`);
  }
  decisions.imported = (decisions.imported ?? 0) + inserted;
  fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2), "utf8");
  console.log(`batch ${batchName}: inserted ${inserted}, skipped existing ${skipped}; sources ${beforeSources}->${afterSources}; docs ${beforeDocs}->${afterDocs}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
