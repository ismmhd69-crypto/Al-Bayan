// Tiered evidence (ASK_TIERED=true, docs/tiered-ask-plan.md). Mo's order: Quran first, then hadith,
// then scholars' fatwas, then videos. Search still runs in parallel; the order applies to selection,
// writing and display. One selection call judges three separate lists, so a fatwa written as an answer
// can no longer push out a verse or hadith that speaks to the question directly.
// Pure helpers only: core.ts wires them into the pipeline, and every existing safety check still runs.

import type { JsonSchema } from "@/lib/ai/types";
import { hasRulingTerm, type Claim, type StructuredDraft } from "./checks";
import type { PackageCaps } from "./package";
import type { PassageForSelection, Source } from "./retrieval";
import { contributionPlanSchema } from "./contribution-plan";

export type Tier = Source["kind"]; // "quran" | "hadith" | "scholar"
export const TIERS: readonly Tier[] = ["quran", "hadith", "scholar"];
const TIER_RANK: Record<Tier, number> = { quran: 0, hadith: 1, scholar: 2 };

// Candidates the selector sees per tier (ASK_LEAN still takes the smaller number).
export const TIER_CANDIDATE_LIMITS = { quran: 8, hadith: 4, scholar: 5 } as const;
// Package: up to 2 verses, 2 hadith and 3 scholar quotes. Caps are per kind, so one tier can never
// take another tier's place.
export const TIER_PACKAGE_CAPS: PackageCaps = { quranCards: 2, quranVerses: 2, hadith: 2, scholar: 3, passages: 7 };

export const TIERED_UNDERSTAND_RULES = `
Also return two more Arabic phrase lists (Arabic script only, 2 to 6 words each, at most 3 each; a hadith phrase may have up to 8 words):
- search_queries_quran_ar: the wording a Quran verse that speaks directly to this question would use (Quranic vocabulary, not a fatwa title). Use an empty list if you know of no such verse.
- search_queries_hadith_ar: the wording of a Sahih al-Bukhari or Sahih Muslim hadith on this question, as the Prophet's own words would put it (for example "إنما الأعمال بالنيات" for intentions). Use an empty list if you know of no such hadith.
search_queries_ar stays the scholar-library (fatwa) wording described above. Do not repeat the same phrase in two lists.`;

export const TIERED_EVIDENCE_RULES = `
TIERED INPUT: the candidates come in three separate lists: quran_candidates, hadith_candidates and scholar_candidates. Return one assessment per candidate in the matching list: quran_assessments, hadith_assessments, scholar_assessments. Never move an id to another list.
The position field is a scholarly-disagreement label only. It must be the empty string for every Quran and hadith assessment, including direct evidence. Never label a hadith position-a merely because it agrees with a scholar.
Judge each list on its own. A verse or hadith is direct when its own words speak directly to a requested point, even when a scholar quote answers the same point more fully or more practically. Never mark a verse or hadith lower because a scholar quote exists, and never mark a scholar quote lower because a verse or hadith exists. A list may have no direct item at all; that is fine.`;

export const TIERED_DRAFT_RULES = `
11. TIERED ORDER. The sealed package lists Quran verses first, then hadith, then scholar quotes. Write simple_answer in that order: first what the Quran states (citing the verse), then what the Prophet taught (citing the hadith), then the scholars' ruling (citing the scholar quote and naming the scholar). Give at least one sentence for every source type present in the package.
12. Only approved scholars give rulings. A ruling word (halal, haram, obligatory, forbidden, prohibited, allowed, permissible, lawful, unlawful, sinful, or the same in German or Arabic) may appear only in a sentence that cites a scholar quote. This also applies when you introduce it with 'The Quran states': that phrase is not an exemption. A sentence citing only a verse or hadith restates what that passage says, without ruling words and without drawing a ruling from it. When both a verse and a scholar explicitly state the same fact, a sentence may cite both, but attribute the ruling to the named scholar; never add a scholar citation that does not explicitly support the claim.`;

export const CONTRIBUTION_FIELDS: Record<string, JsonSchema> = {
  contribution: { type: "object", properties: {
    role: { type: "string", enum: ["direct", "background", "limited_example"] },
    scope: { type: "string", enum: ["general", "case_specific"] },
    conditions: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 6 },
  }, required: ["role", "scope", "conditions"] },
  scope_matches_question: { type: "string", enum: ["yes", "no", "unsure"] },
  related_requirement_ids: { type: "array", items: { type: "string" }, maxItems: 4 },
  distinct_contribution: { type: "string", enum: ["yes", "no", "unsure"] },
};

export const CONTRIBUTION_RULES = `RICH EVIDENCE CONTRACT, overriding the legacy whole-point relevance definitions above: assess support for individual explicit statements separately from completeness of the entire requested point. A direct passage supplies an explicit answer statement; a partial passage with role direct supplies an explicit complementary part of an answer, never an inferred fact. Assign supported_requirement_ids only to these direct contributions when scope_matches_question is yes. Several direct contributions can jointly establish a complete answer; verify that the combined originals really establish every necessary step and condition before marking coverage complete. A missing explanation or cause cannot be invented by combining merely related facts.
Background and limited_example passages may be context or partial and must have empty supported_requirement_ids. They may explain a relevant principle without settling the requested procedure. Record related_requirement_ids identifying the actual question parts they help explain, and distinct_contribution yes only if the original adds a useful explanation or qualification not duplicated by better evidence. Mention-only and unrelated candidates are never usable context. Do not classify relevant background as mention_only simply because it does not answer the entire question.
For every candidate record contribution role, scope and conditions stated in its original. A case-specific passage cannot establish a universal instruction. Limited examples retain their audience and conditions and never count as direct coverage for a general question. Preserve the reader's question; never add a requested point to fit the sources. These rules apply to every topic. Search hints and familiar references do not approve evidence.`;

