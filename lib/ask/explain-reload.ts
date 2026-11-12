import type { PipelineDeps } from "./core";
import type { PassageForSelection } from "./retrieval";
import { passageRecord, type PassageRecord } from "./passage-record";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { abortable } from "./abort";

type Loaders = Pick<PipelineDeps, "getVerse" | "neighbours" | "getStoredHadith" | "getStoredScholar">;

/** Reload every signed passage by its own ID and compare it with the hash that was checked
 * earlier. Null means "search instead": anything missing, changed or no longer eligible.
 * Nothing here approves a source for an answer; selection and final review still run. */
export async function reloadCheckedPassages(records: PassageRecord[], deps: Loaders, signal: AbortSignal, retrievedFor: string[]): Promise<PassageForSelection[] | null> {
  if (!records.length || records.length > 8 || new Set(records.map(r => r.id)).size !== records.length) return null;
  try {
    const loaded = await Promise.all(records.map(async (record): Promise<PassageForSelection | null> => {
      if (record.kind === "quran") {
        const key = record.id.slice(1), verse = await abortable(deps.getVerse(key), signal);
        if (!verse || verse.key !== key) return null;
        const context = (await abortable(deps.neighbours(key), signal)).filter(v => v.key !== key);
        const current = passageRecord({ id: record.id, kind: "quran", original: verse.arabic,
          context: [...context].sort((a, b) => a.key.localeCompare(b.key)).map(v => ({ key: v.key, arabic: v.arabic })) });
        return current && current.original === record.original && current.context === record.context
          ? { id: record.id, source: { kind: "quran", verse }, context, retrievedFor } : null;
      }
      if (record.kind === "hadith") {
        const hadith = await abortable(deps.getStoredHadith?.(record.id.slice(2)) ?? Promise.resolve(null), signal);
        if (!hadith || hadith.id !== record.id || !hadithAllowed(hadith)) return null;
        return passageRecord({ id: record.id, kind: "hadith", original: hadith.arabic })?.original === record.original
          ? { id: record.id, source: { kind: "hadith", hadith }, context: [], retrievedFor } : null;
      }
      // Reads the current row and re-runs the published, rights and approved-scholar gates.
      const quote = await abortable(deps.getStoredScholar?.(record.id) ?? Promise.resolve(null), signal);
      if (!quote || quote.id !== record.id || !scholarQuoteAllowed(quote)) return null;
      return passageRecord({ id: record.id, kind: "scholar", original: quote.arabic })?.original === record.original
        ? { id: record.id, source: { kind: "scholar", quote }, context: [], contextAvailability: "stored_excerpt_only", retrievedFor } : null;
    }));
    return loaded.every((p): p is PassageForSelection => !!p) ? loaded : null;
  } catch { signal.throwIfAborted(); return null; }
}
