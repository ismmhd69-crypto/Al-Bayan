import type { QuestionFrame } from "../retrieval";
import { abortable } from "../abort";
import { sameSpace, validVector } from "./contract";
import { discoveredCorpusCandidates } from "./corpus-candidates";
import type { CorpusRetrieval, QueryEmbedder } from "./corpus-retrieval";
import type { SearchHit } from "./hybrid";
import { persistentSearchIndex, type IndexRpc } from "./persistent-index";

/** Persistent discovery uses one pinned generation and one query batch. Each
 * concern/family has its own retrieval allowance before the shared limit. */
export async function retrieveFromPersistentCorpus(frame: QuestionFrame, rpc: IndexRpc, options: {
  signal: AbortSignal; embedder?: QueryEmbedder; families?: ("hadith" | "scholar")[]; limit?: number;
}): Promise<CorpusRetrieval> {
  const { signal } = options, families = options.families ?? ["hadith", "scholar"], limit = options.limit ?? 60;
  if (!frame.requirements.length || frame.requirements.length > 4 || !Number.isSafeInteger(limit) || limit < 1 || limit > 120
    || !families.length || new Set(families).size !== families.length || families.some(f => !["hadith", "scholar"].includes(f))) throw new Error("invalid_persistent_corpus_contract");
  const store = persistentSearchIndex(rpc), pinned = await store.manifest(signal);
  let vectors: number[][] | undefined;
  if (options.embedder && pinned.semanticEligible > 0) {
    if (!sameSpace(pinned.space, options.embedder.space)) throw new Error("query_vector_mismatch");
    vectors = await abortable(options.embedder.embedQueries(frame.requirements.map(r => r.text), signal), signal);
    if (!Array.isArray(vectors) || vectors.length !== frame.requirements.length || vectors.some(v => !validVector(v, pinned.space.dimensions))) throw new Error("query_embedding_batch_mismatch");
  }
  const streams: SearchHit[][] = [], audits: CorpusRetrieval["audits"] = [];
  let semanticEligible = 0;
  // At most eight bounded database calls, never one call per stored source.
  // Serial calls also support transaction-bound transports; production may
  // bound parallelism independently after database load acceptance.
  for (const [i, concern] of frame.requirements.entries()) for (const family of families) {
    const sourcePhrases = family === "hadith" ? concern.hadithArabic : [];
    const phrases = [...new Set([...(sourcePhrases ?? []), ...Object.values(concern.searchQueries ?? {}).flatMap(q => q ?? [])])].slice(0, 12);
    const found = await store.search(pinned, { id: concern.id, text: concern.text, phrases, exactReferences: [],
      ...(vectors ? { vector: { space: pinned.space, values: vectors[i] } } : {}) }, family, signal);
    streams.push(found.hits); semanticEligible += found.semanticEligible;
    audits.push({ concernId: concern.id, family, audit: { generation: pinned.generation, before: found.eligible, eligible: found.eligible,
      excluded: {}, semantic: !found.semanticEligible ? "no_eligible_vectors" : vectors ? "available" : "query_vector_missing", candidates: found.hits.length, truncated: 0 } });
  }
  const merged = new Map<string, SearchHit>();
  for (const stream of streams) for (const hit of stream) {
    const prior = merged.get(hit.passage.id);
    if (!prior) merged.set(hit.passage.id, { ...hit, concernIds: [...hit.concernIds], methods: [...hit.methods] });
    else {
      prior.concernIds = [...new Set([...prior.concernIds, ...hit.concernIds])];
      prior.methods = [...new Set([...prior.methods, ...hit.methods])];
      prior.fusionScore = Math.max(prior.fusionScore, hit.fusionScore);
    }
  }
  const chosen = new Set<string>();
  for (const concern of frame.requirements) {
    const best = [...merged.values()].filter(h => h.concernIds.includes(concern.id)).sort((a, b) => b.fusionScore - a.fusionScore)[0];
    if (best && chosen.size < limit) chosen.add(best.passage.id);
  }
  for (let rank = 0; rank < 60 && chosen.size < limit; rank++) for (const stream of streams) {
    if (stream[rank] && chosen.size < limit) chosen.add(stream[rank].passage.id);
  }
  const hits = [...chosen].map(id => merged.get(id)!);
  return { generation: pinned.generation, hits, audits, semantic: !semanticEligible ? "no_indexed_vectors" : vectors ? "used" : "not_configured",
    truncated: merged.size - chosen.size, unrepresentedConcernIds: frame.requirements.filter(r => !hits.some(h => h.concernIds.includes(r.id))).map(r => r.id) };
}

export async function persistentCorpusCandidates(frame: QuestionFrame, rpc: IndexRpc, options: {
  signal: AbortSignal; embedder?: QueryEmbedder; families?: ("hadith" | "scholar")[]; allowLexicalOnly?: boolean;
  onDiscovery?: (result: CorpusRetrieval) => void;
}) {
  const found = await retrieveFromPersistentCorpus(frame, rpc, options);
  options.onDiscovery?.(found);
  if (found.semantic !== "used" && !options.allowLexicalOnly) throw new Error("corpus_semantic_provider_not_ready");
  return discoveredCorpusCandidates(found, { signal: options.signal });
}
