import { isRealVerse, type Verse } from "@/lib/sources/quran-meta";
import type { PassageForSelection } from "../retrieval";

type Reason = "fetch_failed" | "identity_mismatch" | "original_changed";
/** One-hop discovery from already fetched context, never approval of support.
 * Every new identity must be fetched through the normal source reader. Its own
 * context, ranking and selection are still required by the caller. */
export async function discoverAdjacentQuranCandidates(
  seeds: PassageForSelection[], read: (key: string) => Promise<Verse | undefined>, signal: AbortSignal,
  onRejected?: (id: string, reason: Reason) => void,
  priorityIds?: string[],
): Promise<PassageForSelection[]> {
  signal.throwIfAborted();
  const available = Math.max(0, Math.min(16, 120 - seeds.length));
  if (!available) return [];
  const existing = new Map(seeds.map(c => [c.id, c]));
  const proposals = new Map<string, { verse: Verse; retrievedFor: string[] }>();
  if (priorityIds && (new Set(priorityIds).size !== priorityIds.length || priorityIds.some(id => !existing.has(id)))) throw Error("discovery_priority_identity_invalid");
  const parents = (priorityIds ? priorityIds.map(id => existing.get(id)!) : seeds).filter(c => c.source.kind === "quran");
  // Keep both directions together for each seed. Taking every preceding verse
  // first fills a sixteen-item pool before any following verse can be considered.
  for (const parent of parents) for (let offset = 0; offset < 2; offset++) {
    if (parent.source.kind !== "quran") continue;
    const [surah, verse] = parent.source.verse.key.split(":").map(Number);
    const near = parent.context.find(v => v.key === `${surah}:${verse + (offset ? 1 : -1)}`);
    if (!near || !isRealVerse(surah, verse + (offset ? 1 : -1))) continue;
    const already = existing.get(`Q${near.key}`);
    if (already) {
      if (already.source.kind === "quran" && already.source.verse.arabic !== near.arabic) throw Error("research_context_identity_changed");
      continue;
    }
    const prior = proposals.get(near.key);
    if (prior) {
      if (prior.verse.arabic !== near.arabic) throw Error("research_context_identity_changed");
      prior.retrievedFor = [...new Set([...prior.retrievedFor, ...(parent.retrievedFor ?? [])])];
    } else if (proposals.size < available) proposals.set(near.key, { verse: near, retrievedFor: [...(parent.retrievedFor ?? [])] });
  }
  const found = await Promise.all([...proposals].map(async ([key, proposal]): Promise<PassageForSelection | null> => {
    let fresh: Verse | undefined;
    try { fresh = await read(key); }
    catch { signal.throwIfAborted(); onRejected?.(`Q${key}`, "fetch_failed"); return null; }
    signal.throwIfAborted();
    if (!fresh || fresh.key !== key || !fresh.arabic?.trim() || fresh.url !== `https://quran.com/${key.replace(":", "/")}`) {
      onRejected?.(`Q${key}`, "identity_mismatch"); return null;
    }
    if (fresh.arabic !== proposal.verse.arabic) { onRejected?.(`Q${key}`, "original_changed"); return null; }
    return { id: `Q${key}`, source: { kind: "quran", verse: fresh }, context: [],
      // Discovery provenance is not an evidence-coverage verdict.
      retrievedFor: proposal.retrievedFor };
  }));
  return found.filter((c): c is PassageForSelection => c !== null);
}
