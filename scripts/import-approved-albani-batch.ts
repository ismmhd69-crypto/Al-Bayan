// Imports only manually approved Al-Albani candidates from a dry-run file.
// This script never calls an AI provider and never touches translations or other scholars.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { isNearDuplicate, quoteStemSet, searchText } from "@/lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const input = process.argv.find((value) => value.startsWith("--input="))?.slice("--input=".length) ?? "docs/albani-batch-001-dry-run.json";
const decisionsFile = process.argv.find((value) => value.startsWith("--decisions="))?.slice("--decisions=".length) ?? "docs/albani-batch-001-decisions.json";
const RIGHTS_ID = "b808230c-6e30-4986-ae07-9aefd1a7f622";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-10-01)";

type Candidate = { title: string; series: string; seriesId: number; tape: string; url: string; excerpt: string; searchText: string };
type Decisions = { approved: Array<{ candidate: number }>; rejected: unknown[]; needsMo: unknown[] };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const dryRun = JSON.parse(fs.readFileSync(input, "utf8")) as { candidates: Candidate[] };
  const decisions = JSON.parse(fs.readFileSync(decisionsFile, "utf8")) as Decisions;
  const approvedNumbers = new Set(decisions.approved.map((item) => item.candidate));
  const approved = [...approvedNumbers].map((number) => dryRun.candidates[number - 1]).filter(Boolean);
  if (approved.length !== approvedNumbers.size) throw new Error("A decision refers to a missing candidate");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const existing: Array<{ id: string; url: string; text_original: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sources").select("id, url, text_original").eq("scholar_id", "al-albani").range(from, from + 999);
    if (error) throw new Error(`Could not read Al-Albani rows: ${error.message}`);
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const urls = new Set(existing.map((row) => row.url));
  const stems = existing.map((row) => quoteStemSet(row.text_original));
  let inserted = 0;
  let skipped = 0;
  for (const candidate of approved) {
    if (!/^https:\/\/(?:www\.)?al-albany\.com\/audios\/content\//.test(candidate.url)) throw new Error(`Invalid official URL: ${candidate.url}`);
    if (candidate.excerpt.length < 200 || candidate.excerpt.length > 600) throw new Error(`Invalid excerpt length for ${candidate.url}`);
    if (urls.has(candidate.url)) { skipped++; continue; }
    const candidateStems = quoteStemSet(candidate.excerpt);
    if (isNearDuplicate(candidateStems, stems, 0.7)) { skipped++; continue; }
    const collection = candidate.series;
    const reference = `${candidate.series} (tape ${candidate.tape || "unknown"})`;
    const { data: source, error: sourceError } = await db.from("sources").insert({
      kind: "fatwa",
      scholar_id: "al-albani",
      title: candidate.title.slice(0, 300),
      reference,
      collection,
      language: "ar",
      text_original: candidate.excerpt,
      url: candidate.url,
      rights_id: RIGHTS_ID,
      published: true,
    }).select("id").single();
    if (sourceError || !source) throw new Error(`Source insert failed for ${candidate.url}: ${sourceError?.message ?? "no row returned"}`);
    const { error: documentError } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: candidate.searchText || searchText(candidate.title, candidate.excerpt),
      approved: true,
      approved_by: APPROVED_BY,
      approved_at: new Date().toISOString(),
    });
    if (documentError) throw new Error(`Search document insert failed for ${candidate.url}: ${documentError.message}`);
    urls.add(candidate.url);
    stems.push(candidateStems);
    inserted++;
  }
  const { count: sourceCount, error: sourceCountError } = await db.from("sources").select("id", { count: "exact", head: true }).eq("scholar_id", "al-albani");
  if (sourceCountError) throw new Error(`Source count failed: ${sourceCountError.message}`);
  const { data: mine, error: mineError } = await db.from("sources").select("id").eq("scholar_id", "al-albani");
  if (mineError) throw new Error(`Source ID read failed: ${mineError.message}`);
  const { count: documentCount, error: documentCountError } = await db.from("source_search_documents").select("id", { count: "exact", head: true }).in("source_id", (mine ?? []).map((row) => row.id)).eq("approved", true);
  if (documentCountError) throw new Error(`Search document count failed: ${documentCountError.message}`);
  console.log(JSON.stringify({ input, decisionsFile, approved: approved.length, inserted, skipped, alAlbaniSourceCount: sourceCount, approvedSearchDocumentCount: documentCount }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
