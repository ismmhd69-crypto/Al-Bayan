import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { isRealVerse } from "@/lib/sources/quran-meta";
import type { PassageForSelection } from "../retrieval";

/** Discovery is not approval. Preserve configured source boundaries and source identity
 * before independently selecting and checking these original-text candidates. */
export function eligibleCorpusCandidates(items: PassageForSelection[], availability: Partial<Record<"hadith" | "scholar", boolean>> = {}) {
  if (!Array.isArray(items) || items.length > 60) throw new Error("invalid_corpus_candidates");
  const ids = new Set<string>();
  return items.filter(c => {
    if (!c || typeof c.id !== "string" || !c.source || !Array.isArray(c.context) || ids.has(c.id)) throw new Error("invalid_corpus_candidate_identity");
    ids.add(c.id);
    if (c.source.kind === "hadith") return availability.hadith !== false && c.id === c.source.hadith.id && hadithAllowed(c.source.hadith);
    if (c.source.kind === "scholar") return availability.scholar !== false && c.id === c.source.quote.id && scholarQuoteAllowed(c.source.quote);
    if (c.source.kind !== "quran") throw new Error("invalid_corpus_source_kind");
    const [surah, ayah] = c.source.verse.key.split(":").map(Number);
    return c.id === `Q${c.source.verse.key}` && isRealVerse(surah, ayah);
  });
}
