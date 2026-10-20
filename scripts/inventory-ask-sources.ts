// Explicitly read-only. Never invokes Ask, model providers, mutations or unknown RPCs.
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inventorySummary, type SourceMetadata, type SearchMetadata, type RightsMetadata } from "../lib/ask/search-engine/inventory";
import { sharedAskLedgerPath } from "./ask-test-profile";
import { readBayanRightsMetadata } from "./bayan-rights-metadata";

export async function main() {
  for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (new URL(url).hostname !== "jnietkyxgnocyizvjiel.supabase.co") throw new Error("Inventory must use the Bayan project");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Bayan server credentials are not configured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    if (!["GET", "HEAD"].includes(method.toUpperCase())) throw new Error("Inventory prohibits database writes and RPC calls");
    return fetch(input, { ...init, signal: AbortSignal.timeout(30_000) });
  } } });
  async function pages(table: string, columns: string, schema = "public") {
    const result: unknown[] = [];
    for (let start = 0; start < 200_000; start += 1000) {
      const { data, error } = await db.schema(schema).from(table).select(columns).order("id").range(start, start + 999);
      if (error) throw new Error(`Metadata read failed for ${table}: ${error.code}`);
      if (!data) throw new Error(`Metadata missing for ${table}`);
      result.push(...data);
      if (data.length < 1000) return result;
    }
    throw new Error(`Inventory ceiling reached for ${table}; report withheld instead of truncating`);
  }
  const [sources, documents, rights] = await Promise.all([
    pages("sources", "id,kind,language,published,rights_id,grade,grader,scholar_id"),
    pages("source_search_documents", "id,source_id,lang,approved"),
    pages("source_rights", "id,owner,status,search_index_allowed,ai_processing_allowed,translation_index_allowed,expires_at", "editorial")
      .catch(() => process.env.SUPABASE_ACCESS_TOKEN ? readBayanRightsMetadata(process.env.SUPABASE_ACCESS_TOKEN).catch(() => null) : null),
  ]);
  const count = async (table: string, column: string, value: string | boolean) => {
    const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).eq(column, value);
    return error ? { count: null, status: "lookup_failed" } : { count, status: "read" };
  };
  const videos = await count("videos", "approved", true);
  const translations = await count("source_translations", "published", true);
  const ledgerPath = sharedAskLedgerPath(), bytes = readFileSync(ledgerPath), ledger = JSON.parse(bytes.toString());
  const report = {
    version: 1, at: new Date().toISOString(), scope: "Bayan database metadata and local environment only; no content download, model call or production runtime inspection", readOnly: true,
    ...inventorySummary(sources as SourceMetadata[], documents as SearchMetadata[], rights as RightsMetadata[] | null),
    videos: { ...videos, transcript_coverage: "not_established", rich_video_support: false }, translations: { ...translations, verified_alignment: "not_established" },
    environmentFileConfiguration: { provenance: "This script's .env files, not the already running dev server's environment", hadithMode: process.env.HADITH_SOURCE ?? "hadeethenc", scholarsEnabled: process.env.SCHOLAR_QUOTES !== "off", liveScholarsEnabled: process.env.SCHOLARS_LIVE !== "off", richEnabled: process.env.ASK_RICH_ENABLED === "true", quranEnvironment: process.env.QURAN_API_ENV ?? "prelive", quranRemoteCoverage: "not_queried", productionConfiguration: "not_verified" },
    evaluation: { ledgerSha256: createHash("sha256").update(bytes).digest("hex"), cap: ledger.cap, unsettledCalls: ledger.entries.filter((e: { cost?: number }) => e.cost === undefined).length, paidWorkBlocked: !!ledger.stopped || ledger.entries.some((e: { cost?: number }) => e.cost === undefined), paidCalls: 0, newPaidCost: 0 },
  };
  const out = resolve("work/private-ask-evaluation/source-inventory.json");
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error("Bayan source inventory failed; no partial report was issued. Check metadata permissions and connectivity."); process.exitCode = 1; });
