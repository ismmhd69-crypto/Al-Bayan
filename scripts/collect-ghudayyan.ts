// Collects short written-fatwa quotes from algodayan.com. It never bypasses access restrictions.
import { createClient } from "@supabase/supabase-js";
import { excerpt, htmlToText, searchText } from "@/lib/sources/scholar-excerpt";
import { parseGhudayyanFatwa } from "@/lib/sources/parsers/ghudayyan";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const PAUSE_MS = 1500;
const SITE = "https://algodayan.com";
const OWNER = "algodayan.com";
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Hit = { link: string; title: string };

async function listFatwas(): Promise<Hit[]> {
  const response = await fetch(`${SITE}/index.php/audio/category/fatwas`, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`fatwa listing failed with status ${response.status}`);
  const html = await response.text();
  const hits = [...html.matchAll(/<a[^>]+href=["'](?:https:\/\/algodayan\.com)?(\/index\.php\/audio\/[a-z0-9]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ link: `${SITE}${match[1]}`, title: htmlToText(match[2]) }))
    .filter((hit) => hit.title.length > 0);
  return [...new Map(hits.map((hit) => [hit.link, hit])).values()];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let hits: Hit[];
  try { hits = (await listFatwas()).slice(0, LIMIT); } catch (error) { console.log(error instanceof Error ? error.message : error); return; }
  await sleep(PAUSE_MS);
  let stored = 0, skipped = 0, existing = 0;
  let rightsId: string | null = null;
  if (!DRY_RUN) {
    const { data, error } = await db.schema("editorial").from("source_rights").select("id").eq("owner", OWNER).eq("status", "short_quotes_only").maybeSingle();
    if (error || !data) throw new Error(`no approved rights record for ${OWNER}`);
    rightsId = data.id;
  }
  for (const hit of hits) {
    const { data: already, error: existsError } = await db.from("sources").select("id").eq("url", hit.link).limit(1);
    if (existsError) throw new Error(`could not check existing URLs: ${existsError.message}`);
    if (already?.length) { existing++; continue; }
    const response = await fetch(hit.link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    const fatwa = response.ok ? parseGhudayyanFatwa(await response.text()) : null;
    await sleep(PAUSE_MS);
    const quote = fatwa ? excerpt(fatwa.answer) : null;
    if (!fatwa || !quote || fatwa.title.replace(/\s+/g, " ") !== hit.title.replace(/\s+/g, " ")) { skipped++; console.log(`skipped ${hit.link}: ${!response.ok ? `HTTP ${response.status}` : !fatwa ? "not a written fatwa" : !quote ? "no clean excerpt" : "title mismatch"}`); continue; }
    const reference = fatwa.printedSource ?? "algodayan.com";
    if (DRY_RUN) { console.log(`${fatwa.title} | ${reference} | ${quote.length} chars\n  ${quote.slice(0, 150)}\n  ${hit.link}`); stored++; continue; }
    const { data: source, error } = await db.from("sources").insert({ kind: "fatwa", scholar_id: "al-ghudayyan", title: fatwa.title.slice(0, 300), reference, collection: "algodayan.com", language: "ar", text_original: quote, url: hit.link, rights_id: rightsId!, published: true }).select("id").single();
    if (error || !source) { console.log(`could not store ${hit.link}: ${error?.message ?? "unknown error"}`); continue; }
    const { error: docError } = await db.from("source_search_documents").insert({ source_id: source.id, lang: "ar", search_text: searchText(fatwa.title, quote), approved: true, approved_by: APPROVED_BY, approved_at: new Date().toISOString() });
    if (docError) console.log(`stored ${hit.link} but not its search entry: ${docError.message}`);
    stored++;
  }
  console.log(`Done. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
