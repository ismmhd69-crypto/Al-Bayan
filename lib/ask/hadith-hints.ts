import type { Hadith } from "@/lib/sources/hadith-rules";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { abortable } from "./abort";

export type HadithHintLookup = {
  getHadith?: (id: string) => Promise<Hadith | null>;
  resolveHadithHint?: (id: string, signal?: AbortSignal) => Promise<Hadith[]>;
};

/** Hints aid discovery only. Keep identity lookups distinct from resolving a hint
 * into the configured source collection; never relabel HE text as an SH source. */
export async function resolveHadithHints(deps: HadithHintLookup, ids: string[], signal: AbortSignal): Promise<Hadith[]> {
  signal.throwIfAborted();
  const results = await Promise.allSettled([...new Set(ids)].slice(0, 3).map(async id => {
    if (!/^HE\d+$/.test(id)) return [];
    if (deps.resolveHadithHint) return abortable(deps.resolveHadithHint(id, signal), signal);
    const hadith = deps.getHadith ? await abortable(deps.getHadith(id.slice(2)), signal) : null;
    return hadith ? [hadith] : [];
  }));
  signal.throwIfAborted();
  return [...new Map(results.flatMap(r => r.status === "fulfilled" ? r.value.filter(hadithAllowed) : []).map(h => [h.id, h])).values()];
}

export async function resolveLibraryHadithHint(id: string, lookup: (id: string) => Promise<Hadith | null>,
  byReference: (collection: "bukhari" | "muslim", number: number, signal?: AbortSignal) => Promise<Hadith[]>, signal?: AbortSignal): Promise<Hadith[]> {
  if (!/^HE\d+$/.test(id)) return [];
  signal?.throwIfAborted();
  const hint = await lookup(id.slice(2));
  if (!hint || hint.id !== id || !hadithAllowed(hint)) return [];
  signal?.throwIfAborted();
  const results = await Promise.all((["bukhari", "muslim"] as const).map(async collection => {
    const number = hint.numbers[collection];
    if (number === null) return [];
    return (await byReference(collection, number, signal)).filter(h => h.id.startsWith("SH") && hadithAllowed(h)
      && h.collection === collection && h.numbers[collection] === number);
  }));
  signal?.throwIfAborted();
  return [...new Map(results.flat().map(h => [h.id, h])).values()];
}