export const assessmentItem = (requirementIds: string[], rich = false): Extract<JsonSchema, { type: "object" }> => ({
  type: "object",
  properties: {
    source_id: { type: "string" },
    relevance: { type: "string", enum: ["direct", "partial", "context", "mention_only", "unrelated"] },
    supported_requirement_ids: { type: "array", items: { type: "string", enum: requirementIds } },
    context_safe: { type: "string", enum: ["yes", "no", "unsure"] },
    position: { type: "string" },
    ...(rich ? CONTRIBUTION_FIELDS : {}),
  },
  required: ["source_id", "relevance", "supported_requirement_ids", "context_safe", "position", ...(rich ? Object.keys(CONTRIBUTION_FIELDS) : [])],
});

export function tieredSelectionSchema(requirementIds: string[], rich = false, distinct = false): JsonSchema {
  const list: JsonSchema = { type: "array", items: assessmentItem(requirementIds, rich) };
  const original = assessmentItem(requirementIds, rich);
  const revelation: JsonSchema = { type: "array", items: { ...original, properties: { ...original.properties, position: { type: "string", enum: [""] } } } };
  return {
    type: "object",
    properties: {
      status: { type: "string", enum: ["ready", "insufficient", "ambiguous", "conflicting"] },
      coverage: { type: "string", enum: ["complete", "incomplete", "uncertain"] },
      conflict_type: { type: "string", enum: ["none", "revelation_conflict", "scholar_difference", "uncertain"] },
      quran_assessments: revelation,
      hadith_assessments: revelation,
      scholar_assessments: list,
      ...(distinct ? { evidence_plan: contributionPlanSchema(requirementIds) } : {}),
    },
    required: ["status", "coverage", "conflict_type", "quran_assessments", "hadith_assessments", "scholar_assessments", ...(distinct ? ["evidence_plan"] : [])],
  };
}

/** Splits candidates (already shaped for the selector) into the three tier lists. */
export function tierLists<T>(candidates: PassageForSelection[], shape: (candidate: PassageForSelection) => T) {
  const of = (tier: Tier) => candidates.filter((candidate) => candidate.source.kind === tier).map(shape);
  return { quran_candidates: of("quran"), hadith_candidates: of("hadith"), scholar_candidates: of("scholar") };
}

/**
 * Turns the tiered selector output into the existing flat shape, so the same strict parser, retry
 * logic and package rules apply. An id in the wrong list, or a list that is missing, fails closed.
 */
export function flattenTieredSelection(raw: unknown, candidates: PassageForSelection[]): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const kindById = new Map(candidates.map((candidate) => [candidate.id, candidate.source.kind]));
  const assessments: unknown[] = [];
  for (const tier of TIERS) {
    const list = record[`${tier}_assessments`];
    if (!Array.isArray(list)) return null;
    for (const item of list) {
      const id = item && typeof item === "object" ? (item as Record<string, unknown>).source_id : undefined;
      // Unknown ids are left for the flat parser, which refuses them; known ids must sit in their own list.
      if (typeof id === "string" && kindById.has(id) && kindById.get(id) !== tier) return null;
      assessments.push(item);
    }
  }
  return { status: record.status, coverage: record.coverage, conflict_type: record.conflict_type, assessments,
    ...(record.evidence_plan !== undefined ? { evidence_plan: record.evidence_plan } : {}) };
}

export type KindOf = (id: string) => Tier | undefined;

const claimRank = (claim: Claim, kindOf: KindOf) =>
  Math.min(...claim.refs.map((id) => { const kind = kindOf(id); return kind ? TIER_RANK[kind] : 3; }));

/**
 * Code puts the simple answer in tier order (a sentence ranks by the earliest kind it cites). Stable,
 * so sentences of one tier keep the writer's order. List items keep the source's own order.
 */
export function orderDraftByTier(draft: StructuredDraft, kindOf: KindOf): StructuredDraft {
  const directAnswer = draft.directAnswer
    .map((claim, index) => ({ claim, index, rank: claimRank(claim, kindOf) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.claim);
  return {
    ...draft,
    directAnswer,
    claims: [...directAnswer, ...draft.list, ...draft.explanation.flatMap((section) => section.sentences)],
  };
}

/** Tiers present in the package that the simple answer and list never cite. */
export function missingTiers(draft: StructuredDraft, packageTiers: Iterable<Tier>, kindOf: KindOf): Tier[] {
  const cited = new Set([...draft.directAnswer, ...draft.list].flatMap((claim) => claim.refs.map(kindOf)));
  return TIERS.filter((tier) => [...packageTiers].includes(tier) && !cited.has(tier));
}

/** Rulings come only from approved scholars: a ruling word needs a cited scholar quote. */
export function rulingWithoutScholar(claims: Claim[], kindOf: KindOf): boolean {
  return claims.some((claim) => hasRulingTerm(claim.text) && !claim.refs.some((id) => kindOf(id) === "scholar"));
}

/** Videos are added only when the checked answer was ready within the budget. */
export function videoBudgetAllows(elapsedMs: number, budgetMs: number): boolean {
  return budgetMs > 0 && elapsedMs <= budgetMs;
}
