// Inserts ONLY the items I approved by hand for one batch (Ibn Uthaymeen, binothaimeen.net).
// Usage: npx tsx scripts/import-approved-uthaymeen-batch.ts <batch-number>
// Reads docs/uthaymeen-batches/batch-NNN.json (collector output) and batch-NNN-decisions.json
// ({ approved: [1-based item numbers], rejected: {num: reason}, needsMo: {num: reason} }).
// Same fields as scripts/collect-expansion-batch.ts: sources + source_search_documents (approved=true).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { searchText } from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const DIR = "docs/uthaymeen-batches";
const RIGHTS_ID = "7306bf6c-4898-4da9-8cd0-3473cb07a65c";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const num = String(process.argv[2] ?? "").padStart(3, "0");
if (!/^\d{3}$/.test(num)) throw new Error("usage: import-approved-uthaymeen-batch.ts <batch-number>");

type Candidate = { lessonId: string; title: string; url: string; reference: string; collection: string; quote: string };
const batch = JSON.parse(fs.readFileSync(`${DIR}/batch-${num}.json`, "utf-8")) as { candidates: Candidate[] };
const decisionsPath = `${DIR}/batch-${num}-decisions.json`;
const decisions = JSON.parse(fs.readFileSync(decisionsPath, "utf-8")) as {
  approved: number[]; rejected: Record<string, string>; needsMo: Record<string, string>; imported?: number;
};

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const n = batch.candidates.length;
  const decided = new Set([...decisions.approved.map(String), ...Object.keys(decisions.rejected), ...Object.keys(decisions.needsMo)]);
  if (decided.size !== n || decisions.approved.length + Object.keys(decisions.rejected).length + Object.keys(decisions.needsMo).length !== n)
    throw new Error(`every one of the ${n} items needs exactly one decision (got ${decided.size})`);
  const items = decisions.approved.map((i) => batch.candidates[i - 1]);
  if (items.some((c) => !c)) throw new Error("approved number out of range");

  const { data: existing, error: exErr } = await db.from("sources").select("url").eq("scholar_id", "ibn-uthaymeen");
  if (exErr) throw exErr;
  const have = new Set((existing ?? []).map((r) => r.url.split("/").pop()));
  let stored = 0;
  for (const c of items) {
    if (have.has(c.lessonId)) { console.log(`[skip existing] ${c.lessonId}`); continue; }
    if (c.quote.length < 200 || c.quote.length > 600) throw new Error(`length out of bounds: ${c.lessonId}`);
    const { data: source, error } = await db.from("sources").insert({
      kind: "fatwa",
      scholar_id: "ibn-uthaymeen",
      title: c.title.slice(0, 300),
      reference: c.reference,
      collection: c.collection,
      language: "ar",
      text_original: c.quote,
      url: c.url,
      rights_id: RIGHTS_ID,
      published: true,
    }).select("id").single();
    if (error || !source) throw new Error(`source insert failed for ${c.lessonId}: ${error?.message}`);
    const { error: docErr } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: searchText(c.title, c.quote),
      approved: true,
      approved_by: APPROVED_BY,
      approved_at: new Date().toISOString(),
    });
    if (docErr) throw new Error(`search document insert failed for ${c.lessonId}: ${docErr.message}`);
    stored++;
  }
  decisions.imported = (decisions.imported ?? 0) + stored;
  fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2), "utf-8");

  // Verify in the database: rows and approved search documents for this batch.
  const ids = items.map((c) => c.lessonId);
  const { data: rows, error: vErr } = await db.from("sources").select("id, url").eq("scholar_id", "ibn-uthaymeen");
  if (vErr) throw vErr;
  const mine = (rows ?? []).filter((r) => ids.includes(r.url.split("/").pop()!));
  const { count: docs } = await db.from("source_search_documents").select("id", { count: "exact", head: true }).in("source_id", mine.map((r) => r.id)).eq("approved", true);
  console.log(`Batch ${num}: stored ${stored} of ${items.length}; in database for this batch: ${mine.length} rows, ${docs} approved search documents; Ibn Uthaymeen rows now: ${rows?.length}`);
  if (mine.length !== items.length || docs !== items.length) throw new Error("verification mismatch");

  // Running total for this run + log
  const totalsPath = `${DIR}/run-totals.json`;
  const totals = fs.existsSync(totalsPath) ? JSON.parse(fs.readFileSync(totalsPath, "utf-8")) : { stored: 0, rejected: 0, needsMo: 0, batches: {} };
  if (!totals.batches[num]) {
    totals.stored += mine.length;
    totals.rejected += Object.keys(decisions.rejected).length;
    totals.needsMo += Object.keys(decisions.needsMo).length;
    totals.batches[num] = { approved: mine.length, rejected: Object.keys(decisions.rejected).length, needsMo: Object.keys(decisions.needsMo).length };
    fs.writeFileSync(totalsPath, JSON.stringify(totals, null, 2), "utf-8");
    const lines = [`\n## Batch ${num}: ${items.length} approved, ${Object.keys(decisions.rejected).length} rejected, ${Object.keys(decisions.needsMo).length} needs Mo. Running total stored this run: ${totals.stored}\n`];
    for (const [i, why] of Object.entries(decisions.rejected)) lines.push(`- Rejected #${i} "${batch.candidates[Number(i) - 1].title}": ${why}`);
    for (const [i, why] of Object.entries(decisions.needsMo)) lines.push(`- NEEDS MO #${i} "${batch.candidates[Number(i) - 1].title}" (${batch.candidates[Number(i) - 1].url}): ${why}`);
    fs.appendFileSync("docs/uthaymeen-expansion-log.md", lines.join("\n") + "\n", "utf-8");
  }
}
main().catch((e) => { console.error("Import failed:", e); process.exit(1); });
