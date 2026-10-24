// Source-discovery replay only. Never generates or approves an answer.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { discoverAdjacentQuranCandidates } from "../lib/ask/search-engine/adjacent-quran-discovery";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";
import type { PassageForSelection } from "../lib/ask/retrieval";
import type { Verse } from "../lib/sources/quran-meta";
import { withModelTransport } from "../lib/ai/transport";

async function main() {
  const live = process.argv.includes("--live-source-reads");
  const tracePath = resolve("work/local-ask-traces/3e8ee2a8-832c-49a2-9672-ad51972a3f45.jsonl"), bytes = readFileSync(tracePath, "utf8");
  const events = bytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const ranking = events.find(e => e.event === "model_request" && e.data.call_id === "A3")?.data.prompt;
  const discovery = events.find(e => e.event === "diagnostic" && e.data?.code === "adjacent_originals_discovered");
  const prior = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-source-contract-retest/report.json"), "utf8")).rows[0];
  const count = prior.diagnostics.find((d: any) => d.code === "adjacent_originals_discovered")?.details.before;
  const prioritizedIds: string[] = prior.diagnostics.find((d: any) => d.code === "ranked_sources")?.details.sources.map((s: any) => s.source_id);
  if (count !== 24 || ranking.passages.length !== 40 || !prioritizedIds?.length) throw Error("recorded_discovery_shape_changed");
  const original = (key: string, arabic: string): Verse => ({ key, arabic, arabicPlain: arabic, translations: { en: null, de: null }, url: `https://quran.com/${key.replace(":", "/")}` });
  const snapshots = new Map<string, Verse>();
  const quranSeeds: PassageForSelection[] = ranking.passages.slice(0, count).filter((p: any) => /^Q\d+:\d+$/u.test(p.id)).map((p: any) => {
    const verse = original(p.id.slice(1), p.original); snapshots.set(verse.key, verse);
    const context = (p.before as string).split("\n").filter(Boolean).map(line => {
      const match = /^(\d+:\d+): (.*)$/u.exec(line); if (!match) throw Error("recorded_context_format_changed");
      const near = original(match[1], match[2]);
      const earlier = snapshots.get(near.key); if (earlier && earlier.arabic !== near.arabic) throw Error("recorded_original_conflict");
      snapshots.set(near.key, near); return near;
    });
    return { id: p.id, source: { kind: "quran", verse }, context };
  });
  const priorities = prioritizedIds.filter(id => quranSeeds.some(s => s.id === id));
  if (quranSeeds.findIndex(s => s.id === "Q51:56") !== 14 || priorities[0] !== "Q51:56") throw Error("recorded_starvation_not_reproduced");
  const offlineRead = async (key: string) => snapshots.get(key), signal = new AbortController().signal;
  const before = await discoverAdjacentQuranCandidates(quranSeeds, offlineRead, signal);
  const after = await discoverAdjacentQuranCandidates(quranSeeds, offlineRead, signal, undefined, priorities);
  if (before.some(s => s.id === "Q51:57") || !after.some(s => s.id === "Q51:57") || before.length !== 16 || after.length !== 16) throw Error("priority_repair_not_demonstrated");
  const report: any = { stage: "recorded_source_discovery_replay_not_new_Ask_accuracy", traceHash: digest(bytes),
    limitation: "Recorded final ranking order is reused only as a frozen priority counterfactual, not presented as a new initial-ranker result. Quran-only replay has the same parent order and sixteen-slot capacity as the original 24-item pool, which was well below 120. Selection, explanations, checking, latency and full-answer accuracy are not established here.",
    seedOrder: quranSeeds.map(s => s.id), frozenPriorities: priorities, oldDiscoveredIds: before.map(s => s.id), repairedDiscoveredIds: after.map(s => s.id), modelCalls: 0, modelCost: 0,
    status: "offline_reproduced", rejected: [] };
  if (live) {
    for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
    const { getVerse } = await import("../lib/sources/quran"); const started = Date.now(); let reads = 0;
    const found = await withModelTransport(async () => { throw Error("model_calls_forbidden_in_source_replay"); }, () =>
      discoverAdjacentQuranCandidates(quranSeeds, async key => { reads++; return getVerse(key); }, signal, (id, reason) => report.rejected.push({ id, reason }), priorities));
    report.liveReadMs = Date.now() - started; report.liveReads = reads; report.liveDiscoveredIds = found.map(s => s.id);
    report.status = found.some(s => s.id === "Q51:57") ? "live_original_identity_verified_not_selected_or_answered" : "live_source_replay_failed";
  }
  const path = resolve(`work/private-ask-evaluation/adjacent-priority-${live ? "live" : "offline"}-20261023.json`);
  if (existsSync(path)) throw Error("replay_already_recorded");
  persistCampaign(path, report);
  console.log(JSON.stringify({ status: report.status, oldCount: before.length, newCount: after.length, oldHasFollowingVerse: false, newHasFollowingVerse: true, liveHasFollowingVerse: report.liveDiscoveredIds?.includes("Q51:57"), reads: report.liveReads, modelCalls: 0, modelCost: 0 }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "replay_failed"); process.exitCode = 1; });
