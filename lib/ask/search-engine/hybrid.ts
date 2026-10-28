import { passageProblem, sameSpace, validVector, validateIndex, type SearchFamily, type SearchIndex, type SearchMethod, type SearchPassage, type VectorSpace } from "./contract";
import { maskQuranTags } from "@/lib/sources/hadith-markup";
import { checkedRerankerScores } from "./reranker-result";

export const SOURCE_LOOKUP_REVISION = "source-lookup-v2";

export type SearchConcern = { id: string; text: string; phrases: string[]; exactReferences: string[]; vector?: { space: VectorSpace; values: number[] } };
export type SearchHit = { passage: SearchPassage; concernIds: string[]; methods: SearchMethod[]; fusionScore: number; ranks: Partial<Record<SearchMethod, number>>; relevanceScore?: number };
export type SearchAudit = { generation: string; before: number; eligible: number; excluded: Record<string, number>; semantic: "available" | "query_vector_missing" | "no_eligible_vectors"; candidates: number; truncated: number };

/** Lookup-only normalisation. Original content never passes through this function. */
export function searchTokens(text: string): string[] {
  return maskQuranTags(text).normalize("NFKC").toLocaleLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").match(/[\p{L}\p{N}]+/gu) ?? [];
}
function cosine(a: number[], b: number[]) {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}
function bm25(texts: string[][], query: string[]) {
  const average = texts.reduce((n, text) => n + text.length, 0) / Math.max(1, texts.length);
  const words = [...new Set(query)], frequency = new Map(words.map(w => [w, texts.filter(t => t.includes(w)).length]));
  return texts.map(tokens => words.reduce((score, word) => {
    const tf = tokens.filter(w => w === word).length;
    if (!tf) return score;
    const idf = Math.log(1 + (texts.length - frequency.get(word)! + 0.5) / (frequency.get(word)! + 0.5));
    return score + idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * tokens.length / Math.max(1, average)));
  }, 0));
}
const FAMILIES: SearchFamily[] = ["quran", "hadith", "scholar", "video"];

