import type { PassageForSelection, QuestionFrame } from "../retrieval";
import { hadithAllowed, mapStoredHadith } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { textHash, type SearchFamily, type SearchIndex } from "./contract";
import { retrieveFromCorpus, type QueryEmbedder, type CorpusRetrieval } from "./corpus-retrieval";
import type { Verse } from "@/lib/sources/quran-meta";

/** Reconstructs authoritative parent text, not a standalone search fragment.
 * Final evidence selection still judges relevance, scope and support. */
export async function corpusCandidates(frame: QuestionFrame, load: () => Promise<SearchIndex>, options: {
  signal: AbortSignal; embedder?: QueryEmbedder; allowLexicalOnly?: boolean; getVerse?: (key: string) => Promise<Verse | undefined>;
  families?: SearchFamily[];
  onDiscovery?: (result: CorpusRetrieval) => void;
}): Promise<PassageForSelection[]> {
  const found = await retrieveFromCorpus(frame, load, { signal: options.signal, embedder: options.embedder, limit: 60, families: options.families });
  options.onDiscovery?.(found);
  if (found.semantic !== "used" && !options.allowLexicalOnly) throw new Error("corpus_semantic_provider_not_ready");
  return discoveredCorpusCandidates(found, options);
}

/** Shared parent reconstruction for filesystem and persistent discovery. */
export async function discoveredCorpusCandidates(found: CorpusRetrieval, options: {
  signal: AbortSignal; getVerse?: (key: string) => Promise<Verse | undefined>;
}): Promise<PassageForSelection[]> {
  const byParent = new Map<string, typeof found.hits[number]>();
  for (const hit of found.hits) {
    const prior = byParent.get(hit.passage.sourceId);
    if (prior) prior.concernIds = [...new Set([...prior.concernIds, ...hit.concernIds])];
    else byParent.set(hit.passage.sourceId, { ...hit, concernIds: [...hit.concernIds] });
  }
  const result: PassageForSelection[] = [];
  for (const hit of byParent.values()) {
    options.signal.throwIfAborted();
    const p = hit.passage, original = p.context.before + p.original + p.context.after;
    if (p.language !== "ar") continue; // Translation search views need their Arabic original, never relabel them.
    if (!p.parentOriginalHash || textHash(original) !== p.parentOriginalHash) throw new Error("corpus_parent_fingerprint_missing");
    const contextAvailability = p.context.complete ? "complete_parent" as const : "stored_excerpt_only" as const;
    const common = { context: [], retrievedFor: hit.concernIds, contextAvailability };
    if (p.family === "hadith") {
      if (!p.context.complete) continue; // Continuation reports need their antecedent.
      const hadith = mapStoredHadith({ id: p.sourceId, kind: "hadith", scholar_id: null, published: true, reference: p.reference, collection: p.attribution.collection ?? null, grade: p.attribution.grade ?? null,
        text_original: original, url: p.canonicalUrl, title: p.title });
      if (hadith && hadithAllowed(hadith)) result.push({ ...common, id: hadith.id, source: { kind: "hadith", hadith } });
    } else if (p.family === "scholar") {
      if (!p.attribution.scholarId || !p.attribution.scholarName) continue;
      const quote = { id: `S${p.sourceId}`, scholarId: p.attribution.scholarId, scholarName: p.attribution.scholarName, title: p.title, reference: p.reference, arabic: original, url: p.canonicalUrl };
      if (scholarQuoteAllowed(quote)) result.push({ ...common, id: quote.id, source: { kind: "scholar", quote } });
    } else if (p.family === "quran" && options.getVerse) {
      const verse = await options.getVerse(p.reference);
      options.signal.throwIfAborted();
      if (verse && verse.arabic === original) result.push({ ...common, id: `Q${verse.key}`, source: { kind: "quran", verse } });
    }
  }
  return result;
}
