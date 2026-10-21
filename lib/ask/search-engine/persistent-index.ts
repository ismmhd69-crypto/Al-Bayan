import { passageProblem, sameSpace, validVector, validateIndex, type SearchIndex, type VectorSpace } from "./contract";
import { SOURCE_LOOKUP_REVISION, searchTokens, type SearchConcern, type SearchHit } from "./hybrid";
import { abortable } from "../abort";

export type IndexRpc = (operation: string, body: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>;
type Manifest = { generation: string; space: VectorSpace; expiresAt: string; semanticEligible: number };
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
function manifest(x: unknown): Manifest {
  if (!object(x) || x.status !== "ready" || typeof x.generation !== "string" || !object(x.space)
    || typeof x.expires_at !== "string" || !Number.isFinite(Date.parse(x.expires_at)) || Date.parse(x.expires_at) <= Date.now()
    || !Number.isSafeInteger(x.semantic_eligible) || (x.semantic_eligible as number) < 0) throw new Error("persistent_index_not_ready");
  const value = { generation: x.generation, space: x.space as VectorSpace, expiresAt: x.expires_at, semanticEligible: x.semantic_eligible as number };
  if (x.lookup_revision !== SOURCE_LOOKUP_REVISION) throw new Error("persistent_index_lookup_revision_mismatch");
  if (typeof value.space.model !== "string" || !value.space.model || value.space.model.length > 200
    || typeof value.space.revision !== "string" || !value.space.revision || value.space.revision.length > 200) throw new Error("persistent_index_invalid_space");
  validateIndex({ version: 1, generation: value.generation, space: value.space, passages: [] });
  if (!value.space.recipe) throw new Error("persistent_index_recipe_missing");
  return value;
}

/** Injected service-only transport. This module loads no keys and enables no
 * route. Queries persist neither visitor wording nor query vectors. */
export function persistentSearchIndex(rpc: IndexRpc) {
  const call = async (operation: string, body: Record<string, unknown>, signal: AbortSignal) => {
    signal.throwIfAborted();
    const result = await abortable(rpc(operation, body, signal), signal);
    signal.throwIfAborted();
    if (!object(result)) throw new Error("persistent_index_invalid_response");
    return result;
  };
  return {
    async publish(index: SearchIndex, expiresAt: Date, signal: AbortSignal) {
      validateIndex(index);
      if (!index.space.recipe || !index.passages.length || index.passages.length > 200_000
        || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 7 * 86400_000
        || index.passages.some(p => !["hadith", "scholar"].includes(p.family) || passageProblem(p, new Date(), !!p.vector)
          || !p.parentOriginalHash || !p.sourceFingerprint || p.verificationBasis !== "stored_source_bytes"
          || (p.permissions.expiresAt && Date.parse(p.permissions.expiresAt) < expiresAt.getTime()))) throw new Error("persistent_index_ineligible_generation");
      if ((await call("begin", { generation: index.generation, space: index.space, lookup_revision: SOURCE_LOOKUP_REVISION, expected_count: index.passages.length, expires_at: expiresAt.toISOString() }, signal)).status !== "building") throw new Error("persistent_index_begin_failed");
      // A failed upload remains invisible and expires; never publish a subset.
      for (let start = 0; start < index.passages.length; start += 16) {
        const passages = index.passages.slice(start, start + 16).map(p => ({ ...p, lexicalText: searchTokens(`${p.title} ${p.original}`).join(" ") }));
        const result = await call("append", { generation: index.generation, space: index.space, passages }, signal);
        if (result.status !== "appended" || result.count !== passages.length) throw new Error("persistent_index_append_failed");
      }
      if ((await call("publish", { generation: index.generation }, signal)).status !== "ready") throw new Error("persistent_index_publication_failed");
    },
    async manifest(signal: AbortSignal) { return manifest(await call("manifest", {}, signal)); },
    async search(pinned: Manifest, concern: SearchConcern, family: "hadith" | "scholar", signal: AbortSignal) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(concern.id) || !concern.text.trim() || concern.text.length > 500
        || !["hadith", "scholar"].includes(family) || concern.phrases.length > 12
        || concern.phrases.some(p => !p.trim() || p.length > 120) || concern.exactReferences.length > 12
        || concern.exactReferences.some(p => !p.trim() || p.length > 200)
        || (concern.vector && (!sameSpace(concern.vector.space, pinned.space) || !validVector(concern.vector.values, pinned.space.dimensions)))) throw new Error("persistent_index_invalid_query");
      if (Date.parse(pinned.expiresAt) <= Date.now()) throw new Error("persistent_index_not_ready");
      // Normalise lookup text only. Exact Arabic originals never change.
      const phrases = (concern.phrases.length ? concern.phrases : [concern.text]).map(p => searchTokens(p).join(" ")).filter(Boolean);
      if (phrases.some(p => p.length > 120)) throw new Error("persistent_index_query_too_long");
      const result = await call("search", { generation: pinned.generation, space: pinned.space, family, phrases,
        references: concern.exactReferences, ...(concern.vector ? { vector: concern.vector.values } : {}) }, signal);
      if (result.status !== "ready" || result.generation !== pinned.generation || result.lookup_revision !== SOURCE_LOOKUP_REVISION || !object(result.space) || !sameSpace(result.space as VectorSpace, pinned.space)
        || !Array.isArray(result.hits) || result.hits.length > 60
        || !Number.isSafeInteger(result.eligible) || (result.eligible as number) < 0
        || !Number.isSafeInteger(result.semantic_eligible) || (result.semantic_eligible as number) < 0
        || (result.semantic_eligible as number) > (result.eligible as number)) throw new Error("persistent_index_invalid_response");
      const ids = new Set<string>();
      const hits: SearchHit[] = result.hits.map((raw: unknown) => {
        if (!object(raw) || !object(raw.passage) || !object(raw.ranks) || typeof raw.score !== "number" || !Number.isFinite(raw.score) || raw.score <= 0) throw new Error("persistent_index_invalid_hit");
        const p = raw.passage as SearchIndex["passages"][number];
        if (p.family !== family || passageProblem(p, new Date(), false) || !p.parentOriginalHash || !p.sourceFingerprint || p.vector || ids.has(p.id)) throw new Error("persistent_index_invalid_hit");
        ids.add(p.id);
        const rawRanks = raw.ranks;
        const methods = Object.keys(rawRanks);
        if (!methods.length || methods.some(m => !["exact", "lexical", "semantic"].includes(m)
          || !Number.isSafeInteger(rawRanks[m]) || (rawRanks[m] as number) < 1 || (rawRanks[m] as number) > 20)
          || (methods.includes("semantic") && !concern.vector)) throw new Error("persistent_index_invalid_ranks");
        const ranks = raw.ranks as SearchHit["ranks"];
        const expected = Object.values(ranks).reduce((sum, rank) => sum + 1 / (60 + rank!), 0);
        if (Math.abs(expected - raw.score) > 1e-8) throw new Error("persistent_index_invalid_fusion");
        return { passage: p, concernIds: [concern.id], methods: methods as SearchHit["methods"], fusionScore: raw.score, ranks };
      });
      return { generation: pinned.generation, hits, eligible: result.eligible as number, semanticEligible: result.semantic_eligible as number };
    },
    async withdraw(generation: string, signal: AbortSignal) {
      if ((await call("withdraw", { generation }, signal)).status !== "withdrawn") throw new Error("persistent_index_withdraw_failed");
    },
    async prune(signal: AbortSignal) {
      if ((await call("prune", {}, signal)).status !== "pruned") throw new Error("persistent_index_prune_failed");
    },
  };
}
