// Zero model calls/network requests. Recorded source snapshots only; not a live accuracy test.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { discoverAdjacentQuranCandidates } from "../lib/ask/search-engine/adjacent-quran-discovery";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";
import type { Verse } from "../lib/sources/quran-meta";
import type { PassageForSelection } from "../lib/ask/retrieval";

async function main() {
  const root = resolve("work/private-ask-evaluation");
  const fullPool = process.argv.includes("--full-pool-latest");
  const report = JSON.parse(readFileSync(resolve(root, `arabic-quality-20261022-coordination-${fullPool ? 2 : 1}/report.json`), "utf8"));
  const row = report.rows.find((r: { id: string }) => r.id === "R01");
  if (!row || row.status === "running") throw Error("recorded_attempt_not_terminal");
  const trace = readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8");
  const events = trace.trim().split("\n").map(line => JSON.parse(line));
  const originals = new Map<string, Verse>();
  for (const e of events) {
    if (e.event !== "source_finished" || !["getVerse", "neighbours"].includes(e.data.source)) continue;
    const value = e.data.result;
    for (const v of Array.isArray(value) ? value : [value]) if (v?.key && v?.arabic) {
      const prior = originals.get(v.key);
      if (prior && prior.arabic !== v.arabic) throw Error("recorded_original_changed");
      originals.set(v.key, v);
    }
  }
  const draft = events.find(e => e.event === "model_request" && e.data.phase === "draft");
  if (!draft) throw Error("recorded_draft_missing");
  const prompt = typeof draft.data.prompt === "string" ? JSON.parse(draft.data.prompt) : draft.data.prompt;
  let seeds: PassageForSelection[] = prompt.evidence_package.passages.filter((p: { type: string }) => p.type === "quran").map((p: any) => {
    const verse = originals.get(p.id.slice(1));
    if (!verse || verse.arabic !== p.arabic) throw Error("recorded_source_not_bound");
    const context = p.surrounding_context.map((near: { id: string; arabic: string }) => {
      const found = originals.get(near.id.slice(1));
      if (!found || found.arabic !== near.arabic) throw Error("recorded_context_not_bound");
      return found;
    });
    return { id: p.id, source: { kind: "quran", verse }, context, retrievedFor: p.supported_requirement_ids };
  });
  let previousLiveAdded: string[] | undefined;
  if (fullPool) {
    const discovery = events.find(e => e.event === "stage" && e.data.code === "adjacent_originals_discovered");
    const ranking = events.find(e => e.event === "model_request" && e.data.phase === "reranking");
    if (!discovery || !ranking) throw Error("recorded_full_pool_missing");
    previousLiveAdded = discovery.data.details.added_source_ids;
    const rankInput = typeof ranking.data.prompt === "string" ? JSON.parse(ranking.data.prompt) : ranking.data.prompt;
    seeds = rankInput.passages.filter((p: { id: string }) => p.id.startsWith("Q") && !previousLiveAdded!.includes(p.id)).map((p: { id: string; original: string }) => {
      const verse = originals.get(p.id.slice(1));
      if (!verse || verse.arabic !== p.original) throw Error("full_pool_original_not_bound");
      const [surah, n] = verse.key.split(":").map(Number);
      const context = [originals.get(`${surah}:${n - 1}`), originals.get(`${surah}:${n + 1}`)].filter((v): v is Verse => !!v);
      return { id: p.id, source: { kind: "quran" as const, verse }, context };
    });
    if (seeds.length !== 16) throw Error("recorded_full_pool_size_changed");
  }
  const reads: string[] = [];
  const additions = await discoverAdjacentQuranCandidates(seeds, async key => { reads.push(key); return originals.get(key); }, new AbortController().signal);
  const result = { stage: "recorded_source_discovery_only_not_semantic_approval", caseId: "R01", sourceTraceHash: digest(trace),
    implementationHash: digest(readFileSync(resolve("lib/ask/search-engine/adjacent-quran-discovery.ts"), "utf8")),
    before: seeds.map(c => c.id), ...(previousLiveAdded ? { previousLiveAdded } : {}), added: additions.map(c => c.id), snapshotReads: reads, modelCalls: 0, networkRequests: 0, newCost: 0,
    newSourcesStillRequireOwnContextRankingSelectionAndChecking: true };
  if ((!fullPool && !result.added.includes("Q31:12")) || !result.added.includes("Q51:57")) throw Error("recorded_neighbor_not_recovered");
  persistCampaign(resolve(root, `arabic-quality-20261023-adjacent-${fullPool ? "full-pool-" : ""}replay.json`), result);
  console.log(JSON.stringify(result));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "replay_failed"); process.exitCode = 1; });
