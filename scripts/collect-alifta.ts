// Collects short, signed Permanent Committee fatwa quotes from alifta.gov.sa.
//
// This collector never attempts to bypass the site's API access rules. It accepts stable public
// fatwa URLs passed with --url=... or discovers them from the permitted sitemap. A page is stored
// only when the parser finds an explicit answer, signatures, and at least one signature matching
// an already-approved individual scholar in the database.

import { createClient } from "@supabase/supabase-js";
import { normalizeArabic } from "@/lib/ask/checks";
import { excerpt, searchText } from "@/lib/sources/scholar-excerpt";
import { parseAliftaFatwa } from "@/lib/sources/parsers/alifta";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const MANUAL_URLS = process.argv.filter((arg) => arg.startsWith("--url=")).map((arg) => arg.slice("--url=".length));
const PAUSE_MS = 1500;
const SITE = "https://alifta.gov.sa";
const SITEMAP = `${SITE}/sitemap.xml`;
const RIGHTS_ID = "403b8808-7cb3-4148-8362-3a2856533239";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-09-28)";
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const normalName = (name: string) => normalizeArabic(name).replace(/\b(?:الشيخ|الدكتور|فضيلة)\b/g, "").replace(/\s+/g, " ").trim();

async function discoverUrls(): Promise<string[]> {
  const response = await fetch(SITEMAP, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`sitemap failed with status ${response.status}`);
  const xml = await response.text();
  // The public sitemap is the only automatic discovery source. Do not query the site's API if it
  // blocks external collectors. It is not a public listing of individual fatwas at present.
  return [...xml.matchAll(/<loc>(https:\/\/alifta\.gov\.sa\/[^<]*\/Fatwas\/[^<]+)<\/loc>/gi)].map((match) => match[1]);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: scholars, error: scholarsError } = await db
    .from("scholars")
    .select("id, name_ar")
    .eq("approved", true)
    .neq("id", "permanent-committee");
  if (scholarsError || !scholars) throw new Error(`could not read approved scholars: ${scholarsError?.message ?? "unknown error"}`);
  const approvedByArabicName = new Map(scholars.map((scholar) => [normalName(scholar.name_ar), scholar]));

  let urls = MANUAL_URLS;
  if (urls.length === 0) {
    urls = await discoverUrls();
    console.log(`Sitemap offered ${urls.length} individual Permanent Committee fatwa URL(s).`);
  }
  urls = [...new Set(urls)].filter((candidate) => {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === "https:" && parsed.hostname.replace(/^www\./, "") === "alifta.gov.sa";
    } catch {
      return false;
    }
  }).slice(0, LIMIT);

  if (urls.length === 0) {
    console.log("No stable individual fatwa URLs were available. Nothing was collected.");
    return;
  }

  let stored = 0;
  let skipped = 0;
  let existing = 0;
  for (const link of urls) {
    const { data: already, error: existingError } = await db.from("sources").select("id").eq("url", link).limit(1);
    if (existingError) throw new Error(`could not check existing URLs: ${existingError.message}`);
    if (already?.length) {
      existing++;
      continue;
    }

    const response = await fetch(link, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
    const html = response.ok ? await response.text() : "";
    await sleep(PAUSE_MS);
    const fatwa = response.ok ? parseAliftaFatwa(html) : null;
    const quote = fatwa ? excerpt(fatwa.answer) : null;
    const signers = fatwa
      ? fatwa.signatories
          .map((name) => ({ name, scholar: approvedByArabicName.get(normalName(name)) }))
          .filter((entry): entry is { name: string; scholar: { id: string; name_ar: string } } => !!entry.scholar)
      : [];
    if (!fatwa || !quote || signers.length === 0) {
      skipped++;
      console.log(`skipped ${link}: ${!response.ok ? `HTTP ${response.status}` : !fatwa ? "not a signed committee fatwa" : !quote ? "no clean excerpt" : "no approved signatory"}`);
      continue;
    }

    const referenceBase = fatwa.printedSource ?? "فتاوى اللجنة الدائمة للبحوث العلمية والإفتاء";
    const approvedNames = [...new Set(signers.map((signer) => signer.name))];
    const reference = `${referenceBase}، وقّع عليها: ${approvedNames.join("، ")}`;
    if (DRY_RUN) {
      console.log(`${fatwa.title} | ${reference} | ${quote.length} chars\n  ${quote.slice(0, 150)}\n  ${link}`);
      stored++;
      continue;
    }

    const { data: source, error } = await db
      .from("sources")
      .insert({
        kind: "fatwa",
        scholar_id: "permanent-committee",
        title: fatwa.title.slice(0, 300),
        reference,
        collection: "فتاوى اللجنة الدائمة للبحوث العلمية والإفتاء",
        language: "ar",
        text_original: quote,
        url: link,
        rights_id: RIGHTS_ID,
        published: true,
      })
      .select("id")
      .single();
    if (error || !source) {
      console.log(`could not store ${link}: ${error?.message ?? "unknown error"}`);
      continue;
    }
    const { error: docError } = await db.from("source_search_documents").insert({
      source_id: source.id,
      lang: "ar",
      search_text: searchText(fatwa.title, quote),
      approved: true,
      approved_by: APPROVED_BY,
      approved_at: new Date().toISOString(),
    });
    if (docError) console.log(`stored ${link} but not its search entry: ${docError.message}`);
    stored++;
    console.log(`stored ${link} (${quote.length} chars) ${reference}`);
  }
  console.log(`Done. ${DRY_RUN ? "Would store" : "Stored"} ${stored}, skipped ${skipped}, already there ${existing}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
