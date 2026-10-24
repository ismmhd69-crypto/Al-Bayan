import type { Claim } from "./checks";

export type ReviewAnchor = { anchor_id: string; source_id: string; original_excerpt: string };
/** Exact contiguous originals, never generated display text. The full originals/context
 * still accompany the review. Anchors bind identity, not semantic support. */
export function reviewAnchors(items: Claim[], serialized: unknown): Record<string, ReviewAnchor[]> {
  const passages = (serialized as { passages?: { id: string; arabic?: string }[] } | null)?.passages ?? [];
  return Object.fromEntries(items.map((claim, i) => {
    const claimId = `C${i + 1}`, anchors: ReviewAnchor[] = [];
    for (const id of claim.refs) {
      const original = passages.find(p => p.id === id)?.arabic;
      if (typeof original !== "string") continue;
      let chunk = "";
      const append = () => { if (chunk.trim()) anchors.push({ anchor_id: `${claimId}E${anchors.length + 1}`, source_id: id, original_excerpt: chunk.trim() }); chunk = ""; };
      for (const word of original.match(/\S+\s*/gu) ?? []) {
        if (Array.from(chunk + word).length > 600) append();
        // Unexpected oversized tokens cannot supply acceptable proof.
        if (Array.from(word).length > 600) continue;
        chunk += word;
      }
      append();
    }
    return [claimId, anchors];
  }));
}
