// Inserts ONLY the items I approved by hand for one batch (Ibn Baz, binbaz.org.sa).
// Usage: npx tsx scripts/import-approved-binbaz-batch.ts <batch-number>
// Reads docs/binbaz-batches/batch-NNN.json (collector output) and batch-NNN-decisions.json.
// Same fields as scripts/collect-expansion-batch.ts: sources + source_search_documents (approved=true).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { searchText } from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const num = String(process.argv[2] ?? "").padStart(3, "0");
if (!/^\d{3}$/.test(num)) throw new Error("usage: import-approved-binbaz-batch.ts <batch-number>");

type Candidate = { title: string; url: string; reference: string; collection?: string; quote: string };
const batch = JSON.parse(fs.readFileSync(`docs/binbaz-batches/batch-${num}.json`, "utf-8")) as { candidates: Candidate[] };
const decisions = JSON.parse(fs.readFileSync(`docs/binbaz-batches/batch-${num}-decisions.json`, "utf-8")) as { approved: string[]; imported?: number };

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const approved = new Set(decisions.approved.map(String));
  const items = batch.candidates.filter((c) => approved.has(c.url.match(/\/fatwas\/(\d+)\//)![1]));
  if (items.length !== approved.size) throw new Error(`approved refs not all found in batch: ${items.length} of ${approved.size}`);
  const existing: Array<{ url: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data: page, error: exErr } = await db.from("sources").select("url").eq("scholar_id", "ibn-baz").range(from, from + 999);
    if (exErr) throw exErr;
    existing.push(...(page ?? []));
    if (!page || page.length < 1000) break;
  }
  const have = new Set((existing ?? []).map((r) => r.url));
  let stored = 0;
  for (const c of items) {
    if (have.has(c.url)) { console.log(`[skip existing] ${c.url}`); continue; }
    if (c.quote.length < 200 || c.quote.length > 600) throw new Error(`length out of bounds: ${c.url}`);
    const ref = c.url.match(/\/fatwas\/(\d+)\//)![1];
    const { data: source, error } = await db.from("sources").insert({
      kind: "fatwa",
      scholar_id: "ibn-baz",
      title: c.title.slice(0, 300),
      reference: c.reference,
      collection: c.collection ?? "binbaz.org.sa",
      language: "ar",
      text_original: c.quote,
      url: c.url,
      rights_id: RIGHTS_ID,
      published: true,
    }).select("id").single();
    if (error || !source) throw new Error(`source insert failed for ${ref}: ${error?.message}`);
    const { error: docErr } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: searchText(c.title, c.quote),
      approved: true,
      approved_by: APPROVED_BY,
      approved_at: new Date().toISOString(),
    });
    if (docErr) throw new Error(`search document insert failed for ${ref}: ${docErr.message}`);
    stored++;
  }
  (decisions as any).imported = ((decisions as any).imported ?? 0) + stored;
  fs.writeFileSync(`docs/binbaz-batches/batch-${num}-decisions.json`, JSON.stringify(decisions, null, 2), "utf-8");
  console.log(`Batch ${num}: stored ${stored} of ${items.length}`);
}
main().catch((e) => { console.error("Import failed:", e); process.exit(1); });