export function hybridSearch(index: SearchIndex, concern: SearchConcern, options: { now?: Date; perMethod?: number; limit?: number; families?: SearchFamily[] } = {}) {
  validateIndex(index);
  if (!concern || typeof concern.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(concern.id) || typeof concern.text !== "string" || !concern.text.trim() || concern.text.length > 500
    || !Array.isArray(concern.phrases) || concern.phrases.length > 12 || concern.phrases.some(p => typeof p !== "string" || !p.trim() || p.length > 120)
    || !Array.isArray(concern.exactReferences) || concern.exactReferences.length > 12 || concern.exactReferences.some(p => typeof p !== "string" || !p.trim() || p.length > 200)) throw new Error("invalid_search_concern");
  if (concern.vector && (!sameSpace(concern.vector.space, index.space) || !validVector(concern.vector.values, index.space.dimensions))) throw new Error("query_vector_mismatch");
  const now = options.now ?? new Date(), cap = options.perMethod ?? 20, limit = options.limit ?? 120;
  if (!Number.isSafeInteger(cap) || cap < 1 || cap > 100 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error("invalid_search_limits");
  if (options.families && (!options.families.length || new Set(options.families).size !== options.families.length || options.families.some(f => !FAMILIES.includes(f)))) throw new Error("invalid_search_families");
  const audit: SearchAudit = { generation: index.generation, before: index.passages.length, eligible: 0, excluded: {}, semantic: concern.vector ? "available" : "query_vector_missing", candidates: 0, truncated: 0 };
  const eligible = index.passages.filter(p => {
    if (!(options.families ?? FAMILIES).includes(p.family)) return false;
    const reason = passageProblem(p, now, false);
    if (reason) { audit.excluded[reason] = (audit.excluded[reason] ?? 0) + 1; return false; }
    return true;
  });
  audit.eligible = eligible.length;
  if (concern.vector && !eligible.some(p => p.vector && !passageProblem(p, now, true))) audit.semantic = "no_eligible_vectors";
  const found = new Map<string, SearchHit>();
  const add = (passage: SearchPassage, method: SearchMethod, rank: number) => {
    const hit = found.get(passage.id) ?? { passage, concernIds: [concern.id], methods: [], fusionScore: 0, ranks: {} };
    if (hit.ranks[method] === undefined) { hit.methods.push(method); hit.ranks[method] = rank; hit.fusionScore += 1 / (60 + rank); }
    found.set(passage.id, hit);
  };
  const streams: SearchHit[][] = [];
  for (const family of options.families ?? FAMILIES) {
    const group = eligible.filter(p => p.family === family), texts = group.map(p => searchTokens(`${p.title} ${p.original}`));
    // Each phrase competes independently. Broad alternatives cannot inflate one AND-like match.
    const scores = (concern.phrases.length ? concern.phrases : [concern.text]).map(q => bm25(texts, searchTokens(q)));
    const lexical = group.map((p, i) => ({ p, score: Math.max(0, ...scores.map(s => s[i])) })).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
    const exact = group.filter(p => concern.exactReferences.includes(p.reference) || concern.exactReferences.includes(p.sourceId));
    const semantic = concern.vector ? group.filter(p => !passageProblem(p, now, true) && p.vector).map(p => ({ p, score: cosine(concern.vector!.values, p.vector!.values) })).filter(x => Number.isFinite(x.score)).sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id)) : [];
    for (const [method, candidates] of [["exact", exact], ["lexical", lexical.map(x => x.p)], ["semantic", semantic.map(x => x.p)]] as const) {
      candidates.slice(0, cap).forEach((p, rank) => add(p, method, rank + 1));
      streams.push(candidates.slice(0, cap).map(p => found.get(p.id)!));
    }
  }
  // Round robin preserves families and retrieval methods before a request-wide cap.
  const selected = new Map<string, SearchHit>();
  for (let rank = 0; rank < cap && selected.size < limit; rank++) for (const stream of streams) {
    const hit = stream[rank]; if (hit && selected.size < limit) selected.set(hit.passage.id, hit);
  }
  audit.candidates = found.size; audit.truncated = found.size - selected.size;
  return { hits: [...selected.values()].sort((a, b) => b.fusionScore - a.fusionScore || a.passage.id.localeCompare(b.passage.id)), audit };
}

export type MeaningReranker = ((concern: { id: string; text: string }, passages: { id: string; original: string; before: string; after: string; title: string }[], signal: AbortSignal) => Promise<{ id: string; score: number }[]>) & {
  batch?: (concerns: { id: string; text: string }[], passages: { id: string; original: string; before: string; after: string; title: string }[], signal: AbortSignal) => Promise<{ id: string; score: number }[][]>;
};

/** Ranking is not evidence approval. A missing/invalid ranking fails explicitly. */
export async function rerankByMeaning(concern: SearchConcern, hits: SearchHit[], reranker: MeaningReranker, signal: AbortSignal, limit = 30): Promise<SearchHit[]> {
  signal.throwIfAborted();
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 120 || hits.length > 120) throw new Error("invalid_rerank_limits");
  if (!hits.length) return [];
  const scores = await reranker({ id: concern.id, text: concern.text }, hits.map(h => ({ id: h.passage.id, original: h.passage.original, before: h.passage.context.before, after: h.passage.context.after, title: h.passage.title })), signal);
  signal.throwIfAborted();
  const checked = checkedRerankerScores(scores, hits.map(h => h.passage.id));
  const byId = new Map(checked.scores.map(s => [s.id, s.score]));
  return hits.map(h => ({ ...h, relevanceScore: byId.get(h.passage.id)! })).sort((a, b) => b.relevanceScore! - a.relevanceScore! || b.fusionScore - a.fusionScore).slice(0, limit);
}
