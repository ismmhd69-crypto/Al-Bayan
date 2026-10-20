import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { PrivateSearchIndexStore } from "../lib/ask/search-engine/index-store";
import { revalidateBayanIndexSources } from "./bayan-source-index-reader";
import { hybridSearch, searchTokens } from "../lib/ask/search-engine/hybrid";

export async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? "";
  if (!token) throw new Error("management_read_token_missing");
  const store = new PrivateSearchIndexStore(resolve("work/private-ask-evaluation/source-index-pilot"));
  const index = await store.load(ids => revalidateBayanIndexSources(token, ids));
  const rows = index.passages.slice(0, 10).map(p => {
    const title = new Set(searchTokens(p.title));
    const bodyOnlyWords = [...new Set(searchTokens(p.original).filter(w => w.length >= 4 && !title.has(w)))].slice(-3);
    const query = bodyOnlyWords.join(" ");
    const results = query ? hybridSearch(index, { id: "probe", text: query, phrases: [query], exactReferences: [] }, { families: [p.family] }) : null;
    return { sourceId: p.sourceId, queryDerivedFromStoredBody: true, bodyOnlyTerms: bodyOnlyWords.length, foundExpectedSource: results?.hits.some(h => h.passage.sourceId === p.sourceId) ?? false, sourceFamily: p.family, semantic: results?.audit.semantic ?? "not_run" };
  });
  const report = { at: new Date().toISOString(), generation: index.generation, mode: "reverse_lookup_smoke_not_visitor_accuracy", currentValidatedPassages: index.passages.length,
    rows, caveat: "Queries are deliberately derived from known source bodies. These demonstrate full-text index connectivity, not semantic quality, held-out recall or religious accuracy.", paidCalls: 0, newPaidCost: 0 };
  await writeFile(resolve("work/private-ask-evaluation/source-index-pilot-probe.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ ...report, rows: undefined, found: rows.filter(r => r.foundExpectedSource).length, probes: rows.length }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "source_pilot_probe_failed"); process.exitCode = 1; });
