import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { readBayanIndexSources, revalidateBayanIndexSources } from "./bayan-source-index-reader";
import { storedSourcePassages } from "../lib/ask/search-engine/source-passages";
import { PrivateSearchIndexStore } from "../lib/ask/search-engine/index-store";
import type { SearchIndex } from "../lib/ask/search-engine/contract";

export async function main() {
  for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? "", now = new Date(), signal = AbortSignal.timeout(60_000);
  if (!token) throw new Error("management_read_token_missing");
  const input = (await Promise.all((["hadith", "fatwa"] as const).map(f => readBayanIndexSources(token, f, 20, null, signal)))).flat();
  const prepared = input.map(source => ({ source, result: storedSourcePassages(source, now) }));
  const index: SearchIndex = { version: 1, generation: `pilot-${now.toISOString().replace(/[^0-9]/g, "")}-${randomUUID().slice(0, 8)}`, space: { model: "none", revision: "lexical-only", dimensions: 1 }, passages: prepared.flatMap(p => p.result.passages) };
  if (!index.passages.length) throw new Error("no_eligible_pilot_passages");
  const expiry = new Date(Math.min(now.getTime() + 86_400_000, ...index.passages.flatMap(p => p.permissions.expiresAt ? [Date.parse(p.permissions.expiresAt)] : [])));
  const directory = resolve("work/private-ask-evaluation/source-index-pilot"), store = new PrivateSearchIndexStore(directory);
  await store.prune(now); await store.publish(index, expiry, now);
  const loaded = await store.load(ids => revalidateBayanIndexSources(token, ids, signal));
  if (loaded.passages.length !== index.passages.length) throw new Error("source_pilot_revalidation_incomplete");
  const report = { at: now.toISOString(), generation: index.generation, mode: "lexical_source_export_only_no_embeddings", sourceFamilies: ["hadith", "fatwa"], sourceCount: input.length, storedByteCheckedPassages: index.passages.length,
    currentValidatedPassages: loaded.passages.length, fullContextPassages: loaded.passages.filter(p => p.context.complete).length, limitedContextPassages: loaded.passages.filter(p => !p.context.complete).length,
    rejected: prepared.filter(p => p.result.reason).map(p => ({ sourceId: p.source.id, reason: p.result.reason })),
    officialSourceComparison: "not_performed", paidCalls: 0, newPaidCost: 0, publishedToWebsite: false, expiresAt: expiry.toISOString(), indexDirectory: directory };
  await mkdir(resolve("work/private-ask-evaluation"), { recursive: true });
  await writeFile(resolve("work/private-ask-evaluation/source-index-pilot-report.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "source_pilot_build_failed"); process.exitCode = 1; });
