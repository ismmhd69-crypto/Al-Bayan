import type { EvidencePackage, SelectedPassage } from "./retrieval";

/** Derived only from originals already admitted by retrieval. No new source,
 * annotation, external page or source approval can enter through this record. */
export type ApprovedContext = { source_id: string; arabic: string; location: string;
  relationship: "neighbouring_verse" | "selected_scholar_explanation"; citable: boolean };

export function approvedContext(passage: SelectedPassage, pack: EvidencePackage): ApprovedContext[] {
  const neighbours: ApprovedContext[] = passage.context.map(v => ({ source_id: `Q${v.key}`, arabic: v.arabic,
    location: `Quran ${v.key}`, relationship: "neighbouring_verse", citable: pack.passages.some(p => p.id === `Q${v.key}`) }));
  // A shared topic is insufficient to infer that a scholar explains this exact
  // passage. Link only an explicit, already selected canonical source ID.
  const named: ApprovedContext[] = (passage.explanationSourceIds ?? []).flatMap(id => {
    const p = pack.passages.find(p => p.id === id && p.source.kind === "scholar");
    if (!p || p.source.kind !== "scholar") return [];
    return [{ source_id: p.id, arabic: p.source.quote.arabic, location: p.source.quote.url,
      relationship: "selected_scholar_explanation" as const, citable: true }];
  });
  return [...neighbours, ...named];
}
