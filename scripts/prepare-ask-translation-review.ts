// Existing translations are exported for review only. No model calls or publication.
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readBayanIndexSources, revalidateBayanIndexSources } from "./bayan-source-index-reader";
import { prepareTranslationReview, renderTranslationReview, type TranslationPreparationRow } from "../lib/ask/translation-preparation";
import { storedSourcePassages, storedSourceFingerprint } from "../lib/ask/search-engine/source-passages";

export async function main() {
  if (!process.argv.includes("--read-only")) throw Error("explicit_read_only_flag_required");
  const arg = (name: string) => process.argv.find(a => a.startsWith(`${name}=`))?.slice(name.length + 1);
  if (process.argv.slice(2).some(a => a !== "--read-only" && !a.startsWith("--size=") && !a.startsWith("--after="))) throw Error("translation_preparation_argument_invalid");
  const size = Number(arg("--size") ?? 6), after = arg("--after") ?? null;
  if (!Number.isSafeInteger(size) || size < 1 || size > 20) throw Error("translation_preparation_size_invalid");
  for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);
  const token = process.env.SUPABASE_ACCESS_TOKEN, url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!token || !url || !key || new URL(url).origin !== "https://jnietkyxgnocyizvjiel.supabase.co") throw Error("translation_preparation_configuration_missing");
  const now = new Date(), signal = AbortSignal.timeout(60_000);
  // Reuse the existing read-only, rights-filtered source exporter. Do not reinterpret
  // source publication as embedding rights or independent scholarly approval.
  const page = await readBayanIndexSources(token, "fatwa", Math.min(100, size * 5), after, signal);
  const sources = page.filter(s => s.text_original.length <= 600 && !storedSourcePassages(s, now).reason).slice(0, size);
  if (!sources.length) throw Error("translation_preparation_no_eligible_short_excerpts");
  const readOnlyFetch: typeof fetch = async (input, options) => {
    if (new URL(String(input)).origin !== new URL(url).origin || !["GET", "HEAD"].includes(options?.method?.toUpperCase() ?? "GET")) throw Error("translation_preparation_write_blocked");
    return fetch(input, options);
  };
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: readOnlyFetch } });
  const result = await db.from("source_translations").select("source_id,lang,text,origin,published,version,translator,reviewer,reviewed_at")
    .in("source_id", sources.map(s => s.id)).in("lang", ["en", "de"]).limit(401).abortSignal(signal);
  if (result.error || !result.data || result.data.length > 400) throw Error("translation_preparation_read_failed_or_truncated");
  const packet = prepareTranslationReview(sources, result.data as TranslationPreparationRow[], now);
  const current = await revalidateBayanIndexSources(token, sources.map(s => s.id), signal);
  if (sources.some(s => { const state = current.get(s.id); return !state || !("sourceFingerprint" in state) || state.sourceFingerprint !== storedSourceFingerprint(s); })) throw Error("translation_preparation_source_changed_or_revoked");
  const directory = resolve("work/private-ask-evaluation/translation-review"), stamp = now.toISOString().replace(/[:.]/g, "-");
  await mkdir(directory, { recursive: true });
  const file = resolve(directory, `packet-${stamp}.json`);
  await writeFile(file, JSON.stringify(packet, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const review = resolve(directory, `review-${stamp}.md`);
  await writeFile(review, renderTranslationReview(packet), { flag: "wx", mode: 0o600 });
  const summary = { at: now.toISOString(), packet: file, review, packetHash: packet.packetHash, sourceCount: sources.length, itemCount: packet.items.length,
    draftItems: packet.items.filter(i => i.state === "draft_needs_review").length, missingItems: packet.items.filter(i => i.state === "translation_missing").length,
    existingPublishedItems: packet.items.filter(i => i.state === "published_candidate_needs_review").length,
    snapshotRevalidated: true, nextAfter: sources.at(-1)!.id, sourceRowsRead: page.length, accepted: false, paidModelCalls: 0, publicationChanges: 0 };
  await writeFile(resolve(directory, `report-${stamp}.json`), JSON.stringify(summary, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify(summary));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => {
  console.error("translation review preparation failed; no credentials or source text logged"); process.exitCode = 1;
});
