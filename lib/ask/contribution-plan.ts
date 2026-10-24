import type { JsonSchema } from "@/lib/ai/types";
import type { SelectedPassage, QuestionFrame } from "./retrieval";

export const CONTRIBUTION_PURPOSES = ["answer", "qualification", "background", "example", "corroboration", "difference"] as const;
export type ContributionUnit = {
  sourceIds: string[]; requirementIds: string[];
  purpose: typeof CONTRIBUTION_PURPOSES[number]; necessary: boolean; description: string;
};

export const CONTRIBUTION_PLAN_RULES = `Also return evidence_plan: a small set of distinct contributions, not a source quota. Each unit records contribution (a short description of the meaning added), source_ids (ALL excerpts jointly needed for that contribution), requirement_ids, purpose and necessary as yes/no. Mark every unit needed to resolve a requested concern or preserve a qualification necessary yes. Several units may be necessary for the SAME requested concern: do not treat one partial answer as complete. Use purpose answer for directly supported answer content; qualifications, background and limited examples retain their actual role. Optional units must add a distinct explanation, useful corroboration or relevant difference. Do not split one repeated principle into several differently worded units. Do not include every eligible source merely because space remains. Several citations in one unit are allowed only when each is needed for its meaning or qualification; optional corroboration is a separate unit. Mark distinct_contribution yes on EVERY source used in this plan, including direct sources, and no/unsure on redundant/uncertain candidates. A known verse or authentic hadith may establish explicit general teaching without a mandatory scholar citation. Derived rulings, disputed interpretation and personal application still require appropriate named scholarly evidence. In a partial source preview, include useful source contributions without claiming full coverage. The plan is a proposal for checking, not proof that its wording follows from the originals.`;

export function contributionPlanSchema(requirementIds: string[]): JsonSchema {
  return { type: "array", maxItems: 12, items: { type: "object", properties: {
    contribution: { type: "string", maxLength: 180 },
    source_ids: { type: "array", maxItems: 8, items: { type: "string" } },
    requirement_ids: { type: "array", maxItems: 4, items: { type: "string", enum: requirementIds } },
    purpose: { type: "string", enum: [...CONTRIBUTION_PURPOSES] }, necessary: { type: "string", enum: ["yes", "no"] },
  }, required: ["contribution", "source_ids", "requirement_ids", "purpose", "necessary"] } };
}

/** Checks identity and coverage only. The independent claim checks still judge meaning. */
export function parseContributionPlan(raw: unknown, passages: SelectedPassage[], frame: QuestionFrame, partial: boolean,
  assessments: Record<string, unknown>[], fail: (code: string) => null): ContributionUnit[] | null {
  if (!Array.isArray(raw) || !raw.length || raw.length > 12) return fail("evidence_plan_missing_or_invalid");
  const byId = new Map(passages.map(p => [p.id, p])), meanings = new Set<string>();
  const units: ContributionUnit[] = [];
  const strings = (v: unknown, max: number): v is string[] => Array.isArray(v) && v.length > 0 && v.length <= max
    && v.every(id => typeof id === "string") && new Set(v).size === v.length;
  for (const value of raw) {
    const r = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
    if (!r || typeof r.contribution !== "string" || !r.contribution.trim() || r.contribution.length > 180
      || !strings(r.source_ids, 8) || !strings(r.requirement_ids, 4)
      || !CONTRIBUTION_PURPOSES.includes(r.purpose as typeof CONTRIBUTION_PURPOSES[number]) || typeof r.necessary !== "string" || !["yes", "no"].includes(r.necessary)) return fail("evidence_plan_unit_invalid");
    const meaning = r.contribution.trim().normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase("en");
    if (meanings.has(meaning)) return fail("evidence_plan_repetition");
    meanings.add(meaning);
    if (r.source_ids.some(id => !byId.has(id))) return fail("evidence_plan_source_ineligible");
    if (r.requirement_ids.some(id => !frame.requirements.some(req => req.id === id))) return fail("evidence_plan_requirement_unknown");
    const sourceIds = r.source_ids;
    for (const id of r.source_ids) {
      const rows = assessments.filter(a => a.source_id === id), p = byId.get(id)!;
      if (rows.length !== 1 || rows[0].distinct_contribution !== "yes") return fail("evidence_plan_source_not_distinct");
      const links = [...p.requirementIds, ...p.explanationRequirementIds ?? []];
      if (!r.requirement_ids.some(req => links.includes(req))) return fail("evidence_plan_source_unrelated");
      if (r.purpose === "answer" && (p.contribution?.role !== "direct" || !r.requirement_ids.some(req => p.requirementIds.includes(req)))) return fail("evidence_plan_answer_not_direct");
      if (p.contribution?.role === "limited_example" && r.purpose !== "example") return fail("evidence_plan_example_scope");
    }
    // Every named point must have supporting evidence in this unit; an unrelated source cannot
    // be attached to an already covered point simply to satisfy the overall coverage flag.
    if (r.requirement_ids.some(req => !sourceIds.some(id => (r.purpose === "answer"
      ? byId.get(id)!.requirementIds : [...byId.get(id)!.requirementIds, ...byId.get(id)!.explanationRequirementIds ?? []]).includes(req)))) return fail("evidence_plan_unit_coverage_missing");
    units.push({ sourceIds: r.source_ids, requirementIds: r.requirement_ids,
      purpose: r.purpose as ContributionUnit["purpose"], necessary: r.necessary === "yes", description: r.contribution.trim() });
  }
  if (!partial && frame.requirements.some(req => !units.some(u => u.necessary && u.purpose === "answer" && u.requirementIds.includes(req.id)))) return fail("evidence_plan_coverage_missing");
  return units;
}
