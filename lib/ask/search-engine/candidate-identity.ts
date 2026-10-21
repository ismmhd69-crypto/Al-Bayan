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
export function uniqueResearchCandidates(candidates: PassageForSelection[]): PassageForSelection[] {
  const identities = new Map<string, PassageForSelection>(), ids = new Map<string, PassageForSelection>();
  for (const c of candidates) {
    const identity = candidateIdentity(c), previous = identities.get(identity) ?? ids.get(c.id);
    if (previous) {
      const combined = [...new Set([...(previous.retrievedFor ?? []), ...(c.retrievedFor ?? [])])];
      if (combined.length) previous.retrievedFor = combined;
      continue;
    }
    const retained = { ...c };
    identities.set(identity, retained); ids.set(c.id, retained);
  }
  return [...identities.values()];
}
