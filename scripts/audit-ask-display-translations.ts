// Read-only availability/transport probe. No translation generation, approval or writes.
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { lookupDisplayTranslations } from "../lib/ask/display-translation-lookup";
import { canonicalSourcePage } from "../lib/ask/search-engine/candidate-identity";
import type { RichSource } from "../lib/ask/rich-answer";

async function main() {
  if (!process.argv.includes("--read-only")) throw Error("explicit_read_only_flag_required");
  for (const file of [".env", ".env.local"]) if (existsSync(file)) process.loadEnvFile(file);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw Error("translation_audit_configuration_missing");
  const out = resolve("work/private-ask-evaluation", `display-translation-availability-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const actualFetch = globalThis.fetch, reads: { table: string; method: string; pageAlias: boolean }[] = [];
  globalThis.fetch = async (target, options) => {
    const method = options?.method?.toUpperCase() ?? "GET", endpoint = new URL(String(target));
    if (endpoint.origin !== new URL(url).origin || !["GET", "HEAD"].includes(method)) throw Error("translation_audit_write_or_external_request_blocked");
    reads.push({ table: endpoint.pathname.split("/").at(-1) ?? "unknown", method, pageAlias: endpoint.searchParams.get("url")?.startsWith("like.") ?? false });
    return actualFetch(target, options);
  };
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signal = () => AbortSignal.timeout(20_000);
    const total = await db.from("sources").select("id", { count: "exact", head: true }).eq("kind", "fatwa").eq("published", true).abortSignal(signal());
    if (total.error || total.count === null) throw Error("translation_audit_source_count_failed");
    const counts = await Promise.all((["en", "de"] as const).flatMap(language => [false, true].map(async published => {
      const result = await db.from("source_translations").select("source_id,sources!inner(id)", { count: "exact", head: true })
        .eq("sources.kind", "fatwa").eq("sources.published", true).eq("lang", language).eq("published", published).abortSignal(signal());
      if (result.error || result.count === null) throw Error("translation_audit_count_failed");
      return { language, published, translationRows: result.count };
    })));
    const sample = await db.from("sources").select("id,url,text_original,scholar_id").eq("kind", "fatwa").eq("published", true)
      .order("id").limit(1).abortSignal(signal());
    if (sample.error) throw Error("translation_audit_sample_failed");
    const probes: { language: string; case: string; status: string }[] = [];
    const row = sample.data?.[0];
    if (row) {
      const source: RichSource = { id: `S${row.id}`, evidence: { kind: "scholar", key: `S${row.id}`, scholarId: row.scholar_id,
        scholarName: "Private lookup probe", title: null, reference: "Private lookup probe", arabic: row.text_original, url: row.url } };
      for (const language of ["en", "de"] as const) {
        const result = await lookupDisplayTranslations([source], language, signal());
        probes.push({ language, case: "stored_identity_and_original", status: result.get(source.id)?.status ?? "missing" });
      }
      const page = canonicalSourcePage(row.url);
      if (/^https:\/\/binbaz\.org\.sa\/fatwas\/[0-9]+$/.test(page)) {
        // Synthetic presentation alias exercises DB matching only; no source URL is fetched,
        // asserted to exist, saved as an answer or treated as a new religious citation.
        const alias = { ...source, id: "S00000000-0000-4000-8000-000000000000", evidence: { ...source.evidence, url: `${page}/private-lookup-probe-alias` } };
        probes.push({ language: "en", case: "synthetic_same_page_alias", status: (await lookupDisplayTranslations([alias], "en", signal())).get(alias.id)?.status ?? "missing" });
      }
    }
    const report = { version: 1, at: new Date().toISOString(), mode: "read_only", publishedFatwaSources: total.count, counts,
      countsAreRowsNotDistinctSourceCoverage: true, probes, reads, paidModelCalls: 0,
      acceptedTranslations: false, sourceFaithfulnessReviewed: false, note: "No originals, translations, visitor questions or credentials copied into this report. Unpublished rows remain unpublished. Availability is not approval." };
    mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ report: out, publishedFatwaSources: report.publishedFatwaSources, counts, probes, paidModelCalls: 0 }));
  } finally { globalThis.fetch = actualFetch; }
}

main().catch(() => { console.error("translation availability audit failed; no credentials or source text logged"); process.exitCode = 1; });
