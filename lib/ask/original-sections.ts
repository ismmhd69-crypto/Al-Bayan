import type { Locale } from "@/lib/i18n";
import { toEvidence, type PipelineDeps } from "./core";
import type { EvidencePackage } from "./retrieval";
import { validRichSection, validDisplayTranslation, hasDisplayTranslation, type RichSection } from "./rich-answer";
import { displayAlignmentRequest, parseDisplayAlignment } from "./focused-checks";
import { abortable } from "./abort";

/** Selection has checked relevance, identity and context. No generated source prose. */
export async function originalSection(group: "quran" | "hadith" | "scholar", pack: EvidencePackage,
  language: Locale, deps: PipelineDeps, signal: AbortSignal, checkedTranslations?: Map<string, import("./rich-answer").DisplayTranslation>): Promise<RichSection> {
  signal.throwIfAborted();
  const sources = pack.passages.filter(p => p.source.kind === group).map(p => ({
    id: p.id, evidence: toEvidence(p.source, language), role: p.contribution?.role ?? "direct" as const,
    requirementIds: p.requirementIds, explanationRequirementIds: p.explanationRequirementIds ?? [],
  }));
  const section: RichSection = { group, outcome: sources.length ? "ready" : "no_direct_evidence",
    ...(sources.length ? { presentation: "originals" as const } : {}), claims: [], sources };
  if (group !== "quran" && language !== "ar" && checkedTranslations) {
    for (const s of section.sources) if (hasDisplayTranslation(s)) s.displayTranslation = checkedTranslations.get(s.id) ?? { status: "unavailable" };
  }
  if (group === "scholar" && language !== "ar" && deps.displayTranslationLookup && !checkedTranslations) {
    try {
      const available = await abortable(deps.displayTranslationLookup(sources, language, signal), signal);
      const candidates = sources.flatMap(s => {
        const t = available.get(s.id);
        return t?.status === "ready" && validDisplayTranslation(t, s.evidence.arabic, language)
          ? [{ source_id: s.id, original: t.original, original_hash: t.originalHash, text: t.text, language: t.language }] : [];
      });
      // Review available translations only. Never commission a new translation.
      const alignment = candidates.length
        ? parseDisplayAlignment(await abortable(deps.verifier.generateJson(displayAlignmentRequest(candidates, signal)), signal), candidates) : null;
      for (const s of section.sources) {
        const t = available.get(s.id);
        s.displayTranslation = t?.status === "ready" && alignment?.valid && alignment.acceptedIds.includes(s.id) ? t : { status: "unavailable" };
      }
    } catch {
      signal.throwIfAborted();
      for (const s of section.sources) s.displayTranslation = { status: "lookup_failed" };
    }
  }
  if (!validRichSection(section, language)) throw Error("invalid_original_section");
  return section;
}
