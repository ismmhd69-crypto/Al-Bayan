import { abortable } from "../abort";
import type { QuestionFrame } from "../retrieval";
import { sameSpace, validVector, validateIndex, passageProblem, type SearchFamily, type SearchIndex, type VectorSpace } from "./contract";
import { hybridSearch, type SearchHit, type SearchAudit } from "./hybrid";

export type QueryEmbedder = { space: VectorSpace; embedQueries: (queries: string[], signal: AbortSignal) => Promise<number[][]> };
export type CorpusRetrieval = { generation: string; hits: SearchHit[]; audits: { concernId: string; family: SearchFamily; audit: SearchAudit }[]; semantic: "used" | "not_configured" | "no_indexed_vectors"; truncated: number; unrepresentedConcernIds: string[] };

/** One revalidated immutable generation per question. This returns discovery
 * candidates, never approved claims or a pre-written religious answer. */
export async function retrieveFromCorpus(frame: QuestionFrame, loadIndex: () => Promise<SearchIndex>, options: {
  signal: AbortSignal; embedder?: QueryEmbedder; families?: SearchFamily[]; exactReferences?: Partial<Record<SearchFamily, string[]>>; limit?: number;
}): Promise<CorpusRetrieval> {
  options.signal.throwIfAborted();
  if (!frame.requirements.length || frame.requirements.length > 4) throw new Error("invalid_corpus_question_contract");
  const limit = options.limit ?? 120;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 120) throw new Error("invalid_corpus_limit");
  const index = await abortable(loadIndex(), options.signal);
  validateIndex(index);
  if (options.families && (!options.families.length || new Set(options.families).size !== options.families.length)) throw new Error("invalid_search_families");
  const hasVectors = index.passages.some(p => p.vector && !passageProblem(p, new Date(), true));
  let vectors: number[][] | undefined;
  if (hasVectors && options.embedder) {
    if (!sameSpace(index.space, options.embedder.space)) throw new Error("query_vector_mismatch");
    vectors = await abortable(options.embedder.embedQueries(frame.requirements.map(r => r.text), options.signal), options.signal);
    if (!Array.isArray(vectors) || vectors.length !== frame.requirements.length || vectors.some(v => !validVector(v, index.space.dimensions))) throw new Error("query_embedding_batch_mismatch");
  }
  const audits: CorpusRetrieval["audits"] = [], streams: SearchHit[][] = [];
  for (let i = 0; i < frame.requirements.length; i++) for (const family of options.families ?? ["quran", "hadith", "scholar"]) {
    options.signal.throwIfAborted();
    const concern = frame.requirements[i];
    const sourcePhrases = family === "quran" ? concern.quranArabic : family === "hadith" ? concern.hadithArabic : undefined;
    const phrases = [...new Set([...(sourcePhrases ?? []), ...Object.values(concern.searchQueries ?? {}).flatMap(q => q ?? [])])].slice(0, 12);
    const found = hybridSearch(index, { id: concern.id, text: concern.text, phrases: phrases.length ? phrases : [concern.text], exactReferences: options.exactReferences?.[family] ?? [],
      ...(vectors ? { vector: { space: index.space, values: vectors[i] } } : {}) }, { families: [family], perMethod: 20, limit: 60 });
    streams.push(found.hits); audits.push({ concernId: concern.id, family, audit: found.audit });
  }
  const all = new Map<string, SearchHit>();
  for (const stream of streams) for (const hit of stream) {
    const previous = all.get(hit.passage.id);
    if (!previous) all.set(hit.passage.id, { ...hit, concernIds: [...hit.concernIds], methods: [...hit.methods] });
    else {
      previous.concernIds = [...new Set([...previous.concernIds, ...hit.concernIds])];
      previous.methods = [...new Set([...previous.methods, ...hit.methods])];
      previous.fusionScore = Math.max(previous.fusionScore, hit.fusionScore);
    }
  }
  const chosen = new Set<string>();
  for (const concern of frame.requirements) {
    const best = [...all.values()].filter(h => h.concernIds.includes(concern.id)).sort((a, b) => b.fusionScore - a.fusionScore)[0];
    if (best && chosen.size < limit) chosen.add(best.passage.id);
  }
  // Fairness is applied across concerns as well as families before a global cap.
  for (let rank = 0; rank < 60 && chosen.size < limit; rank++) for (const stream of streams) {
    if (stream[rank] && chosen.size < limit) chosen.add(stream[rank].passage.id);
  }
  const hits = [...chosen].map(id => all.get(id)!);
  return { generation: index.generation, hits, audits, semantic: !hasVectors ? "no_indexed_vectors" : vectors ? "used" : "not_configured", truncated: all.size - chosen.size,
    unrepresentedConcernIds: frame.requirements.filter(r => !hits.some(h => h.concernIds.includes(r.id))).map(r => r.id) };
}
