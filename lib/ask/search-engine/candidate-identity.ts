import { createHash } from "node:crypto";
import type { PassageForSelection } from "../retrieval";

function canonicalPage(raw: string): string {
  try {
    const url = new URL(raw); url.hash = "";
    // The official provider identifies a fatwa by numeric ID. Its presentation
    // slug may change spelling or encoding without changing the source page.
    const fatwa = url.hostname === "binbaz.org.sa" && url.pathname.match(/^\/fatwas\/(\d+)(?:\/|$)/);
    if (fatwa) return `${url.origin}/fatwas/${fatwa[1]}`;
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort(); return url.toString();
  } catch { return raw; }
}
export const canonicalSourcePage = canonicalPage;
export function candidateIdentity(candidate: PassageForSelection): string {
  if (candidate.source.kind !== "scholar") return candidate.id;
  const q = candidate.source.quote;
  return `${q.scholarId}:${canonicalPage(q.url)}:${createHash("sha256").update(q.arabic).digest("hex")}`;
}
/** Distinct reads of one identity must not silently overwrite or conceal changed originals. */
function sourceRevision(c: PassageForSelection): string {
  const s = c.source;
  const fields = s.kind === "quran" ? [s.kind, s.verse.key, s.verse.arabic, s.verse.translations.en, s.verse.translations.de, canonicalPage(s.verse.url)]
    : s.kind === "hadith" ? [s.kind, s.hadith.id, s.hadith.arabic, s.hadith.collection, s.hadith.numbers, s.hadith.gradeAr,
      s.hadith.attributionAr, s.hadith.translations.en, s.hadith.translations.de, s.hadith.chapter ?? null, canonicalPage(s.hadith.url)]
    : [s.kind, s.quote.scholarId, s.quote.arabic, s.quote.title, s.quote.reference, s.quote.scholarName.ar, s.quote.scholarName.en, s.quote.scholarName.de, canonicalPage(s.quote.url)];
  return createHash("sha256").update(JSON.stringify(fields)).digest("hex");
}
export function uniqueResearchCandidates(candidates: PassageForSelection[]): PassageForSelection[] {
  const identities = new Map<string, PassageForSelection>(), ids = new Map<string, PassageForSelection>();
  const revisions = new Map<string, string>();
  for (const c of candidates) {
    const revision = sourceRevision(c);
    if (revisions.has(c.id) && revisions.get(c.id) !== revision) throw new Error("research_candidate_identity_changed");
    revisions.set(c.id, revision);
    const identity = candidateIdentity(c), previous = identities.get(identity) ?? ids.get(c.id);
    if (previous) {
      const contexts = new Map(previous.context.map(v => [v.key, v]));
      for (const v of c.context) {
        const existing = contexts.get(v.key);
        if (existing && existing.arabic !== v.arabic) throw new Error("research_context_identity_changed");
        contexts.set(v.key, v);
      }
      previous.context = [...contexts.values()];
      if (c.contextAvailability === "stored_excerpt_only") previous.contextAvailability = "stored_excerpt_only";
      const combined = [...new Set([...(previous.retrievedFor ?? []), ...(c.retrievedFor ?? [])])];
      if (combined.length) previous.retrievedFor = combined;
      ids.set(c.id, previous);
      continue;
    }
    const retained = { ...c };
    identities.set(identity, retained); ids.set(c.id, retained);
  }
  return [...identities.values()];
}
